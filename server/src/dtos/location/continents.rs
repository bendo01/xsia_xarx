use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;
use rust_decimal::Decimal;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ContinentResponse {
    pub id: Uuid,
    pub code: Option<i32>,
    pub alphabet_code: String,
    pub name: String,
    pub slug: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateContinentRequest {
    pub code: Option<i32>,
    pub alphabet_code: String,
    pub name: String,
    pub slug: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateContinentRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub slug: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ContinentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub code: Option<i32>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedContinentResponse {
    pub data: Vec<ContinentResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
