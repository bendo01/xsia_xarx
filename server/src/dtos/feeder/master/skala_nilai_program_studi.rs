use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct SkalaNilaiProgramStudiQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SkalaNilaiProgramStudiResponse {
    pub id: Uuid,
    pub tgl_create: Option<NaiveDate>,
    pub id_bobot_nilai: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub bobot_minimum: Option<f32>,
    pub bobot_maksimum: Option<f32>,
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateSkalaNilaiProgramStudiRequest {
    pub tgl_create: Option<NaiveDate>,
    pub id_bobot_nilai: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub bobot_minimum: Option<f32>,
    pub bobot_maksimum: Option<f32>,
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateSkalaNilaiProgramStudiRequest {
    pub tgl_create: Option<NaiveDate>,
    pub id_bobot_nilai: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub bobot_minimum: Option<f32>,
    pub bobot_maksimum: Option<f32>,
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedSkalaNilaiProgramStudiResponse {
    pub data: Vec<SkalaNilaiProgramStudiResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
