use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ExamClassQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ExamClassResponse {
    pub id: Uuid,
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: String,
    pub phase_id: Option<Uuid>,
    pub start_date: NaiveDateTime,
    pub end_date: Option<NaiveDateTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub start_time: Option<NaiveTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub end_time: Option<NaiveTime>,
    pub capacity: i32,
    pub lms_category: Option<i32>,
    pub is_online: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateExamClassRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: String,
    pub phase_id: Option<Uuid>,
    pub start_date: NaiveDateTime,
    pub end_date: Option<NaiveDateTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub start_time: Option<NaiveTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub end_time: Option<NaiveTime>,
    pub capacity: i32,
    pub lms_category: Option<i32>,
    pub is_online: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateExamClassRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub phase_id: Option<Uuid>,
    pub start_date: Option<NaiveDateTime>,
    pub end_date: Option<NaiveDateTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub start_time: Option<NaiveTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub end_time: Option<NaiveTime>,
    pub capacity: Option<i32>,
    pub lms_category: Option<i32>,
    pub is_online: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedExamClassResponse {
    pub data: Vec<ExamClassResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
