use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260805_073602_schema_location_table_countries"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS location")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("location"), Alias::new("countries")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("code")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("name")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("alpha2_code")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("alpha3_code")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("iso3166_2_code")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("dikti_code")
                            .string_len(255),
                    )
                    .col(
                        ColumnDef::new("continent_id")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("region_id")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("slug")
                            .string_len(255),
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
                        ColumnDef::new("sync_at")
                            .date_time(),
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
                    .primary_key(
                        Index::create()
                            .name("location_countries_pkey")
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
                    .table((Alias::new("location"), Alias::new("countries")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
