use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct DosenPembimbingQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DosenPembimbingResponse {
    pub id: Uuid,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
    pub jenis_aktivitas: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateDosenPembimbingRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
    pub jenis_aktivitas: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateDosenPembimbingRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
    pub jenis_aktivitas: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedDosenPembimbingResponse {
    pub data: Vec<DosenPembimbingResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
