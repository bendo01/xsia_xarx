use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ClassCodeQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ClassCodeResponse {
    pub id: Uuid,
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: String,
    pub activity_id: Uuid,
    pub start_effective_date: Option<NaiveDate>,
    pub end_effective_date: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub capacity: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateClassCodeRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: String,
    pub activity_id: Uuid,
    pub start_effective_date: Option<NaiveDate>,
    pub end_effective_date: Option<NaiveDate>,
    pub unit_id: Option<Uuid>,
    pub capacity: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateClassCodeRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub activity_id: Option<Uuid>,
    pub start_effective_date: Option<NaiveDate>,
    pub end_effective_date: Option<NaiveDate>,
    pub unit_id: Option<Uuid>,
    pub capacity: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedClassCodeResponse {
    pub data: Vec<ClassCodeResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
