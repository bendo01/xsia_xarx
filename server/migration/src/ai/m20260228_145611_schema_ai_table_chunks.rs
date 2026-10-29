use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260228_145611_schema_ai_table_chunks"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS ai")
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                CREATE EXTENSION IF NOT EXISTS age;
                CREATE EXTENSION IF NOT EXISTS vector;
                -- Tanpa LOAD 'age': non-superuser tidak diizinkan, dan library AGE
                -- otomatis dimuat saat fungsi ag_catalog dipanggil.
                -- search_path hanya diubah selama blok ini (set_config ... true).
                -- AGE akan OTOMATIS membuat skema bernama 'ai_graph'
                DO $$
                BEGIN
                    PERFORM set_config('search_path', 'ag_catalog, "$user", public', true);
                    IF NOT EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = 'ai_graph') THEN
                        PERFORM ag_catalog.create_graph('ai_graph');
                    END IF;
                END
                $$;
                "#,
            )
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("ai"), Alias::new("chunks")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(ColumnDef::new("chunkable_type").string_len(255))
                    .col(
                        ColumnDef::new("chunkable_id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(ColumnDef::new("content").text().not_null())
                    .col(ColumnDef::new("heading_context").text())
                    .col(ColumnDef::new("title_hierarchy").text())
                    .col(ColumnDef::new("markdown_content").text())
                    .col(ColumnDef::new("metadata").json_binary())
                    // 768 adalah dimensi multilingual-e5-base (Candle, lokal). Jika model diganti,
                    // dimensi ini harus ikut diganti dan seluruh chunk di-embed ulang.
                    .col(ColumnDef::new("embedding").custom(Alias::new("public.vector(768)")))
                    .col(
                        ColumnDef::new("created_at")
                            .date_time()
                            .default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("updated_at")
                            .date_time()
                            .default(Expr::cust("now()")),
                    )
                    .col(ColumnDef::new("deleted_at").date_time())
                    .col(ColumnDef::new("sync_at").date_time())
                    .col(
                        ColumnDef::new("created_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("updated_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .primary_key(
                        Index::create()
                            .name("ai_chunks_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_ai_chunks_chunkable")
                    .table((Alias::new("ai"), Alias::new("chunks")))
                    .col(Alias::new("chunkable_type"))
                    .col(Alias::new("chunkable_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        // Index builder tidak mendukung operator class, jadi HNSW ditulis manual
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE INDEX IF NOT EXISTS idx_ai_chunks_embedding ON ai.chunks USING hnsw (embedding public.vector_cosine_ops)",
            )
            .await?;

        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("ai"), Alias::new("chunks")))
                    .if_exists()
                    .to_owned(),
            )
            .await?;

        manager
            .get_connection()
            .execute_unprepared(
                r#"
                DO $$
                BEGIN
                    PERFORM set_config('search_path', 'ag_catalog, "$user", public', true);
                    IF EXISTS (SELECT 1 FROM ag_catalog.ag_graph WHERE name = 'ai_graph') THEN
                        -- Hapus graf beserta seluruh label di dalamnya (cascade = true)
                        PERFORM ag_catalog.drop_graph('ai_graph', true);
                    END IF;
                END
                $$;
                "#,
            )
            .await?;

        Ok(())
    }
}
