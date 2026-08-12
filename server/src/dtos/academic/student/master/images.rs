use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ImageQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ImageResponse {
    pub id: Uuid,
    pub student_id: Uuid,
    pub filename: String,
    pub dir: String,
    pub mimetype: Option<String>,
    pub size: Option<i64>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateImageRequest {
    pub student_id: Uuid,
    pub filename: String,
    pub dir: String,
    pub mimetype: Option<String>,
    pub size: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateImageRequest {
    pub student_id: Option<Uuid>,
    pub filename: Option<String>,
    pub dir: Option<String>,
    pub mimetype: Option<String>,
    pub size: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedImageResponse {
    pub data: Vec<ImageResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
