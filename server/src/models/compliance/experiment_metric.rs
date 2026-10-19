use sea_orm::entity::prelude::*;

/// A single metric value produced by an experiment run
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "compliance", table_name = "experiment_metrics")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub run_id: Uuid,
    pub metric: String,
    pub variant: Option<String>,
    pub value: f64,
    pub extra: Option<Json>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
