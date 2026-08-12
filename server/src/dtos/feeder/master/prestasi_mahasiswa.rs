use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PrestasiMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PrestasiMahasiswaResponse {
    pub id: Uuid,
    pub id_prestasi: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub id_jenis_prestasi: Option<Uuid>,
    pub nama_jenis_prestasi: Option<String>,
    pub id_tingkat_prestasi: Option<Uuid>,
    pub nama_tingkat_prestasi: Option<String>,
    pub nama_prestasi: Option<String>,
    pub tahun_prestasi: Option<i32>,
    pub penyelenggara: Option<String>,
    pub peringkat: Option<i32>,
    pub id_aktivitas: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePrestasiMahasiswaRequest {
    pub id_prestasi: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub id_jenis_prestasi: Option<Uuid>,
    pub nama_jenis_prestasi: Option<String>,
    pub id_tingkat_prestasi: Option<Uuid>,
    pub nama_tingkat_prestasi: Option<String>,
    pub nama_prestasi: Option<String>,
    pub tahun_prestasi: Option<i32>,
    pub penyelenggara: Option<String>,
    pub peringkat: Option<i32>,
    pub id_aktivitas: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePrestasiMahasiswaRequest {
    pub id_prestasi: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub id_jenis_prestasi: Option<Uuid>,
    pub nama_jenis_prestasi: Option<String>,
    pub id_tingkat_prestasi: Option<Uuid>,
    pub nama_tingkat_prestasi: Option<String>,
    pub nama_prestasi: Option<String>,
    pub tahun_prestasi: Option<i32>,
    pub penyelenggara: Option<String>,
    pub peringkat: Option<i32>,
    pub id_aktivitas: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPrestasiMahasiswaResponse {
    pub data: Vec<PrestasiMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
