use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "intake_logs")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub individual_id: Uuid,
    pub eaten_at: DateTime,
    pub meal_type: Option<String>,
    #[sea_orm(column_type = "Text")]
    pub description: String,
    pub status: String,
    pub llm_model: Option<String>,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub llm_raw_response: Option<serde_json::Value>,
    #[sea_orm(column_type = "JsonBinary", nullable)]
    pub totals: Option<serde_json::Value>,
    #[sea_orm(column_type = "Text", nullable)]
    pub error_message: Option<String>,
    pub calculated_at: Option<DateTime>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(has_many)]
    pub items: HasMany<crate::models::person::nutritional_intake::intake_log_item::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
