use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;

use crate::dtos::academic::campaign::transaction::grades::GradeResponse;
use crate::dtos::academic::course::master::courses::CourseResponse;
use crate::dtos::academic::campaign::transaction::teaches::TeachResponse;
use crate::dtos::academic::campaign::transaction::teach_lecturers::TeachLecturerResponse;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct DetailActivityQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub activity_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DetailActivityResponse {
    pub id: Uuid,
    pub mark: Option<f64>,
    pub credit: Option<f64>,
    pub grade_id: Option<Uuid>,
    pub course_id: Uuid,
    pub activity_id: Uuid,
    pub teach_id: Option<Uuid>,
    pub is_lock: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub name: Option<String>,
    pub feeder_grade_id: Option<Uuid>,
    pub curiculum_detail_sequence: Option<i32>,
    pub grade: Option<GradeResponse>,
    pub course: Option<CourseResponse>,
    pub teach: Option<TeachResponse>,
    pub teach_lecturers: Option<Vec<TeachLecturerResponse>>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateDetailActivityRequest {
    pub mark: Option<f64>,
    pub credit: Option<f64>,
    pub grade_id: Option<Uuid>,
    pub course_id: Uuid,
    pub activity_id: Uuid,
    pub teach_id: Option<Uuid>,
    pub is_lock: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub name: Option<String>,
    pub feeder_grade_id: Option<Uuid>,
    pub curiculum_detail_sequence: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateDetailActivityRequest {
    pub mark: Option<f64>,
    pub credit: Option<f64>,
    pub grade_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub teach_id: Option<Uuid>,
    pub is_lock: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub name: Option<String>,
    pub feeder_grade_id: Option<Uuid>,
    pub curiculum_detail_sequence: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedDetailActivityResponse {
    pub data: Vec<DetailActivityResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
