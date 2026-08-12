use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EducationQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EducationResponse {
    pub id: Uuid,
    pub code: i32,
    pub alphabet_code: String,
    pub abbreviation: String,
    pub name: String,
    pub level_id: Uuid,
    pub group_id: Uuid,
    pub category_id: Uuid,
    pub variety_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateEducationRequest {
    pub code: i32,
    pub alphabet_code: String,
    pub abbreviation: String,
    pub name: String,
    pub level_id: Uuid,
    pub group_id: Uuid,
    pub category_id: Uuid,
    pub variety_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEducationRequest {
    pub code: Option<i32>,
    pub alphabet_code: Option<String>,
    pub abbreviation: Option<String>,
    pub name: Option<String>,
    pub level_id: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub variety_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEducationResponse {
    pub data: Vec<EducationResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
