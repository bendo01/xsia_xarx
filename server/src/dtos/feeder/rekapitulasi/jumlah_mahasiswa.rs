use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct JumlahMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct JumlahMahasiswaResponse {
    pub id: Uuid,
    pub id_prodi: Option<Uuid>,
    pub aktif: Option<String>,
    pub cuti: Option<String>,
    pub non_aktif: Option<String>,
    pub sedang_double_degree: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateJumlahMahasiswaRequest {
    pub id_prodi: Option<Uuid>,
    pub aktif: Option<String>,
    pub cuti: Option<String>,
    pub non_aktif: Option<String>,
    pub sedang_double_degree: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateJumlahMahasiswaRequest {
    pub id_prodi: Option<Uuid>,
    pub aktif: Option<String>,
    pub cuti: Option<String>,
    pub non_aktif: Option<String>,
    pub sedang_double_degree: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedJumlahMahasiswaResponse {
    pub data: Vec<JumlahMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
