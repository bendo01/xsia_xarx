use sea_orm::entity::prelude::*;

/// A compliance anomaly raised by a rule or ML detector
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "compliance", table_name = "anomaly_events")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub entity_type: String,
    pub entity_id: Uuid,
    pub detector: String,
    pub rule_code: Option<String>,
    pub score: f64,
    pub severity: String,
    pub evidence: Option<Json>,
    pub regulation_chunk_id: Option<Uuid>,
    pub run_id: Option<Uuid>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
