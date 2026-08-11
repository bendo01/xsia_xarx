use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CourseEvaluationPlanningQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CourseEvaluationPlanningResponse {
    pub id: Uuid,
    pub name: String,
    pub percentage: Option<f32>,
    pub decription_indonesian: String,
    pub decription_english: Option<String>,
    pub course_id: Uuid,
    pub evaluation_type_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub code: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCourseEvaluationPlanningRequest {
    pub name: String,
    pub percentage: Option<f32>,
    pub decription_indonesian: String,
    pub decription_english: Option<String>,
    pub course_id: Uuid,
    pub evaluation_type_id: Uuid,
    pub code: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCourseEvaluationPlanningRequest {
    pub name: Option<String>,
    pub percentage: Option<f32>,
    pub decription_indonesian: Option<String>,
    pub decription_english: Option<String>,
    pub course_id: Option<Uuid>,
    pub evaluation_type_id: Option<Uuid>,
    pub code: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCourseEvaluationPlanningResponse {
    pub data: Vec<CourseEvaluationPlanningResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
