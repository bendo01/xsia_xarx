use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct FinalAssignmentDecreeQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct FinalAssignmentDecreeResponse {
    pub id: Uuid,
    pub decree_number: String,
    pub decree_date: NaiveDate,
    pub unit_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub staff_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateFinalAssignmentDecreeRequest {
    pub decree_number: String,
    pub decree_date: NaiveDate,
    pub unit_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub staff_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateFinalAssignmentDecreeRequest {
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub unit_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub staff_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedFinalAssignmentDecreeResponse {
    pub data: Vec<FinalAssignmentDecreeResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
