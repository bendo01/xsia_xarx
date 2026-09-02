use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct HomebaseQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub lecturer_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct HomebaseResponse {
    pub id: Uuid,
    pub lecturer_id: Uuid,
    pub unit_id: Uuid,
    pub institution_id: Uuid,
    pub status_id: Uuid,
    pub contract_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateHomebaseRequest {
    pub lecturer_id: Uuid,
    pub unit_id: Uuid,
    pub institution_id: Uuid,
    pub status_id: Uuid,
    pub contract_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateHomebaseRequest {
    pub lecturer_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedHomebaseResponse {
    pub data: Vec<HomebaseResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
