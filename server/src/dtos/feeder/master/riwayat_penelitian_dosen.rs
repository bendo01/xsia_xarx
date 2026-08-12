use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RiwayatPenelitianDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RiwayatPenelitianDosenResponse {
    pub id: Uuid,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_penelitian: Option<Uuid>,
    pub judul_penelitian: Option<String>,
    pub id_kelompok_bidang: Option<Uuid>,
    pub kode_kelompok_bidang: Option<String>,
    pub nama_kelompok_bidang: Option<String>,
    pub id_lembaga_iptek: Option<Uuid>,
    pub nama_lembaga_iptek: Option<String>,
    pub tahun_kegiatan: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRiwayatPenelitianDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_penelitian: Option<Uuid>,
    pub judul_penelitian: Option<String>,
    pub id_kelompok_bidang: Option<Uuid>,
    pub kode_kelompok_bidang: Option<String>,
    pub nama_kelompok_bidang: Option<String>,
    pub id_lembaga_iptek: Option<Uuid>,
    pub nama_lembaga_iptek: Option<String>,
    pub tahun_kegiatan: Option<String>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRiwayatPenelitianDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_penelitian: Option<Uuid>,
    pub judul_penelitian: Option<String>,
    pub id_kelompok_bidang: Option<Uuid>,
    pub kode_kelompok_bidang: Option<String>,
    pub nama_kelompok_bidang: Option<String>,
    pub id_lembaga_iptek: Option<Uuid>,
    pub nama_lembaga_iptek: Option<String>,
    pub tahun_kegiatan: Option<String>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRiwayatPenelitianDosenResponse {
    pub data: Vec<RiwayatPenelitianDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
