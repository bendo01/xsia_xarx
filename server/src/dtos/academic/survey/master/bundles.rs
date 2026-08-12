use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDateTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BundleQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct BundleResponse {
    pub id: Uuid,
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
    pub institution_id: Uuid,
    pub bundle_category_id: Uuid,
    pub unit_id: Option<Uuid>,
    pub suggestion: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateBundleRequest {
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
    pub institution_id: Uuid,
    pub bundle_category_id: Uuid,
    pub unit_id: Option<Uuid>,
    pub suggestion: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateBundleRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub institution_id: Option<Uuid>,
    pub bundle_category_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub suggestion: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedBundleResponse {
    pub data: Vec<BundleResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
