use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261022_100600_schema_ai_table_message_citations"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE SCHEMA IF NOT EXISTS ai;
                CREATE TABLE IF NOT EXISTS ai.message_citations (
    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
    message_id uuid NOT NULL REFERENCES ai.messages(id),
    chunk_id uuid NOT NULL REFERENCES ai.chunks(id),
    regulation_id uuid NOT NULL REFERENCES regulation.regulations(id),
    node_id uuid REFERENCES regulation.regulation_nodes(id),
    rank smallint,
    score real,
    quote text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    deleted_at timestamp,
    sync_at timestamp,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);
CREATE INDEX IF NOT EXISTS idx_ai_message_citations_message ON ai.message_citations (message_id);
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS ai.message_citations")
            .await?;
        Ok(())
    }
}
