use super::{add_audit_cols, drop, ensure_schema, id_col, index, tbl};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260901_000003_schema_compliance_table_duplicate_candidates"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        ensure_schema(manager).await?;
        let mut table = Table::create();
        table
            .table(tbl("duplicate_candidates"))
            .if_not_exists()
            .col(id_col())
            .col(ColumnDef::new("entity_type").string_len(16).not_null()) // student | lecturer
            .col(ColumnDef::new("record_a_id").uuid().not_null())
            .col(ColumnDef::new("record_b_id").uuid().not_null())
            .col(ColumnDef::new("score").double().not_null())
            .col(ColumnDef::new("match_class").string_len(16).not_null()) // match | possible | non_match
            .col(ColumnDef::new("features").json_binary())
            .col(ColumnDef::new("model_version").text().not_null())
            .col(ColumnDef::new("run_id").uuid());
        add_audit_cols(&mut table);
        table.primary_key(Index::create().name("compliance_duplicate_candidates_pkey").col(Alias::new("id")));
        manager.create_table(table.to_owned()).await?;
        index(manager, "idx_compliance_duplicate_candidates_a", "duplicate_candidates", &["entity_type", "record_a_id"]).await?;
        index(manager, "idx_compliance_duplicate_candidates_b", "duplicate_candidates", &["entity_type", "record_b_id"]).await?;
        index(manager, "idx_compliance_duplicate_candidates_run_id", "duplicate_candidates", &["run_id"]).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        drop(manager, "duplicate_candidates").await
    }
}
