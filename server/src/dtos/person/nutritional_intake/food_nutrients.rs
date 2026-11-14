use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use sea_orm::entity::prelude::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::food_nutrient;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct FoodNutrientQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub food_id: Option<Uuid>,
    pub nutrient_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct FoodNutrientResponse {
    pub id: Uuid,
    pub food_id: Uuid,
    pub nutrient_id: Uuid,
    pub value: Option<Decimal>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<food_nutrient::Model> for FoodNutrientResponse {
    fn from(m: food_nutrient::Model) -> Self {
        Self {
            id: m.id,
            food_id: m.food_id,
            nutrient_id: m.nutrient_id,
            value: m.value,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone)]
pub struct CreateFoodNutrientRequest {
    pub food_id: Uuid,
    pub nutrient_id: Uuid,
    pub value: Option<Decimal>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateFoodNutrientRequest {
    pub food_id: Option<Uuid>,
    pub nutrient_id: Option<Uuid>,
    pub value: Option<Decimal>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedFoodNutrientResponse {
    pub data: Vec<FoodNutrientResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
