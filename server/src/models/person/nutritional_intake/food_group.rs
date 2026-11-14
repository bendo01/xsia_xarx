use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "food_groups")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub name: String,
    pub position: i32,
    pub raw_code: Option<String>,
    pub processed_code: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(has_many)]
    pub foods: HasMany<crate::models::person::nutritional_intake::food::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
