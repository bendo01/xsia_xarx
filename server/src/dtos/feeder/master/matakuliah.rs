use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct MatakuliahQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct MatakuliahResponse {
    pub id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_jenis_mata_kuliah: Option<String>,
    pub nama_jenis_mata_kuliah: Option<String>,
    pub id_kelompok_mata_kuliah: Option<String>,
    pub nama_kelompok_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub metode_kuliah: Option<String>,
    pub ada_sap: Option<bool>,
    pub ada_silabus: Option<bool>,
    pub ada_bahan_ajar: Option<bool>,
    pub ada_acara_praktek: Option<bool>,
    pub ada_diktat: Option<bool>,
    pub tanggal_mulai_efektif: Option<NaiveDateTime>,
    pub tanggal_selesai_efektif: Option<NaiveDateTime>,
    pub id_jenj_didik: Option<String>,
    pub tgl_create: Option<NaiveDateTime>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateMatakuliahRequest {
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_jenis_mata_kuliah: Option<String>,
    pub nama_jenis_mata_kuliah: Option<String>,
    pub id_kelompok_mata_kuliah: Option<String>,
    pub nama_kelompok_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub metode_kuliah: Option<String>,
    pub ada_sap: Option<bool>,
    pub ada_silabus: Option<bool>,
    pub ada_bahan_ajar: Option<bool>,
    pub ada_acara_praktek: Option<bool>,
    pub ada_diktat: Option<bool>,
    pub tanggal_mulai_efektif: Option<NaiveDateTime>,
    pub tanggal_selesai_efektif: Option<NaiveDateTime>,
    pub id_jenj_didik: Option<String>,
    pub tgl_create: Option<NaiveDateTime>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateMatakuliahRequest {
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_jenis_mata_kuliah: Option<String>,
    pub nama_jenis_mata_kuliah: Option<String>,
    pub id_kelompok_mata_kuliah: Option<String>,
    pub nama_kelompok_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub metode_kuliah: Option<String>,
    pub ada_sap: Option<bool>,
    pub ada_silabus: Option<bool>,
    pub ada_bahan_ajar: Option<bool>,
    pub ada_acara_praktek: Option<bool>,
    pub ada_diktat: Option<bool>,
    pub tanggal_mulai_efektif: Option<NaiveDateTime>,
    pub tanggal_selesai_efektif: Option<NaiveDateTime>,
    pub id_jenj_didik: Option<String>,
    pub tgl_create: Option<NaiveDateTime>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedMatakuliahResponse {
    pub data: Vec<MatakuliahResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
