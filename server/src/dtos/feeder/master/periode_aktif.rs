use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PeriodeAktifQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PeriodeAktifResponse {
    pub id: Uuid,
    pub id_prodi: Option<Uuid>,
    pub kode_prodi: Option<String>,
    pub nama_program_studi: Option<String>,
    pub status_prodi: Option<String>,
    pub jenjang_pendidikan: Option<String>,
    pub periode_pelaporan: Option<String>,
    pub tipe_periode: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePeriodeAktifRequest {
    pub id_prodi: Option<Uuid>,
    pub kode_prodi: Option<String>,
    pub nama_program_studi: Option<String>,
    pub status_prodi: Option<String>,
    pub jenjang_pendidikan: Option<String>,
    pub periode_pelaporan: Option<String>,
    pub tipe_periode: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePeriodeAktifRequest {
    pub id_prodi: Option<Uuid>,
    pub kode_prodi: Option<String>,
    pub nama_program_studi: Option<String>,
    pub status_prodi: Option<String>,
    pub jenjang_pendidikan: Option<String>,
    pub periode_pelaporan: Option<String>,
    pub tipe_periode: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPeriodeAktifResponse {
    pub data: Vec<PeriodeAktifResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
