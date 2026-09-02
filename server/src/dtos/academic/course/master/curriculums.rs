use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CurriculumQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub unit_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CurriculumResponse {
    pub id: Uuid,
    pub name: String,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub curriculum_type_id: Uuid,
    pub total_credit: Option<f64>,
    pub mandatory_course_credit: Option<f64>,
    pub optional_course_credit: Option<f64>,
    pub feeder_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCurriculumRequest {
    pub name: String,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub curriculum_type_id: Uuid,
    pub total_credit: Option<f64>,
    pub mandatory_course_credit: Option<f64>,
    pub optional_course_credit: Option<f64>,
    pub feeder_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCurriculumRequest {
    pub name: Option<String>,
    pub unit_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub curriculum_type_id: Option<Uuid>,
    pub total_credit: Option<f64>,
    pub mandatory_course_credit: Option<f64>,
    pub optional_course_credit: Option<f64>,
    pub feeder_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCurriculumResponse {
    pub data: Vec<CurriculumResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
