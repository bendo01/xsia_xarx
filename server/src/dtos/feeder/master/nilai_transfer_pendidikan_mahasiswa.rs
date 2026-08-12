use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct NilaiTransferPendidikanMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct NilaiTransferPendidikanMahasiswaResponse {
    pub id: Uuid,
    pub id_transfer: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_periode_masuk: Option<String>,
    pub kode_mata_kuliah_asal: Option<String>,
    pub nama_mata_kuliah_asal: Option<String>,
    pub sks_mata_kuliah_asal: Option<f32>,
    pub nilai_huruf_asal: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_matkul_diakui: Option<String>,
    pub nama_mata_kuliah_diakui: Option<String>,
    pub sks_mata_kuliah_diakui: Option<f32>,
    pub nilai_huruf_diakui: Option<String>,
    pub nilai_angka_diakui: Option<f32>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub id_aktivitas: Option<String>,
    pub judul: Option<String>,
    pub id_jenis_aktivitas: Option<String>,
    pub nama_jenis_aktivitas: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateNilaiTransferPendidikanMahasiswaRequest {
    pub id_transfer: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_periode_masuk: Option<String>,
    pub kode_mata_kuliah_asal: Option<String>,
    pub nama_mata_kuliah_asal: Option<String>,
    pub sks_mata_kuliah_asal: Option<f32>,
    pub nilai_huruf_asal: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_matkul_diakui: Option<String>,
    pub nama_mata_kuliah_diakui: Option<String>,
    pub sks_mata_kuliah_diakui: Option<f32>,
    pub nilai_huruf_diakui: Option<String>,
    pub nilai_angka_diakui: Option<f32>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub id_aktivitas: Option<String>,
    pub judul: Option<String>,
    pub id_jenis_aktivitas: Option<String>,
    pub nama_jenis_aktivitas: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateNilaiTransferPendidikanMahasiswaRequest {
    pub id_transfer: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_periode_masuk: Option<String>,
    pub kode_mata_kuliah_asal: Option<String>,
    pub nama_mata_kuliah_asal: Option<String>,
    pub sks_mata_kuliah_asal: Option<f32>,
    pub nilai_huruf_asal: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_matkul_diakui: Option<String>,
    pub nama_mata_kuliah_diakui: Option<String>,
    pub sks_mata_kuliah_diakui: Option<f32>,
    pub nilai_huruf_diakui: Option<String>,
    pub nilai_angka_diakui: Option<f32>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub id_aktivitas: Option<String>,
    pub judul: Option<String>,
    pub id_jenis_aktivitas: Option<String>,
    pub nama_jenis_aktivitas: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedNilaiTransferPendidikanMahasiswaResponse {
    pub data: Vec<NilaiTransferPendidikanMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
