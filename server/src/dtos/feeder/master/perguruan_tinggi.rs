use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PerguruanTinggiQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PerguruanTinggiResponse {
    pub id: Uuid,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nama_singkat: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePerguruanTinggiRequest {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nama_singkat: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePerguruanTinggiRequest {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nama_singkat: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPerguruanTinggiResponse {
    pub data: Vec<PerguruanTinggiResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
