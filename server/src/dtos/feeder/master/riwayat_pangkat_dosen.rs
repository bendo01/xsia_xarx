use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RiwayatPangkatDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RiwayatPangkatDosenResponse {
    pub id: Uuid,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_pangkat_golongan: Option<Uuid>,
    pub nama_pangkat_golongan: Option<String>,
    pub sk_pangkat: Option<String>,
    pub tanggal_sk_pangkat: Option<NaiveDate>,
    pub mulai_sk_pangkat: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nuptk: Option<String>,
    pub masa_kerja_dalam_tahun: Option<i32>,
    pub masa_kerja_dalam_bulan: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRiwayatPangkatDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_pangkat_golongan: Option<Uuid>,
    pub nama_pangkat_golongan: Option<String>,
    pub sk_pangkat: Option<String>,
    pub tanggal_sk_pangkat: Option<NaiveDate>,
    pub mulai_sk_pangkat: Option<NaiveDate>,
    pub nuptk: Option<String>,
    pub masa_kerja_dalam_tahun: Option<i32>,
    pub masa_kerja_dalam_bulan: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRiwayatPangkatDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_pangkat_golongan: Option<Uuid>,
    pub nama_pangkat_golongan: Option<String>,
    pub sk_pangkat: Option<String>,
    pub tanggal_sk_pangkat: Option<NaiveDate>,
    pub mulai_sk_pangkat: Option<NaiveDate>,
    pub nuptk: Option<String>,
    pub masa_kerja_dalam_tahun: Option<i32>,
    pub masa_kerja_dalam_bulan: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRiwayatPangkatDosenResponse {
    pub data: Vec<RiwayatPangkatDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
