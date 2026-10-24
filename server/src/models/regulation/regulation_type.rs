use sea_orm::entity::prelude::*;

/// A kind of regulation (UU, PP, Perpres, ...) with its place in the legal hierarchy
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "regulation", table_name = "regulation_types")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub level: i16,
    pub rank_order: i16,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
