use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PrerequisitQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PrerequisitResponse {
    pub id: Uuid,
    pub thread: i32,
    pub requirement_id: Uuid,
    pub submission_id: Uuid,
    pub approval_type_id: Uuid,
    pub stage_id: Uuid,
    pub filename: Option<String>,
    pub dir: Option<String>,
    pub r#type: Option<String>,
    pub filesize: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePrerequisitRequest {
    pub thread: i32,
    pub requirement_id: Uuid,
    pub submission_id: Uuid,
    pub approval_type_id: Uuid,
    pub stage_id: Uuid,
    pub filename: Option<String>,
    pub dir: Option<String>,
    pub r#type: Option<String>,
    pub filesize: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePrerequisitRequest {
    pub thread: Option<i32>,
    pub requirement_id: Option<Uuid>,
    pub submission_id: Option<Uuid>,
    pub approval_type_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub filename: Option<String>,
    pub dir: Option<String>,
    pub r#type: Option<String>,
    pub filesize: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPrerequisitResponse {
    pub data: Vec<PrerequisitResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
