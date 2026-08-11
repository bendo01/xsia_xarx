use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RencanaEvaluasiQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RencanaEvaluasiResponse {
    pub id: Uuid,
    pub id_jenis_evaluasi: Option<String>,
    pub id_rencana_evaluasi: Option<Uuid>,
    pub jenis_evaluasi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_evaluasi: Option<String>,
    pub deskripsi_indonesia: Option<String>,
    pub deskrips_inggris: Option<String>,
    pub nomor_urut: Option<String>,
    pub bobot_evaluasi: Option<String>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRencanaEvaluasiRequest {
    pub id_jenis_evaluasi: Option<String>,
    pub id_rencana_evaluasi: Option<Uuid>,
    pub jenis_evaluasi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_evaluasi: Option<String>,
    pub deskripsi_indonesia: Option<String>,
    pub deskrips_inggris: Option<String>,
    pub nomor_urut: Option<String>,
    pub bobot_evaluasi: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRencanaEvaluasiRequest {
    pub id_jenis_evaluasi: Option<String>,
    pub id_rencana_evaluasi: Option<Uuid>,
    pub jenis_evaluasi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_evaluasi: Option<String>,
    pub deskripsi_indonesia: Option<String>,
    pub deskrips_inggris: Option<String>,
    pub nomor_urut: Option<String>,
    pub bobot_evaluasi: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRencanaEvaluasiResponse {
    pub data: Vec<RencanaEvaluasiResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
