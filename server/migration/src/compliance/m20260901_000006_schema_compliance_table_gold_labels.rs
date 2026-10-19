use super::{add_audit_cols, drop, ensure_schema, id_col, index, tbl};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260901_000006_schema_compliance_table_gold_labels"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        ensure_schema(manager).await?;
        let mut table = Table::create();
        table
            .table(tbl("gold_labels"))
            .if_not_exists()
            .col(id_col())
            .col(ColumnDef::new("label_type").string_len(16).not_null()) // duplicate | anomaly
            .col(ColumnDef::new("entity_type").string_len(16).not_null())
            .col(ColumnDef::new("record_a_id").uuid())
            .col(ColumnDef::new("record_b_id").uuid())
            .col(ColumnDef::new("is_positive").boolean().not_null())
            .col(ColumnDef::new("origin").string_len(32).not_null()) // konsistensi | injected
            .col(ColumnDef::new("note").json_binary());
        add_audit_cols(&mut table);
        table.primary_key(Index::create().name("compliance_gold_labels_pkey").col(Alias::new("id")));
        manager.create_table(table.to_owned()).await?;
        index(manager, "idx_compliance_gold_labels_type", "gold_labels", &["label_type", "entity_type"]).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        drop(manager, "gold_labels").await
    }
}
