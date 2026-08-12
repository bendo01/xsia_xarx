use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RiwayatNilaiMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RiwayatNilaiMahasiswaResponse {
    pub id: Uuid,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_periode: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRiwayatNilaiMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_periode: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRiwayatNilaiMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_periode: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRiwayatNilaiMahasiswaResponse {
    pub data: Vec<RiwayatNilaiMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
