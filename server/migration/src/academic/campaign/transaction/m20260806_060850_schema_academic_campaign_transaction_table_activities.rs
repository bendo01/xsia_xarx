use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_060850_schema_academic_campaign_transaction_table_activities"
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
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("activities")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(
                        ColumnDef::new("name").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("week_quantity").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("student_target").integer().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("candidate_number").integer().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("candidate_pass").integer().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("became_student").integer().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("transfer_student").integer().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("total_class_member").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("start_date").date(),
                    )
                    .col(
                        ColumnDef::new("end_date").date(),
                    )
                    .col(
                        ColumnDef::new("start_transaction").date(),
                    )
                    .col(
                        ColumnDef::new("end_transaction").date(),
                    )
                    .col(
                        ColumnDef::new("unit_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("academic_year_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("is_active").boolean().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("feeder_id").uuid(),
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
                            .name("act_activities_pkey")
                            .col(Alias::new("id")),
                    )
                    .to_owned(),
            )
            .await
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .drop_table(
                Table::drop()
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("activities")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
