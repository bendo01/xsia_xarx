use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RiwayatFungsionalDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RiwayatFungsionalDosenResponse {
    pub id: Uuid,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_jabatan_fungsional: Option<Uuid>,
    pub nama_jabatan_fungsional: Option<String>,
    pub sk_jabatan_fungsional: Option<String>,
    pub mulai_sk_jabatan: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRiwayatFungsionalDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_jabatan_fungsional: Option<Uuid>,
    pub nama_jabatan_fungsional: Option<String>,
    pub sk_jabatan_fungsional: Option<String>,
    pub mulai_sk_jabatan: Option<NaiveDate>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRiwayatFungsionalDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_jabatan_fungsional: Option<Uuid>,
    pub nama_jabatan_fungsional: Option<String>,
    pub sk_jabatan_fungsional: Option<String>,
    pub mulai_sk_jabatan: Option<NaiveDate>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRiwayatFungsionalDosenResponse {
    pub data: Vec<RiwayatFungsionalDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
