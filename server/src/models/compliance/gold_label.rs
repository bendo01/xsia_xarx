use sea_orm::entity::prelude::*;

/// Ground-truth label used to evaluate ER and anomaly detection
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "compliance", table_name = "gold_labels")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub label_type: String,
    pub entity_type: String,
    pub record_a_id: Option<Uuid>,
    pub record_b_id: Option<Uuid>,
    pub is_positive: bool,
    pub origin: String,
    pub note: Option<Json>,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
