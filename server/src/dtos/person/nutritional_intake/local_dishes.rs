use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::local_dish;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct LocalDishQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub food_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct LocalDishResponse {
    pub id: Uuid,
    pub food_id: Uuid,
    pub name: String,
    pub description: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<local_dish::Model> for LocalDishResponse {
    fn from(m: local_dish::Model) -> Self {
        Self {
            id: m.id,
            food_id: m.food_id,
            name: m.name,
            description: m.description,
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
pub struct CreateLocalDishRequest {
    pub food_id: Uuid,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateLocalDishRequest {
    pub food_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedLocalDishResponse {
    pub data: Vec<LocalDishResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
