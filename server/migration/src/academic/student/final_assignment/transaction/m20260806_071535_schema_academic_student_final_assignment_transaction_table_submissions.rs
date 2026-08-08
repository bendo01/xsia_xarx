use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_071535_schema_academic_student_final_assignment_transaction_table_submissions"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS academic_student_final_assignment_transaction")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("academic_student_final_assignment_transaction"), Alias::new("submissions")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("title").text(),
                    )
                    .col(
                        ColumnDef::new("student_id").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("approval_type_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("category_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("stage_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("final_assignment_decree_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("detail_activity_id").uuid().not_null(),
                    )
                    .col(
                        ColumnDef::new("is_taken").date_time(),
                    )
                    .col(
                        ColumnDef::new("is_lock").date_time(),
                    )
                    .col(
                        ColumnDef::new("filename").string_len(255),
                    )
                    .col(
                        ColumnDef::new("dir").string_len(255),
                    )
                    .col(
                        ColumnDef::new("type").string_len(255),
                    )
                    .col(
                        ColumnDef::new("filesize").integer(),
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
                            .name("academic_student_final_assignment_transaction_submissions_pkey")
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
                    .table((Alias::new("academic_student_final_assignment_transaction"), Alias::new("submissions")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
