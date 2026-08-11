use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct SubstansiMatakuliahQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SubstansiMatakuliahResponse {
    pub id: Uuid,
    pub id_substansi: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_substansi: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub id_jenis_substansi: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateSubstansiMatakuliahRequest {
    pub id_substansi: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_substansi: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub id_jenis_substansi: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateSubstansiMatakuliahRequest {
    pub id_substansi: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_substansi: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub sks_tatap_muka: Option<f32>,
    pub sks_praktek: Option<f32>,
    pub sks_praktek_lapangan: Option<f32>,
    pub sks_simulasi: Option<f32>,
    pub id_jenis_substansi: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedSubstansiMatakuliahResponse {
    pub data: Vec<SubstansiMatakuliahResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
