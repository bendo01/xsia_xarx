use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::food_group;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct FoodGroupQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct FoodGroupResponse {
    pub id: Uuid,
    pub name: String,
    pub position: i32,
    pub raw_code: Option<String>,
    pub processed_code: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<food_group::Model> for FoodGroupResponse {
    fn from(m: food_group::Model) -> Self {
        Self {
            id: m.id,
            name: m.name,
            position: m.position,
            raw_code: m.raw_code,
            processed_code: m.processed_code,
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
pub struct CreateFoodGroupRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub position: i32,
    #[validate(length(max = 255))]
    pub raw_code: Option<String>,
    #[validate(length(max = 255))]
    pub processed_code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateFoodGroupRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    pub position: Option<i32>,
    #[validate(length(max = 255))]
    pub raw_code: Option<String>,
    #[validate(length(max = 255))]
    pub processed_code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedFoodGroupResponse {
    pub data: Vec<FoodGroupResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
