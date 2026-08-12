use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CourseQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CourseResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub implementation_method: Option<String>,
    pub total_credit: f64,
    pub lecture_credit: f64,
    pub practice_credit: f64,
    pub field_practice_credit: f64,
    pub simulation_credit: f64,
    pub has_unit: bool,
    pub has_syllabus: bool,
    pub has_material: bool,
    pub has_practice: bool,
    pub has_dictation: bool,
    pub group_id: Option<Uuid>,
    pub variety_id: Uuid,
    pub unit_id: Uuid,
    pub competence_id: Option<Uuid>,
    pub feeder_course_group_id: Option<Uuid>,
    pub feeder_course_type_id: Option<Uuid>,
    pub feeder_course_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCourseRequest {
    pub code: String,
    pub name: String,
    pub implementation_method: Option<String>,
    pub total_credit: f64,
    pub lecture_credit: f64,
    pub practice_credit: f64,
    pub field_practice_credit: f64,
    pub simulation_credit: f64,
    pub has_unit: bool,
    pub has_syllabus: bool,
    pub has_material: bool,
    pub has_practice: bool,
    pub has_dictation: bool,
    pub group_id: Option<Uuid>,
    pub variety_id: Uuid,
    pub unit_id: Uuid,
    pub competence_id: Option<Uuid>,
    pub feeder_course_group_id: Option<Uuid>,
    pub feeder_course_type_id: Option<Uuid>,
    pub feeder_course_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCourseRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub implementation_method: Option<String>,
    pub total_credit: Option<f64>,
    pub lecture_credit: Option<f64>,
    pub practice_credit: Option<f64>,
    pub field_practice_credit: Option<f64>,
    pub simulation_credit: Option<f64>,
    pub has_unit: Option<bool>,
    pub has_syllabus: Option<bool>,
    pub has_material: Option<bool>,
    pub has_practice: Option<bool>,
    pub has_dictation: Option<bool>,
    pub group_id: Option<Uuid>,
    pub variety_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub competence_id: Option<Uuid>,
    pub feeder_course_group_id: Option<Uuid>,
    pub feeder_course_type_id: Option<Uuid>,
    pub feeder_course_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCourseResponse {
    pub data: Vec<CourseResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
