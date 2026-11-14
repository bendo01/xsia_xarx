use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use sea_orm::entity::prelude::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::food;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct FoodQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub food_group_id: Option<Uuid>,
    pub source_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct FoodResponse {
    pub id: Uuid,
    pub food_group_id: Uuid,
    pub source_id: Option<Uuid>,
    pub code: String,
    pub name: String,
    pub kind: Option<String>,
    pub edible_portion: Option<Decimal>,
    pub species: Option<String>,
    pub genus: Option<String>,
    pub family: Option<String>,
    pub english_name: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<food::Model> for FoodResponse {
    fn from(m: food::Model) -> Self {
        Self {
            id: m.id,
            food_group_id: m.food_group_id,
            source_id: m.source_id,
            code: m.code,
            name: m.name,
            kind: m.kind,
            edible_portion: m.edible_portion,
            species: m.species,
            genus: m.genus,
            family: m.family,
            english_name: m.english_name,
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
pub struct CreateFoodRequest {
    pub food_group_id: Uuid,
    pub source_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub code: String,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(max = 255))]
    pub kind: Option<String>,
    pub edible_portion: Option<Decimal>,
    #[validate(length(max = 255))]
    pub species: Option<String>,
    #[validate(length(max = 255))]
    pub genus: Option<String>,
    #[validate(length(max = 255))]
    pub family: Option<String>,
    #[validate(length(max = 255))]
    pub english_name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateFoodRequest {
    pub food_group_id: Option<Uuid>,
    pub source_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub code: Option<String>,
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    #[validate(length(max = 255))]
    pub kind: Option<String>,
    pub edible_portion: Option<Decimal>,
    #[validate(length(max = 255))]
    pub species: Option<String>,
    #[validate(length(max = 255))]
    pub genus: Option<String>,
    #[validate(length(max = 255))]
    pub family: Option<String>,
    #[validate(length(max = 255))]
    pub english_name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedFoodResponse {
    pub data: Vec<FoodResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
