use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_071046_schema_academic_student_campaign_table_convertions"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS academic_student_campaign")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("academic_student_campaign"), Alias::new("convertions")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("student_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("course_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("grade_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("transfer_code").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("transfer_name").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("transfer_credit").double().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("transfer_grade").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("is_lock").date_time(),
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
                        ColumnDef::new("feeder_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("name").string_len(255),
                    )
                    .col(
                        ColumnDef::new("academic_year_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("origin_code").string_len(255),
                    )
                    .col(
                        ColumnDef::new("origin_name").string_len(255),
                    )
                    .col(
                        ColumnDef::new("origin_credit").double().default(0),
                    )
                    .col(
                        ColumnDef::new("origin_grade").string_len(255),
                    )
                    .primary_key(
                        Index::create()
                            .name("academic_student_campaign_convertions_pkey")
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
                    .table((Alias::new("academic_student_campaign"), Alias::new("convertions")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
