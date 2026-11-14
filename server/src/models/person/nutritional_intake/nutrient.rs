use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "nutrients")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub name: String,
    pub tagname: String,
    pub unit: Option<String>,
    pub decimal_places: i32,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(has_many)]
    pub food_nutrients: HasMany<crate::models::person::nutritional_intake::food_nutrient::Entity>,
    #[sea_orm(has_many)]
    pub analysis_methods: HasMany<crate::models::person::nutritional_intake::analysis_method::Entity>,
    #[sea_orm(has_many)]
    pub corrections: HasMany<crate::models::person::nutritional_intake::correction::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
