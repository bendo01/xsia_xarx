use sea_orm::entity::prelude::*;

/// A pair of FEEDER records suspected to describe the same person, with its match score
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "compliance", table_name = "duplicate_candidates")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub entity_type: String,
    pub record_a_id: Uuid,
    pub record_b_id: Uuid,
    pub score: f64,
    pub match_class: String,
    pub features: Option<Json>,
    pub model_version: String,
    pub run_id: Option<Uuid>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
