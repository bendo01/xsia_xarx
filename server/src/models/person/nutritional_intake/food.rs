use sea_orm::entity::prelude::*;

#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, DeriveEntityModel)]
#[sea_orm(schema_name = "person_nutritional_intake", table_name = "foods")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    pub food_group_id: Uuid,
    pub source_id: Option<Uuid>,
    pub code: String,
    pub name: String,
    pub kind: Option<String>,
    #[sea_orm(column_type = "Decimal(Some((14, 4)))", nullable)]
    pub edible_portion: Option<Decimal>,
    pub species: Option<String>,
    pub genus: Option<String>,
    pub family: Option<String>,
    pub english_name: Option<String>,
    pub created_at: DateTime,
    pub updated_at: DateTime,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    #[sea_orm(belongs_to, from = "food_group_id", to = "id")]
    pub food_group: BelongsTo<crate::models::person::nutritional_intake::food_group::Entity>,
    #[sea_orm(has_many)]
    pub food_nutrients: HasMany<crate::models::person::nutritional_intake::food_nutrient::Entity>,
    #[sea_orm(has_many)]
    pub local_dishes: HasMany<crate::models::person::nutritional_intake::local_dish::Entity>,
    #[sea_orm(has_many)]
    pub code_histories: HasMany<crate::models::person::nutritional_intake::code_history::Entity>,
    #[sea_orm(has_many)]
    pub corrections: HasMany<crate::models::person::nutritional_intake::correction::Entity>,
}

impl ActiveModelBehavior for ActiveModel {}
