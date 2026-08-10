use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EducationResponse {
    pub id: Uuid,
    pub code: i32,
    pub alphabet_code: String,
    pub abbreviation: String,
    pub name: String,
    pub level_id: Uuid,
    pub group_id: Uuid,
    pub category_id: Uuid,
    pub variety_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateEducationRequest {
    #[validate(range(min = 1, message = "code must be >= 1"))]
    pub code: i32,
    #[validate(length(min = 1, max = 10, message = "alphabet_code must be 1–10 characters"))]
    pub alphabet_code: String,
    #[validate(length(min = 1, max = 50, message = "abbreviation must be 1–50 characters"))]
    pub abbreviation: String,
    #[validate(length(min = 1, max = 255, message = "name must be 1–255 characters"))]
    pub name: String,
    pub level_id: Uuid,
    pub group_id: Uuid,
    pub category_id: Uuid,
    pub variety_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEducationRequest {
    #[validate(range(min = 1, message = "code must be >= 1"))]
    pub code: Option<i32>,
    #[validate(length(min = 1, max = 10, message = "alphabet_code must be 1–10 characters"))]
    pub alphabet_code: Option<String>,
    #[validate(length(min = 1, max = 50, message = "abbreviation must be 1–50 characters"))]
    pub abbreviation: Option<String>,
    #[validate(length(min = 1, max = 255, message = "name must be 1–255 characters"))]
    pub name: Option<String>,
    pub level_id: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub variety_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EducationQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<i32>,
    pub level_id: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub variety_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEducationResponse {
    pub data: Vec<EducationResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
