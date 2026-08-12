use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EvaluationDetailQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EvaluationDetailResponse {
    pub id: Uuid,
    pub evaluation_summary_id: Uuid,
    pub adviser_id: Uuid,
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
pub struct CreateEvaluationDetailRequest {
    pub evaluation_summary_id: Uuid,
    pub adviser_id: Uuid,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEvaluationDetailRequest {
    pub evaluation_summary_id: Option<Uuid>,
    pub adviser_id: Option<Uuid>,
    pub mark: Option<f32>,
    pub grade_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEvaluationDetailResponse {
    pub data: Vec<EvaluationDetailResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
