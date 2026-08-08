use sea_orm_migration::{prelude::*, schema::*};

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260808_131448_schema_document_transaction_table_archives"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        manager
            .get_connection()
            .execute_unprepared("CREATE SCHEMA IF NOT EXISTS document_transaction")
            .await?;

        manager
            .create_table(
                Table::create()
                    .table((Alias::new("document_transaction"), Alias::new("archives")))
                    .if_not_exists()
                    .col(
                        ColumnDef::new("id").uuid().not_null().default(Expr::cust("public.uuid_generate_v7()")),
                    )
                    .col(
                        ColumnDef::new("name").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("dir").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("mimetype").string_len(255).not_null(),
                    )
                    .col(
                        ColumnDef::new("size").integer().default(0),
                    )
                    .col(
                        ColumnDef::new("archiveable_id").uuid().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
                    )
                    .col(
                        ColumnDef::new("archiveable_type").string_len(255),
                    )
                    .col(
                        ColumnDef::new("archive_type_id").uuid().not_null().default(Expr::cust("'00000000-0000-0000-0000-000000000000'::uuid")),
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
                        ColumnDef::new("description").text(),
                    )
                    .col(
                        ColumnDef::new("is_knowledge").boolean().not_null().default(Expr::cust("false")),
                    )
                    .primary_key(
                        Index::create()
                            .name("document_transaction_archives_pkey")
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
                    .table((Alias::new("document_transaction"), Alias::new("archives")))
                    .if_exists()
                    .to_owned(),
            )
            .await
    }
}
