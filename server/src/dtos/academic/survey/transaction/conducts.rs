use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDateTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ConductQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ConductResponse {
    pub id: Uuid,
    pub alphabet_code: Option<String>,
    pub name: String,
    pub bundle_id: Uuid,
    pub conductable_type: String,
    pub conductable_id: Uuid,
    pub is_finish: bool,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateConductRequest {
    pub alphabet_code: Option<String>,
    pub name: String,
    pub bundle_id: Uuid,
    pub conductable_type: String,
    pub conductable_id: Uuid,
    pub is_finish: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateConductRequest {
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub bundle_id: Option<Uuid>,
    pub conductable_type: Option<String>,
    pub conductable_id: Option<Uuid>,
    pub is_finish: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedConductResponse {
    pub data: Vec<ConductResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
