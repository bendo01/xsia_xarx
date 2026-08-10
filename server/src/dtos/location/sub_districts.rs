use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;
use rust_decimal::Decimal;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SubDistrictResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub dikti_code: Option<String>,
    pub regency_id: Uuid,
    pub slug: Option<String>,
    pub alt_slug: Option<String>,
    pub state_ministry_code: Option<String>,
    pub state_ministry_full_code: Option<String>,
    pub state_post_department_code: Option<String>,
    pub state_ministry_name: Option<String>,
    pub dikti_name: Option<String>,
    pub validation_code: Option<String>,
    pub agriculture_department_name: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateSubDistrictRequest {
    pub code: String,
    pub name: String,
    pub dikti_code: Option<String>,
    pub regency_id: Uuid,
    pub slug: Option<String>,
    pub alt_slug: Option<String>,
    pub state_ministry_code: Option<String>,
    pub state_ministry_full_code: Option<String>,
    pub state_post_department_code: Option<String>,
    pub state_ministry_name: Option<String>,
    pub dikti_name: Option<String>,
    pub validation_code: Option<String>,
    pub agriculture_department_name: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateSubDistrictRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub dikti_code: Option<String>,
    pub regency_id: Option<Uuid>,
    pub slug: Option<String>,
    pub alt_slug: Option<String>,
    pub state_ministry_code: Option<String>,
    pub state_ministry_full_code: Option<String>,
    pub state_post_department_code: Option<String>,
    pub state_ministry_name: Option<String>,
    pub dikti_name: Option<String>,
    pub validation_code: Option<String>,
    pub agriculture_department_name: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct SubDistrictQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub regency_id: Option<Uuid>,
    pub validation_code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedSubDistrictResponse {
    pub data: Vec<SubDistrictResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
