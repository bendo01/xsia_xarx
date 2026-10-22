use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261022_100500_schema_ai_table_ingest_runs"
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
                CREATE TABLE IF NOT EXISTS ai.ingest_runs (
    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
    regulation_id uuid NOT NULL REFERENCES regulation.regulations(id),
    started_at timestamp NOT NULL DEFAULT now(),
    finished_at timestamp,
    status varchar(16) NOT NULL DEFAULT 'running' CHECK (status IN ('running','ok','failed')),
    chunk_count integer,
    embedding_model varchar(128),
    chunker_version varchar(64),
    error text,
    created_at timestamp DEFAULT now(),
    updated_at timestamp DEFAULT now(),
    deleted_at timestamp,
    sync_at timestamp,
    created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
    updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid
);
CREATE INDEX IF NOT EXISTS idx_ai_ingest_runs_regulation ON ai.ingest_runs (regulation_id);
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS ai.ingest_runs")
            .await?;
        Ok(())
    }
}
