use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PeriodeLampauQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PeriodeLampauResponse {
    pub id: Uuid,
    pub id_program_studi: Option<String>,
    pub program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub semester: Option<String>,
    pub tanggal_mulai_perkuliahan: Option<NaiveDate>,
    pub tanggal_selesai_perkuliahan: Option<NaiveDate>,
    pub tipe_periode: Option<String>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePeriodeLampauRequest {
    pub id_program_studi: Option<String>,
    pub program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub semester: Option<String>,
    pub tanggal_mulai_perkuliahan: Option<NaiveDate>,
    pub tanggal_selesai_perkuliahan: Option<NaiveDate>,
    pub tipe_periode: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePeriodeLampauRequest {
    pub id_program_studi: Option<String>,
    pub program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub semester: Option<String>,
    pub tanggal_mulai_perkuliahan: Option<NaiveDate>,
    pub tanggal_selesai_perkuliahan: Option<NaiveDate>,
    pub tipe_periode: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPeriodeLampauResponse {
    pub data: Vec<PeriodeLampauResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
