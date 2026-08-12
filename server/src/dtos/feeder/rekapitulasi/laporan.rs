use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct LaporanQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct LaporanResponse {
    pub id: Uuid,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateLaporanRequest {
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateLaporanRequest {
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedLaporanResponse {
    pub data: Vec<LaporanResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
