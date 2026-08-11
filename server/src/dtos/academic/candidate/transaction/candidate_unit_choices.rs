use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CandidateUnitChoicQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CandidateUnitChoicResponse {
    pub id: Uuid,
    pub candidate_id: Uuid,
    pub unit_id: Option<Uuid>,
    pub student_registration_id: Option<Uuid>,
    pub registration_category_id: Option<Uuid>,
    pub phase_id: Option<Uuid>,
    pub priority: i32,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCandidateUnitChoicRequest {
    pub candidate_id: Uuid,
    pub unit_id: Option<Uuid>,
    pub student_registration_id: Option<Uuid>,
    pub registration_category_id: Option<Uuid>,
    pub phase_id: Option<Uuid>,
    pub priority: i32,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCandidateUnitChoicRequest {
    pub candidate_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub student_registration_id: Option<Uuid>,
    pub registration_category_id: Option<Uuid>,
    pub phase_id: Option<Uuid>,
    pub priority: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCandidateUnitChoicResponse {
    pub data: Vec<CandidateUnitChoicResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
