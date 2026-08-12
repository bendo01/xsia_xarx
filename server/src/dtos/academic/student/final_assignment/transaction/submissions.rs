use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct SubmissionQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SubmissionResponse {
    pub id: Uuid,
    pub title: Option<String>,
    pub student_id: Uuid,
    pub approval_type_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub final_assignment_decree_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub is_taken: Option<NaiveDateTime>,
    pub is_lock: Option<NaiveDateTime>,
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
pub struct CreateSubmissionRequest {
    pub title: Option<String>,
    pub student_id: Uuid,
    pub approval_type_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub final_assignment_decree_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub is_taken: Option<NaiveDateTime>,
    pub is_lock: Option<NaiveDateTime>,
    pub filename: Option<String>,
    pub dir: Option<String>,
    pub r#type: Option<String>,
    pub filesize: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateSubmissionRequest {
    pub title: Option<String>,
    pub student_id: Option<Uuid>,
    pub approval_type_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub final_assignment_decree_id: Option<Uuid>,
    pub detail_activity_id: Option<Uuid>,
    pub is_taken: Option<NaiveDateTime>,
    pub is_lock: Option<NaiveDateTime>,
    pub filename: Option<String>,
    pub dir: Option<String>,
    pub r#type: Option<String>,
    pub filesize: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedSubmissionResponse {
    pub data: Vec<SubmissionResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
