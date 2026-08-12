use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ExamQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ExamResponse {
    pub id: Uuid,
    pub candidate_id: Uuid,
    pub exam_class_id: Uuid,
    pub score: f64,
    pub is_present: Option<bool>,
    pub is_pass: bool,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateExamRequest {
    pub candidate_id: Uuid,
    pub exam_class_id: Uuid,
    pub score: f64,
    pub is_present: Option<bool>,
    pub is_pass: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateExamRequest {
    pub candidate_id: Option<Uuid>,
    pub exam_class_id: Option<Uuid>,
    pub score: Option<f64>,
    pub is_present: Option<bool>,
    pub is_pass: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedExamResponse {
    pub data: Vec<ExamResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
