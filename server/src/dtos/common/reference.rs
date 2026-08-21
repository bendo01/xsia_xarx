use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ReferenceResponse {
    pub id: Uuid,
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateReferenceRequest {
    #[validate(range(min = 1, message = "code must be >= 1"))]
    pub code: i32,
    #[validate(length(min = 1, max = 10, message = "alphabet_code must be 1–10 characters"))]
    pub alphabet_code: String,
    #[validate(length(min = 1, max = 255, message = "name must be 1–255 characters"))]
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateReferenceRequest {
    #[validate(range(min = 1, message = "code must be >= 1"))]
    pub code: Option<i32>,
    #[validate(length(min = 1, max = 10, message = "alphabet_code must be 1–10 characters"))]
    pub alphabet_code: Option<String>,
    #[validate(length(min = 1, max = 255, message = "name must be 1–255 characters"))]
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ReferenceQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedReferenceResponse {
    pub data: Vec<ReferenceResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct MessageResponse {
    pub message: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct OptionItem {
    pub id: Uuid,
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct OptionRequest {
    pub search: Option<String>,
}