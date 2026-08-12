use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EstimasiQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EstimasiResponse {
    pub id: Uuid,
    pub name: String,
    pub institution_id: Uuid,
    pub total_data_per_request: Option<i32>,
    pub last_offset: Option<i32>,
    pub total_data: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateEstimasiRequest {
    pub name: String,
    pub institution_id: Uuid,
    pub total_data_per_request: Option<i32>,
    pub last_offset: Option<i32>,
    pub total_data: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEstimasiRequest {
    pub name: Option<String>,
    pub institution_id: Option<Uuid>,
    pub total_data_per_request: Option<i32>,
    pub last_offset: Option<i32>,
    pub total_data: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEstimasiResponse {
    pub data: Vec<EstimasiResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
