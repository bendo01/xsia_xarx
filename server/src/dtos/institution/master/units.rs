use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UnitResponse {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
    pub is_active: bool,
    pub unit_type_id: Uuid,
    pub institution_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub education_id: Uuid,
    pub feeder_id: Option<Uuid>,
    pub lft: Option<i64>,
    pub rght: Option<i64>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateUnitRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub is_active: bool,
    pub unit_type_id: Uuid,
    pub institution_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub education_id: Uuid,
    pub feeder_id: Option<Uuid>,
    pub lft: Option<i64>,
    pub rght: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateUnitRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub is_active: Option<bool>,
    pub unit_type_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub education_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub lft: Option<i64>,
    pub rght: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedUnitResponse {
    pub data: Vec<UnitResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
