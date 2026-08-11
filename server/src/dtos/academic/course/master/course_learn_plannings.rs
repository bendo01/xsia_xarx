use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CourseLearnPlanningQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CourseLearnPlanningResponse {
    pub id: Uuid,
    pub code: i32,
    pub name: String,
    pub decription_indonesian: String,
    pub decription_english: Option<String>,
    pub course_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub feeder_id_rencana_ajar: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCourseLearnPlanningRequest {
    pub code: i32,
    pub name: String,
    pub decription_indonesian: String,
    pub decription_english: Option<String>,
    pub course_id: Uuid,
    pub feeder_id_rencana_ajar: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCourseLearnPlanningRequest {
    pub code: Option<i32>,
    pub name: Option<String>,
    pub decription_indonesian: Option<String>,
    pub decription_english: Option<String>,
    pub course_id: Option<Uuid>,
    pub feeder_id_rencana_ajar: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCourseLearnPlanningResponse {
    pub data: Vec<CourseLearnPlanningResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
