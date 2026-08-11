use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_061051_schema_academic_campaign_transaction_table_teaches"
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
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("teaches")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("name").text(),
                    )
                    .col(
                        ColumnDef::new("class_code_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("course_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("activity_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("description").text(),
                    )
                    .col(
                        ColumnDef::new("start_date").date(),
                    )
                    .col(
                        ColumnDef::new("end_date").date(),
                    )
                    .col(
                        ColumnDef::new("practice_start_date").date(),
                    )
                    .col(
                        ColumnDef::new("practice_end_date").date(),
                    )
                    .col(
                        ColumnDef::new("curriculum_detail_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("teach_decree_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("is_lecturer_credit_sum_problem").boolean().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("is_lock").boolean().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("encounter_category_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("scope_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
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
                    .col(
                        ColumnDef::new("max_member").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("feeder_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .primary_key(
                        Index::create()
                            .name("act_teaches_pkey")
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
                    .table((Alias::new("academic_campaign_transaction"), Alias::new("teaches")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
