use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct TahunAjaranQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct TahunAjaranResponse {
    pub id: Uuid,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
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
pub struct CreateTahunAjaranRequest {
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateTahunAjaranRequest {
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedTahunAjaranResponse {
    pub data: Vec<TahunAjaranResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
