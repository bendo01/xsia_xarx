use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct JenisKeluarQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct JenisKeluarResponse {
    pub id: Uuid,
    pub id_jenis_keluar: Option<String>,
    pub jenis_keluar: Option<String>,
    pub apa_mahasiswa: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateJenisKeluarRequest {
    pub id_jenis_keluar: Option<String>,
    pub jenis_keluar: Option<String>,
    pub apa_mahasiswa: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateJenisKeluarRequest {
    pub id_jenis_keluar: Option<String>,
    pub jenis_keluar: Option<String>,
    pub apa_mahasiswa: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedJenisKeluarResponse {
    pub data: Vec<JenisKeluarResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
