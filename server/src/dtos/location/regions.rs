use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RegionQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RegionResponse {
    pub id: Uuid,
    pub code: Option<i32>,
    pub alphabet_code: String,
    pub name: String,
    pub slug: Option<String>,
    pub alt_slug: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRegionRequest {
    pub code: Option<i32>,
    pub alphabet_code: String,
    pub name: String,
    pub slug: Option<String>,
    pub alt_slug: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRegionRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub slug: Option<String>,
    pub alt_slug: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRegionResponse {
    pub data: Vec<RegionResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
