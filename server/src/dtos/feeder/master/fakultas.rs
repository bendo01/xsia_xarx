use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct FakultaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct FakultaResponse {
    pub id: Uuid,
    pub id_fakultas: Option<Uuid>,
    pub nama_fakultas: Option<String>,
    pub status: Option<String>,
    pub id_jenjang_pendidikan: Option<Uuid>,
    pub nama_jenjang_pendidikan: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateFakultaRequest {
    pub id_fakultas: Option<Uuid>,
    pub nama_fakultas: Option<String>,
    pub status: Option<String>,
    pub id_jenjang_pendidikan: Option<Uuid>,
    pub nama_jenjang_pendidikan: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateFakultaRequest {
    pub id_fakultas: Option<Uuid>,
    pub nama_fakultas: Option<String>,
    pub status: Option<String>,
    pub id_jenjang_pendidikan: Option<Uuid>,
    pub nama_jenjang_pendidikan: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedFakultaResponse {
    pub data: Vec<FakultaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
