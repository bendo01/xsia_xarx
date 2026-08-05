use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260805_071522_schema_institution_master_table_staffes"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS institution_master")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("institution_master"), Alias::new("staffes")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("gen_random_uuid()")),
                    )
                    .col(
                        ColumnDef::new("code")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("name")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("decree_number")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("decree_date")
                            .date(),
                    )
                    .col(
                        ColumnDef::new("start_date")
                            .date(),
                    )
                    .col(
                        ColumnDef::new("end_date")
                            .date(),
                    )
                    .col(
                        ColumnDef::new("employee_id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("unit_id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("position_type_id")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
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
                    .col(
                        ColumnDef::new("deleted_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("sync_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("created_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("updated_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .primary_key(
                        Index::create()
                            .name("im_staffes_pkey")
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
                    .table((Alias::new("institution_master"), Alias::new("staffes")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
