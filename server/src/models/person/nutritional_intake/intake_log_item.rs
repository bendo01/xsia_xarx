use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "intake_log_items")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub intake_log_id: Uuid,
    pub food_id: Option<Uuid>,
    pub raw_name: String,
    pub quantity_text: Option<String>,
    #[sea_orm(column_type = "Decimal(Some((14, 4)))", nullable)]
    pub grams: Option<Decimal>,
    #[sea_orm(column_type = "Decimal(Some((14, 4)))", nullable)]
    pub edible_portion: Option<Decimal>,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub nutrients: Option<serde_json::Value>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "intake_log_id", to = "id")]
    pub intake_log: BelongsTo<crate::models::person::nutritional_intake::intake_log::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
