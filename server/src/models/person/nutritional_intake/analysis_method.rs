use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "analysis_methods")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub nutrient_id: Uuid,
    pub name: String,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "nutrient_id", to = "id")]
    pub nutrient: BelongsTo<crate::models::person::nutritional_intake::nutrient::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
