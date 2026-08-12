use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct StaffesQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct StaffesResponse {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Uuid,
    pub unit_id: Uuid,
    pub position_type_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateStaffesRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Uuid,
    pub unit_id: Uuid,
    pub position_type_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateStaffesRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub employee_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub position_type_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedStaffesResponse {
    pub data: Vec<StaffesResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
