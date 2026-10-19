use super::{add_audit_cols, drop, ensure_schema, id_col, index, tbl};
use sea_orm_migration::prelude::*;

pub struct Migration;

impl MigrationName for Migration {
    fn name(&self) -> &str {
        "m20260901_000005_schema_compliance_table_anomaly_events"
    }
}

#[async_trait::async_trait]
impl MigrationTrait for Migration {
    async fn up(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        ensure_schema(manager).await?;
        let mut table = Table::create();
        table
            .table(tbl("anomaly_events"))
            .if_not_exists()
            .col(id_col())
            .col(ColumnDef::new("entity_type").string_len(16).not_null())
            .col(ColumnDef::new("entity_id").uuid().not_null())
            .col(ColumnDef::new("detector").string_len(32).not_null()) // rule | iforest | lof | autoencoder | hybrid
            .col(ColumnDef::new("rule_code").string_len(64))
            .col(ColumnDef::new("score").double().not_null())
            .col(ColumnDef::new("severity").string_len(16).not_null())
            .col(ColumnDef::new("evidence").json_binary())
            .col(ColumnDef::new("regulation_chunk_id").uuid())
            .col(ColumnDef::new("run_id").uuid());
        add_audit_cols(&mut table);
        table.primary_key(Index::create().name("compliance_anomaly_events_pkey").col(Alias::new("id")));
        manager.create_table(table.to_owned()).await?;
        index(manager, "idx_compliance_anomaly_events_entity", "anomaly_events", &["entity_type", "entity_id"]).await?;
        index(manager, "idx_compliance_anomaly_events_run_id", "anomaly_events", &["run_id"]).await?;
        Ok(())
    }

    async fn down(&self, manager: &SchemaManager) -> Result<(), DbErr> {
        drop(manager, "anomaly_events").await
    }
}
