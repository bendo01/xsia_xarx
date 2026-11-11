use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20261111_100100_schema_academic_campaign_transaction_table_teach_attendances"
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
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("teach_attendances")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("teach_meeting_id").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("student_id").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("attend_type_id").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("method").string_len(16).not_null().default("manual"),
                    )
                    .col(
                        ColumnDef::new("marked_at").date_time(),
                    )
                    .col(
                        ColumnDef::new("marked_by").uuid(),
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
                            .name("act_teach_attendances_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await?;

        // Soft-deleted rows must not block re-creation, hence a partial unique index
        manager
            .get_connection()
            .execute_unprepared(
                "CREATE UNIQUE INDEX IF NOT EXISTS uq_teach_attendances_meeting_student ON academic_campaign_transaction.teach_attendances (teach_meeting_id, student_id) WHERE deleted_at IS NULL",
            )
            .await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("teach_attendances")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
