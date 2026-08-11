use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EvaluationQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EvaluationResponse {
    pub id: Uuid,
    pub recognition_id: Option<Uuid>,
    pub course_evaluation_planning_id: Option<Uuid>,
    pub professionalism_id: Option<Uuid>,
    pub evidence_type_id: Option<Uuid>,
    pub evaluator_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateEvaluationRequest {
    pub recognition_id: Option<Uuid>,
    pub course_evaluation_planning_id: Option<Uuid>,
    pub professionalism_id: Option<Uuid>,
    pub evidence_type_id: Option<Uuid>,
    pub evaluator_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEvaluationRequest {
    pub recognition_id: Option<Uuid>,
    pub course_evaluation_planning_id: Option<Uuid>,
    pub professionalism_id: Option<Uuid>,
    pub evidence_type_id: Option<Uuid>,
    pub evaluator_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEvaluationResponse {
    pub data: Vec<EvaluationResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
