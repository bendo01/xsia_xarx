use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261022_100300_schema_regulation_table_regulation_relations"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE SCHEMA IF NOT EXISTS regulation;
                CREATE TABLE IF NOT EXISTS regulation.regulation_relations (
    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
    source_id uuid NOT NULL REFERENCES regulation.regulations(id),
    target_id uuid NOT NULL REFERENCES regulation.regulations(id),
    relation varchar(32) NOT NULL
        CHECK (relation IN ('mencabut','mengubah','melaksanakan','mengamanatkan','merujuk','menggantikan_sebagian')),
    article_ref varchar(64),
    effective_on date,
    note text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    deleted_at timestamp,
    sync_at timestamp,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);
CREATE INDEX IF NOT EXISTS idx_regulation_relations_source ON regulation.regulation_relations (source_id, relation);
                CREATE INDEX IF NOT EXISTS idx_regulation_relations_target ON regulation.regulation_relations (target_id, relation);
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS regulation.regulation_relations")
            .await?;
        Ok(())
    }
}
