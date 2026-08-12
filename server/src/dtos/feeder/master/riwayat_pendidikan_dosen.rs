use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RiwayatPendidikanDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RiwayatPendidikanDosenResponse {
    pub id: Uuid,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_bidang_studi: Option<String>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenjang_pendidikan: Option<String>,
    pub nama_jenjang_pendidikan: Option<String>,
    pub id_gelar_akademik: Option<String>,
    pub nama_gelar_akademik: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub fakultas: Option<String>,
    pub tahun_lulus: Option<String>,
    pub sks_lulus: Option<f32>,
    pub ipk: Option<f32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRiwayatPendidikanDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_bidang_studi: Option<String>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenjang_pendidikan: Option<String>,
    pub nama_jenjang_pendidikan: Option<String>,
    pub id_gelar_akademik: Option<String>,
    pub nama_gelar_akademik: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub fakultas: Option<String>,
    pub tahun_lulus: Option<String>,
    pub sks_lulus: Option<f32>,
    pub ipk: Option<f32>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRiwayatPendidikanDosenRequest {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_bidang_studi: Option<String>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenjang_pendidikan: Option<String>,
    pub nama_jenjang_pendidikan: Option<String>,
    pub id_gelar_akademik: Option<String>,
    pub nama_gelar_akademik: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub fakultas: Option<String>,
    pub tahun_lulus: Option<String>,
    pub sks_lulus: Option<f32>,
    pub ipk: Option<f32>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRiwayatPendidikanDosenResponse {
    pub data: Vec<RiwayatPendidikanDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
