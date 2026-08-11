use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RiwayatSertifikasiDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RiwayatSertifikasiDosenResponse {
    pub id: Uuid,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub nomor_peserta: Option<String>,
    pub id_bidang_studi: Option<String>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenis_sertifikasi: Option<String>,
    pub nama_jenis_sertifikasi: Option<String>,
    pub tahun_sertifikasi: Option<String>,
    pub sk_sertifikasi: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRiwayatSertifikasiDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub nomor_peserta: Option<String>,
    pub id_bidang_studi: Option<String>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenis_sertifikasi: Option<String>,
    pub nama_jenis_sertifikasi: Option<String>,
    pub tahun_sertifikasi: Option<String>,
    pub sk_sertifikasi: Option<String>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRiwayatSertifikasiDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub nomor_peserta: Option<String>,
    pub id_bidang_studi: Option<String>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenis_sertifikasi: Option<String>,
    pub nama_jenis_sertifikasi: Option<String>,
    pub tahun_sertifikasi: Option<String>,
    pub sk_sertifikasi: Option<String>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRiwayatSertifikasiDosenResponse {
    pub data: Vec<RiwayatSertifikasiDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
