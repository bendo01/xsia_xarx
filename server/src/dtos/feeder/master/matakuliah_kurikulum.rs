use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct MatakuliahKurikulumQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct MatakuliahKurikulumResponse {
    pub id: Uuid,
    pub tgl_create: Option<NaiveDate>,
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub apakah_wajib: Option<bool>,
    pub status_sync: Option<String>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub semester: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateMatakuliahKurikulumRequest {
    pub tgl_create: Option<NaiveDate>,
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub apakah_wajib: Option<bool>,
    pub status_sync: Option<String>,
    pub semester: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateMatakuliahKurikulumRequest {
    pub tgl_create: Option<NaiveDate>,
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub apakah_wajib: Option<bool>,
    pub status_sync: Option<String>,
    pub semester: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedMatakuliahKurikulumResponse {
    pub data: Vec<MatakuliahKurikulumResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
