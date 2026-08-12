use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ArchivQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ArchivResponse {
    pub id: Uuid,
    pub name: String,
    pub dir: String,
    pub mimetype: String,
    pub size: Option<i32>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub archive_type_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub description: Option<String>,
    pub is_knowledge: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateArchivRequest {
    pub name: String,
    pub dir: String,
    pub mimetype: String,
    pub size: Option<i32>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub archive_type_id: Uuid,
    pub description: Option<String>,
    pub is_knowledge: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateArchivRequest {
    pub name: Option<String>,
    pub dir: Option<String>,
    pub mimetype: Option<String>,
    pub size: Option<i32>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub archive_type_id: Option<Uuid>,
    pub description: Option<String>,
    pub is_knowledge: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedArchivResponse {
    pub data: Vec<ArchivResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
