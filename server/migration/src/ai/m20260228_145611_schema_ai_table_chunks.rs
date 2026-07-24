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
            r#"
            CREATE SCHEMA IF NOT EXISTS ai;
            CREATE EXTENSION IF NOT EXISTS age;
            CREATE EXTENSION IF NOT EXISTS vector;
            -- 3. Muat AGE
            LOAD 'age';
            
            -- 4. Tambahkan 'ai' ke dalam search_path agar query lebih ringkas
            SET search_path = ag_catalog, "$user", public, ai;
            
            -- 5. Buat Graf khusus. AGE akan OTOMATIS membuat skema bernama 'ai_graph'
            SELECT create_graph('ai_graph');
            "#,
        )
        .await?;
        db.execute_unprepared(
            "
            CREATE TABLE IF NOT EXISTS ai.chunks
            (
                id uuid NOT NULL DEFAULT uuid_generate_v7(),
                -- archive_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                chunkable_type character varying(255),
                chunkable_id uuid NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                content TEXT NOT NULL,
                heading_context TEXT,
                title_hierarchy TEXT,
                markdown_content TEXT,
                metadata JSONB,
                -- 1536 adalah dimensi untuk OpenAI (text-embedding-3-small)
                -- Sesuaikan jika menggunakan model lokal via Candle (misal: 384 atau 768)
                embedding vector(384),
                created_at timestamp(0) without time zone DEFAULT now(),
                updated_at timestamp(0) without time zone DEFAULT now(),
                deleted_at timestamp(0) without time zone,
                sync_at timestamp(0) without time zone,
                created_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                updated_by uuid DEFAULT '00000000-0000-0000-0000-000000000000'::uuid,
                CONSTRAINT ai_chunks_pkey PRIMARY KEY (id)
            )
            ",
        )
        .await?;
        db.execute_unprepared(
            "
            CREATE INDEX ON ai.chunks USING hnsw (embedding vector_cosine_ops);
            ",
        )
        .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("DROP TABLE IF EXISTS ai.chunks")
            .await?;
        let db = manager.get_connection();
        db.execute_unprepared(
            r#"
            -- 3. Muat AGE
            LOAD 'age';
            
            -- 4. Tambahkan 'ai' ke dalam search_path agar query lebih ringkas
            SET search_path = ag_catalog, "$user", public, ai;
            
            -- 5. Buat Graf khusus. AGE akan OTOMATIS membuat skema bernama 'ai_graph'
            SELECT drop_graph('ai_graph');
            "#,
        )
        .await?;

        Ok(())
    }
}
