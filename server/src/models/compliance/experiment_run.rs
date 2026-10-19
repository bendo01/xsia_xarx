use sea_orm::entity::prelude::*;

/// One reproducible evaluation run (ER, anomaly, RAG or end-to-end)
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "compliance", table_name = "experiment_runs")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub name: String,
    pub kind: String,
    pub model_version: Option<String>,
    pub seed: Option<i64>,
    pub config: Json,
    pub started_at: Option<DateTime>,
    pub finished_at: Option<DateTime>,
    pub status: String,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
