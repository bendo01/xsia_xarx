use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct SemesterQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SemesterResponse {
    pub id: Uuid,
    pub id_semester: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_semester: Option<String>,
    pub semester: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateSemesterRequest {
    pub id_semester: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_semester: Option<String>,
    pub semester: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateSemesterRequest {
    pub id_semester: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_semester: Option<String>,
    pub semester: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedSemesterResponse {
    pub data: Vec<SemesterResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
