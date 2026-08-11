use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_063831_schema_academic_course_master_table_courses"
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
                    .table((Alias::new("academic_course_master"), Alias::new("courses")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("code").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("name").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("implementation_method").text(),
                    )
                    .col(
                        ColumnDef::new("total_credit").double().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("lecture_credit").double().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("practice_credit").double().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("field_practice_credit").double().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("simulation_credit").double().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("has_unit").boolean().not_null().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("has_syllabus").boolean().not_null().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("has_material").boolean().not_null().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("has_practice").boolean().not_null().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("has_dictation").boolean().not_null().default(Expr::cust("false")),
                    )
                    .col(
                        ColumnDef::new("group_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("variety_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("unit_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("competence_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("feeder_course_group_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("feeder_course_type_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("feeder_course_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("start_date").date(),
                    )
                    .col(
                        ColumnDef::new("end_date").date(),
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
                            .name("acm_courses_pkey")
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
                    .table((Alias::new("academic_course_master"), Alias::new("courses")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
