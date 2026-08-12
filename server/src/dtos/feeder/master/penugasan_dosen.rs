use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PenugasanDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PenugasanDosenResponse {
    pub id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    pub tanggal_surat_tugas: Option<String>,
    pub mulai_surat_tugas: Option<String>,
    pub tgl_create: Option<String>,
    pub tgl_ptk_keluar: Option<String>,
    pub id_stat_pegawai: Option<i32>,
    pub id_jns_keluar: Option<i32>,
    pub id_ikatan_kerja: Option<String>,
    pub apakah_homebase: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePenugasanDosenRequest {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    pub tanggal_surat_tugas: Option<String>,
    pub mulai_surat_tugas: Option<String>,
    pub tgl_create: Option<String>,
    pub tgl_ptk_keluar: Option<String>,
    pub id_stat_pegawai: Option<i32>,
    pub id_jns_keluar: Option<i32>,
    pub id_ikatan_kerja: Option<String>,
    pub apakah_homebase: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePenugasanDosenRequest {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    pub tanggal_surat_tugas: Option<String>,
    pub mulai_surat_tugas: Option<String>,
    pub tgl_create: Option<String>,
    pub tgl_ptk_keluar: Option<String>,
    pub id_stat_pegawai: Option<i32>,
    pub id_jns_keluar: Option<i32>,
    pub id_ikatan_kerja: Option<String>,
    pub apakah_homebase: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPenugasanDosenResponse {
    pub data: Vec<PenugasanDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
