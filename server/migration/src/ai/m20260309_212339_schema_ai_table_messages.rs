use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260309_212339_schema_ai_table_messages"
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
                    .table((Alias::new("ai"), Alias::new("messages")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(ColumnDef::new("conversation_id").uuid().not_null())
                    // 'user' atau 'assistant'
                    .col(ColumnDef::new("role").text().not_null())
                    .col(ColumnDef::new("content").text().not_null())
                    // Referensi chunk yang digunakan untuk menjawab (sitasi): [uuid1, uuid2, ...]
                    .col(ColumnDef::new("context_reference").json_binary())
                    .col(ColumnDef::new("feedback").integer().default(0))
                    .col(ColumnDef::new("feedback_note").text())
                    .col(
                        ColumnDef::new("confidence")
                            .float()
                            .default(Expr::cust("'0'::real")),
                    )
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
                            .name("ai_messages_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_ai_messages_conversation_id")
                    .table((Alias::new("ai"), Alias::new("messages")))
                    .col(Alias::new("conversation_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("ai"), Alias::new("messages")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
