use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261014_140000_schema_webhook_table_open_wa_events"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS webhook")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("webhook"), Alias::new("open_wa_events")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("idempotency_key")
                            .string_len(255)
                            .not_null()
                            .unique_key(),
                    )
                    .col(ColumnDef::new("delivery_id").string_len(255))
                    .col(ColumnDef::new("event_type").string_len(255).not_null())
                    .col(ColumnDef::new("session_id").string_len(255).not_null())
                    .col(ColumnDef::new("occurred_at").date_time())
                    .col(ColumnDef::new("payload").json_binary().not_null())
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
                    .primary_key(
                        Index::create()
                            .name("pr_open_wa_events_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_open_wa_events_event_type")
                    .table((Alias::new("webhook"), Alias::new("open_wa_events")))
                    .col(Alias::new("event_type"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await?;

        manager
            .create_index(
                Index::create()
                    .name("idx_open_wa_events_session_id")
                    .table((Alias::new("webhook"), Alias::new("open_wa_events")))
                    .col(Alias::new("session_id"))
                    .if_not_exists()
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("webhook"), Alias::new("open_wa_events")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
