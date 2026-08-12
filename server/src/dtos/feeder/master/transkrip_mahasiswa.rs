use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct TranskripMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct TranskripMahasiswaResponse {
    pub id: Uuid,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_nilai_transfer: Option<String>,
    pub id_konversi_aktivitas: Option<String>,
    pub smt_diambil: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateTranskripMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_nilai_transfer: Option<String>,
    pub id_konversi_aktivitas: Option<String>,
    pub smt_diambil: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateTranskripMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_nilai_transfer: Option<String>,
    pub id_konversi_aktivitas: Option<String>,
    pub smt_diambil: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<f32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedTranskripMahasiswaResponse {
    pub data: Vec<TranskripMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
