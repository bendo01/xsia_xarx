use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EvaluationSummariQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EvaluationSummariResponse {
    pub id: Uuid,
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub stage_id: Uuid,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateEvaluationSummariRequest {
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub stage_id: Uuid,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEvaluationSummariRequest {
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEvaluationSummariResponse {
    pub data: Vec<EvaluationSummariResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
