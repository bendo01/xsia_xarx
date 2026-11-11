use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261111_100000_schema_academic_campaign_transaction_table_teach_meetings"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS academic_campaign_transaction")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("teach_meetings")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("teach_id").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("sequence").integer().not_null(),
                    )
                    .col(
                        ColumnDef::new("meeting_type").string_len(16).not_null().default("regular"),
                    )
                    .col(
                        ColumnDef::new("topic").string_len(255),
                    )
                    .col(
                        ColumnDef::new("held_on").date(),
                    )
                    .col(
                        ColumnDef::new("qr_open_until").date_time(),
                    )
                    .col(
                        ColumnDef::new("created_at").date_time().default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("updated_at").date_time().default(Expr::cust("now()")),
                    )
                    .col(
                        ColumnDef::new("deleted_at").date_time(),
                    )
                    .col(
                        ColumnDef::new("sync_at").date_time(),
                    )
                    .col(
                        ColumnDef::new("created_by").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("updated_by").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .primary_key(
                        Index::create()
                            .name("act_teach_meetings_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        // Soft-deleted rows must not block re-creation, hence a partial unique index
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_teach_meetings_teach_sequence ON academic_campaign_transaction.teach_meetings (teach_id, sequence) WHERE deleted_at IS NULL",
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("teach_meetings")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
