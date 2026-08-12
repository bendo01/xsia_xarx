use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct GroupQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct GroupResponse {
    pub id: Uuid,
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateGroupRequest {
    pub code: i32,
    pub alphabet_code: String,
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateGroupRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedGroupResponse {
    pub data: Vec<GroupResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
