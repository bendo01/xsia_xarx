use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UjiMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UjiMahasiswaResponse {
    pub id: Uuid,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_uji: Option<Uuid>,
    pub id_kategori_kegiatan: Option<Uuid>,
    pub nama_kategori_kegiatan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub penguji_ke: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateUjiMahasiswaRequest {
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_uji: Option<Uuid>,
    pub id_kategori_kegiatan: Option<Uuid>,
    pub nama_kategori_kegiatan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub penguji_ke: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateUjiMahasiswaRequest {
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_uji: Option<Uuid>,
    pub id_kategori_kegiatan: Option<Uuid>,
    pub nama_kategori_kegiatan: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub penguji_ke: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedUjiMahasiswaResponse {
    pub data: Vec<UjiMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
