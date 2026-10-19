use super::{add_audit_cols, drop, ensure_schema, id_col, index, tbl};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260901_000001_schema_compliance_table_experiment_runs"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        ensure_schema(manager).await?;
        let mut table = Table::create();
        table
            .table(tbl("experiment_runs"))
            .if_not_exists()
            .col(id_col())
            .col(ColumnDef::new("name").text().not_null())
            .col(ColumnDef::new("kind").string_len(32).not_null()) // er | anomaly | rag | e2e
            .col(ColumnDef::new("model_version").text())
            .col(ColumnDef::new("seed").big_integer())
            .col(ColumnDef::new("config").json_binary().not_null().default(Expr::cust("'{}'::jsonb")))
            .col(ColumnDef::new("started_at").date_time())
            .col(ColumnDef::new("finished_at").date_time())
            .col(ColumnDef::new("status").string_len(16).not_null().default("running"));
        add_audit_cols(&mut table);
        table.primary_key(Index::create().name("compliance_experiment_runs_pkey").col(Alias::new("id")));
        manager.create_table(table.to_owned()).await?;
        index(manager, "idx_compliance_experiment_runs_kind", "experiment_runs", &["kind"]).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        drop(manager, "experiment_runs").await
    }
}
