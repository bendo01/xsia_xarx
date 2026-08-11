use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RespondQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RespondResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub conduct_id: Uuid,
    pub bundle_id: Uuid,
    pub question_id: Uuid,
    pub answer_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRespondRequest {
    pub name: Option<String>,
    pub conduct_id: Uuid,
    pub bundle_id: Uuid,
    pub question_id: Uuid,
    pub answer_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRespondRequest {
    pub name: Option<String>,
    pub conduct_id: Option<Uuid>,
    pub bundle_id: Option<Uuid>,
    pub question_id: Option<Uuid>,
    pub answer_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRespondResponse {
    pub data: Vec<RespondResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
