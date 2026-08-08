use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_064044_schema_academic_course_reference_table_course_evaluation_bases"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS academic_course_reference")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("academic_course_reference"), Alias::new("course_evaluation_bases")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("code").integer().not_null().default(0),
                    )
                    .col(
                        ColumnDef::new("evaluation_base").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("component_evaluation").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("start_effective_date").date(),
                    )
                    .col(
                        ColumnDef::new("end_effective_date").date(),
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
                            .name("acr_course_evaluation_bases_pkey")
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
                    .table((Alias::new("academic_course_reference"), Alias::new("course_evaluation_bases")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
