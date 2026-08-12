use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PangkatGolonganQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PangkatGolonganResponse {
    pub id: Uuid,
    pub id_pangkat_golongan: Option<String>,
    pub kode_golongan: Option<String>,
    pub nama_pangkat: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePangkatGolonganRequest {
    pub id_pangkat_golongan: Option<String>,
    pub kode_golongan: Option<String>,
    pub nama_pangkat: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePangkatGolonganRequest {
    pub id_pangkat_golongan: Option<String>,
    pub kode_golongan: Option<String>,
    pub nama_pangkat: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPangkatGolonganResponse {
    pub data: Vec<PangkatGolonganResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
