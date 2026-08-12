use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EvaluationSummaryQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EvaluationSummaryResponse {
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
pub struct CreateEvaluationSummaryRequest {
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub stage_id: Uuid,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEvaluationSummaryRequest {
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEvaluationSummaryResponse {
    pub data: Vec<EvaluationSummaryResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
