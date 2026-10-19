use super::{add_audit_cols, drop, ensure_schema, id_col, index, tbl};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260901_000002_schema_compliance_table_experiment_metrics"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        ensure_schema(manager).await?;
        let mut table = Table::create();
        table
            .table(tbl("experiment_metrics"))
            .if_not_exists()
            .col(id_col())
            .col(ColumnDef::new("run_id").uuid().not_null())
            .col(ColumnDef::new("metric").string_len(64).not_null())
            .col(ColumnDef::new("variant").string_len(64)) // ablation / model name
            .col(ColumnDef::new("value").double().not_null())
            .col(ColumnDef::new("extra").json_binary());
        add_audit_cols(&mut table);
        table.primary_key(Index::create().name("compliance_experiment_metrics_pkey").col(Alias::new("id")));
        manager.create_table(table.to_owned()).await?;
        index(manager, "idx_compliance_experiment_metrics_run_id", "experiment_metrics", &["run_id"]).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        drop(manager, "experiment_metrics").await
    }
}
