use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct DetailActivityEvaluationComponentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DetailActivityEvaluationComponentResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub detail_activity_id: Uuid,
    pub course_evaluation_planning_id: Uuid,
    pub mark: Option<f32>,
    pub percentage: Option<f32>,
    pub total: Option<f32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateDetailActivityEvaluationComponentRequest {
    pub name: Option<String>,
    pub detail_activity_id: Uuid,
    pub course_evaluation_planning_id: Uuid,
    pub mark: Option<f32>,
    pub percentage: Option<f32>,
    pub total: Option<f32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateDetailActivityEvaluationComponentRequest {
    pub name: Option<String>,
    pub detail_activity_id: Option<Uuid>,
    pub course_evaluation_planning_id: Option<Uuid>,
    pub mark: Option<f32>,
    pub percentage: Option<f32>,
    pub total: Option<f32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedDetailActivityEvaluationComponentResponse {
    pub data: Vec<DetailActivityEvaluationComponentResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
