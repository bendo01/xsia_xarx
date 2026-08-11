use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260805_071128_schema_institution_reference_table_categories"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS institution_reference")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("institution_reference"), Alias::new("categories")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("code")
                            .integer()
                            .not_null()
                            .default(0),
                    )
                    .col(
                        ColumnDef::new("alphabet_code")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("name")
                            .string_len(255)
                            .not_null(),
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
                        ColumnDef::new("created_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("updated_by")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("sync_at")
                            .date_time(),
                    )
                    .primary_key(
                        Index::create()
                            .name("ir_categories_pkey")
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
                    .table((Alias::new("institution_reference"), Alias::new("categories")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
