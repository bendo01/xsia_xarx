use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::nutrient;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct NutrientQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub tagname: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct NutrientResponse {
    pub id: Uuid,
    pub name: String,
    pub tagname: String,
    pub unit: Option<String>,
    pub decimal_places: i32,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<nutrient::Model> for NutrientResponse {
    fn from(m: nutrient::Model) -> Self {
        Self {
            id: m.id,
            name: m.name,
            tagname: m.tagname,
            unit: m.unit,
            decimal_places: m.decimal_places,
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
pub struct CreateNutrientRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: String,
    #[validate(length(min = 1, max = 255))]
    pub tagname: String,
    #[validate(length(max = 255))]
    pub unit: Option<String>,
    pub decimal_places: i32,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateNutrientRequest {
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
    #[validate(length(min = 1, max = 255))]
    pub tagname: Option<String>,
    #[validate(length(max = 255))]
    pub unit: Option<String>,
    pub decimal_places: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedNutrientResponse {
    pub data: Vec<NutrientResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
