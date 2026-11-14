use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "code_histories")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub food_id: Uuid,
    pub old_code: String,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "food_id", to = "id")]
    pub food: BelongsTo<crate::models::person::nutritional_intake::food::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
