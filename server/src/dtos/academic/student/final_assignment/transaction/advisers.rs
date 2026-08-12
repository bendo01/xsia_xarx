use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AdviserQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdviserResponse {
    pub id: Uuid,
    pub thread: i32,
    pub lecturer_id: Uuid,
    pub detail_activity_id: Uuid,
    pub submission_id: Option<Uuid>,
    pub adviser_category_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateAdviserRequest {
    pub thread: i32,
    pub lecturer_id: Uuid,
    pub detail_activity_id: Uuid,
    pub submission_id: Option<Uuid>,
    pub adviser_category_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateAdviserRequest {
    pub thread: Option<i32>,
    pub lecturer_id: Option<Uuid>,
    pub detail_activity_id: Option<Uuid>,
    pub submission_id: Option<Uuid>,
    pub adviser_category_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedAdviserResponse {
    pub data: Vec<AdviserResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
