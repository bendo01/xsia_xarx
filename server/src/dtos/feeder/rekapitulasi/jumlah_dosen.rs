use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct JumlahDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct JumlahDosenResponse {
    pub id: Uuid,
    pub id_prodi: Option<Uuid>,
    pub id_periode: Option<Uuid>,
    pub nama_periode: Option<String>,
    pub nama_prodi: Option<String>,
    pub jumlah_dosen_homebase: Option<i32>,
    pub is_homebase: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateJumlahDosenRequest {
    pub id_prodi: Option<Uuid>,
    pub id_periode: Option<Uuid>,
    pub nama_periode: Option<String>,
    pub nama_prodi: Option<String>,
    pub jumlah_dosen_homebase: Option<i32>,
    pub is_homebase: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateJumlahDosenRequest {
    pub id_prodi: Option<Uuid>,
    pub id_periode: Option<Uuid>,
    pub nama_periode: Option<String>,
    pub nama_prodi: Option<String>,
    pub jumlah_dosen_homebase: Option<i32>,
    pub is_homebase: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedJumlahDosenResponse {
    pub data: Vec<JumlahDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
