use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261123_100000_schema_ai_table_assistant_audits"
    }
}

/// One row per attempt of the student-data assistant to read a student's data, allowed or refused.
/// It holds who asked about whom and which categories were read, never the question or the data itself.
#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE SCHEMA IF NOT EXISTS ai;
                CREATE TABLE IF NOT EXISTS ai.assistant_audits (
                    id uuid NOT NULL DEFAULT public.uuid_generate_v7() PRIMARY KEY,
                    user_id uuid,
                    role_id uuid,
                    position_type_id uuid,
                    student_id uuid,
                    conversation_id uuid,
                    -- allowed | denied | error
                    outcome character varying(16) NOT NULL,
                    -- categories actually read: profile, academic, finance, sensitive
                    categories text[] NOT NULL DEFAULT '{}',
                    -- categories asked for but withheld by the caller's scope
                    withheld text[] NOT NULL DEFAULT '{}',
                    created_at timestamp NOT NULL DEFAULT now()
                );
                CREATE INDEX IF NOT EXISTS idx_ai_assistant_audits_student ON ai.assistant_audits (student_id, created_at);
                CREATE INDEX IF NOT EXISTS idx_ai_assistant_audits_user ON ai.assistant_audits (user_id, created_at);
                "#,
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS ai.assistant_audits")
            .await?;
        Ok(())
    }
}
