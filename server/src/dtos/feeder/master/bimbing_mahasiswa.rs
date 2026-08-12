use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BimbingMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct BimbingMahasiswaResponse {
    pub id: Uuid,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_bimbing_mahasiswa: Option<Uuid>,
    pub id_kategori_kegiatan: Option<Uuid>,
    pub nama_kategori_kegiatan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateBimbingMahasiswaRequest {
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_bimbing_mahasiswa: Option<Uuid>,
    pub id_kategori_kegiatan: Option<Uuid>,
    pub nama_kategori_kegiatan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateBimbingMahasiswaRequest {
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_bimbing_mahasiswa: Option<Uuid>,
    pub id_kategori_kegiatan: Option<Uuid>,
    pub nama_kategori_kegiatan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub pembimbing_ke: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedBimbingMahasiswaResponse {
    pub data: Vec<BimbingMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
