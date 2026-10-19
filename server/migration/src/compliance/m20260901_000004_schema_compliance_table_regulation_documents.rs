use super::{add_audit_cols, drop, ensure_schema, id_col, index, tbl};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260901_000004_schema_compliance_table_regulation_documents"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        ensure_schema(manager).await?;
        let mut table = Table::create();
        table
            .table(tbl("regulation_documents"))
            .if_not_exists()
            .col(id_col())
            .col(ColumnDef::new("title").text().not_null())
            .col(ColumnDef::new("number").string_len(64))
            .col(ColumnDef::new("year").small_integer())
            .col(ColumnDef::new("status").string_len(16).not_null().default("active")) // active | revoked
            .col(ColumnDef::new("source").text());
        add_audit_cols(&mut table);
        table.primary_key(Index::create().name("compliance_regulation_documents_pkey").col(Alias::new("id")));
        manager.create_table(table.to_owned()).await?;
        index(manager, "idx_compliance_regulation_documents_number", "regulation_documents", &["number", "year"]).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        drop(manager, "regulation_documents").await
    }
}
