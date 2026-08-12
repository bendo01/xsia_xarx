use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RencanaPembelajaranQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RencanaPembelajaranResponse {
    pub id: Uuid,
    pub id_rencana_ajar: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub pertemuan: Option<i32>,
    pub materi_indonesia: Option<String>,
    pub materi_inggris: Option<String>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRencanaPembelajaranRequest {
    pub id_rencana_ajar: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub pertemuan: Option<i32>,
    pub materi_indonesia: Option<String>,
    pub materi_inggris: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRencanaPembelajaranRequest {
    pub id_rencana_ajar: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub pertemuan: Option<i32>,
    pub materi_indonesia: Option<String>,
    pub materi_inggris: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRencanaPembelajaranResponse {
    pub data: Vec<RencanaPembelajaranResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
