use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ConvertionQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ConvertionResponse {
    pub id: Uuid,
    pub student_id: Uuid,
    pub course_id: Uuid,
    pub grade_id: Uuid,
    pub transfer_code: String,
    pub transfer_name: String,
    pub transfer_credit: f64,
    pub transfer_grade: String,
    pub is_lock: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub name: Option<String>,
    pub academic_year_id: Option<Uuid>,
    pub origin_code: Option<String>,
    pub origin_name: Option<String>,
    pub origin_credit: Option<f64>,
    pub origin_grade: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateConvertionRequest {
    pub student_id: Uuid,
    pub course_id: Uuid,
    pub grade_id: Uuid,
    pub transfer_code: String,
    pub transfer_name: String,
    pub transfer_credit: f64,
    pub transfer_grade: String,
    pub is_lock: Option<NaiveDateTime>,
    pub feeder_id: Option<Uuid>,
    pub name: Option<String>,
    pub academic_year_id: Option<Uuid>,
    pub origin_code: Option<String>,
    pub origin_name: Option<String>,
    pub origin_credit: Option<f64>,
    pub origin_grade: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateConvertionRequest {
    pub student_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
    pub grade_id: Option<Uuid>,
    pub transfer_code: Option<String>,
    pub transfer_name: Option<String>,
    pub transfer_credit: Option<f64>,
    pub transfer_grade: Option<String>,
    pub is_lock: Option<NaiveDateTime>,
    pub feeder_id: Option<Uuid>,
    pub name: Option<String>,
    pub academic_year_id: Option<Uuid>,
    pub origin_code: Option<String>,
    pub origin_name: Option<String>,
    pub origin_credit: Option<f64>,
    pub origin_grade: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedConvertionResponse {
    pub data: Vec<ConvertionResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
