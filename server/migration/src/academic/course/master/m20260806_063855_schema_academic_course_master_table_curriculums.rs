use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_063855_schema_academic_course_master_table_curriculums"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS academic_course_master")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("academic_course_master"), Alias::new("curriculums")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("name").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("unit_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("academic_year_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("curriculum_type_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("total_credit").double().default(0),
                    )
                    .col(
                        ColumnDef::new("mandatory_course_credit").double().default(0),
                    )
                    .col(
                        ColumnDef::new("optional_course_credit").double().default(0),
                    )
                    .col(
                        ColumnDef::new("feeder_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
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
                        ColumnDef::new("start_date").date(),
                    )
                    .col(
                        ColumnDef::new("end_date").date(),
                    )
                    .col(
                        ColumnDef::new("is_active").boolean().not_null().default(Expr::cust("false")),
                    )
                    .primary_key(
                        Index::create()
                            .name("acm_curriculums_pkey")
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
                    .table((Alias::new("academic_course_master"), Alias::new("curriculums")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
