use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AktifitasKuliahMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AktifitasKuliahMahasiswaResponse {
    pub id: Uuid,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    pub ips: Option<f32>,
    pub ipk: Option<f32>,
    pub sks_semester: Option<f32>,
    pub sks_total: Option<f32>,
    pub biaya_kuliah_smt: Option<f32>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateAktifitasKuliahMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    pub ips: Option<f32>,
    pub ipk: Option<f32>,
    pub sks_semester: Option<f32>,
    pub sks_total: Option<f32>,
    pub biaya_kuliah_smt: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateAktifitasKuliahMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    pub ips: Option<f32>,
    pub ipk: Option<f32>,
    pub sks_semester: Option<f32>,
    pub sks_total: Option<f32>,
    pub biaya_kuliah_smt: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedAktifitasKuliahMahasiswaResponse {
    pub data: Vec<AktifitasKuliahMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
