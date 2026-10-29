use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260309_212227_schema_ai_table_conversations"
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
            .create_table(
                Table::create()
                    .table((Alias::new("ai"), Alias::new("conversations")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("title")
                            .text()
                            .default(Expr::cust("'Percakapan Baru'::text")),
                    )
                    .col(ColumnDef::new("user_id").uuid())
                    .col(ColumnDef::new("is_pinned").date_time())
                    .col(ColumnDef::new("max_new_tokens").integer())
                    .col(ColumnDef::new("model").text())
                    .col(ColumnDef::new("rerank").boolean())
                    .col(ColumnDef::new("temperature").double())
                    .col(ColumnDef::new("top_k").integer())
                    .col(ColumnDef::new("search_mode").text())
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
                            .name("ai_conversations_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_ai_conversations_user_id")
                    .table((Alias::new("ai"), Alias::new("conversations")))
                    .col(Alias::new("user_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("ai"), Alias::new("conversations")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
