use sea_orm_migration::prelude::*;
use sea_orm_migration::sea_orm::ConnectionTrait;

#[derive(DeriveMigrationName)]
pub struct Migration;

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        // Replace the sample below with your own migration scripts
        let db = manager.get_connection();
        db.execute_unprepared(
            "
            CREATE SCHEMA IF NOT EXISTS ai;
            ",
        )
        .await?;
        db.execute_unprepared(
            "
            CREATE TABLE IF NOT EXISTS ai.messages
            (
                id uuid NOT NULL DEFAULT uuid_generate_v7(),
                conversation_id uuid NOT NULL,
                role TEXT NOT NULL, -- 'user' atau 'assistant'
                content TEXT NOT NULL,
                -- Menyimpan referensi chunk mana yang digunakan untuk menjawab (untuk sitasi)
                -- Ini disimpan dalam JSONB agar fleksibel [uuid1, uuid2, ...]
                context_reference JSONB,
                feedback INT DEFAULT 0,
                feedback_note TEXT,
                confidence real DEFAULT '0'::real,
                created_at timestamp(0) without time zone DEFAULT now(),
                updated_at timestamp(0) without time zone DEFAULT now(),
                deleted_at timestamp(0) without time zone,
                sync_at timestamp(0) without time zone,
                created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                CONSTRAINT ai_messages_pkey PRIMARY KEY (id)
            )
            ",
        )
        .await?;
        db.execute_unprepared(
            "
            CREATE INDEX idx_messages_conversation_id ON ai.messages(conversation_id);
            ",
        )
        .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS ai.messages")
            .await?;

        Ok(())
    }
}
