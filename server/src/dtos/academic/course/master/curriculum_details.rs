use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CurriculumDetailQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CurriculumDetailResponse {
    pub id: Uuid,
    pub code: Option<i32>,
    pub curriculum_id: Uuid,
    pub semester_id: Uuid,
    pub course_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub credit: Option<f64>,
    pub name: Option<String>,
    pub concentration_id: Option<Uuid>,
    pub is_convertable_to_mbkm: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub is_convertable_to_prior_learning_recognition: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCurriculumDetailRequest {
    pub code: Option<i32>,
    pub curriculum_id: Uuid,
    pub semester_id: Uuid,
    pub course_id: Uuid,
    pub credit: Option<f64>,
    pub name: Option<String>,
    pub concentration_id: Option<Uuid>,
    pub is_convertable_to_mbkm: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub is_convertable_to_prior_learning_recognition: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCurriculumDetailRequest {
    pub code: Option<i32>,
    pub curriculum_id: Option<Uuid>,
    pub semester_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
    pub credit: Option<f64>,
    pub name: Option<String>,
    pub concentration_id: Option<Uuid>,
    pub is_convertable_to_mbkm: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub is_convertable_to_prior_learning_recognition: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCurriculumDetailResponse {
    pub data: Vec<CurriculumDetailResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
