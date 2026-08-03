use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260803_135500_schema_auth_table_users"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS auth")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("auth"), Alias::new("users")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id")
                            .uuid()
                            .not_null()
                            .default(Expr::cust("uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("name")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("email")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("email_verified_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("password")
                            .string_len(255)
                            .not_null(),
                    )
                    .col(
                        ColumnDef::new("remember_token")
                            .string_len(100),
                    )
                    .col(
                        ColumnDef::new("individual_id")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("is_active")
                            .boolean()
                            .default(true),
                    )
                    .col(
                        ColumnDef::new("current_role_id")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("pid")
                            .uuid()
                            .default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("api_key")
                            .string(),
                    )
                    .col(
                        ColumnDef::new("reset_token")
                            .string(),
                    )
                    .col(
                        ColumnDef::new("email_verification_token")
                            .string(),
                    )
                    .col(
                        ColumnDef::new("reset_sent_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("email_verification_sent_at")
                            .date_time(),
                    )
                    .col(
                        ColumnDef::new("magic_link_token")
                            .string(),
                    )
                    .col(
                        ColumnDef::new("magic_link_expiration")
                            .date_time(),
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
                            .name("auth_users_pkey")
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
                    .table((Alias::new("auth"), Alias::new("users")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
