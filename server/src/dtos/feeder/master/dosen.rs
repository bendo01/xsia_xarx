use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct DosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DosenResponse {
    pub id: Uuid,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nidn: Option<String>,
    pub nip: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub tanggal_lahir: Option<NaiveDate>,
    pub id_status_aktif: Option<String>,
    pub nama_status_aktif: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nidn: Option<String>,
    pub nip: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub tanggal_lahir: Option<NaiveDate>,
    pub id_status_aktif: Option<String>,
    pub nama_status_aktif: Option<String>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nidn: Option<String>,
    pub nip: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub tanggal_lahir: Option<NaiveDate>,
    pub id_status_aktif: Option<String>,
    pub nama_status_aktif: Option<String>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedDosenResponse {
    pub data: Vec<DosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
