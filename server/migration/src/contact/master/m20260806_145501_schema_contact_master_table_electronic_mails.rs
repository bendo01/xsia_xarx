use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260806_145501_schema_contact_master_table_electronic_mails"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS contact_master")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("contact_master"), Alias::new("electronic_mails")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("email_address").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("electronic_mail_type_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("electronic_mailable_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("electronic_mailable_type").string_len(255).not_null(),
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
                            .name("cm_electronic_mails_pkey")
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
                    .table((Alias::new("contact_master"), Alias::new("electronic_mails")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
