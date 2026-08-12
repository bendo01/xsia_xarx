use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct KonversiKampusMerdekaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KonversiKampusMerdekaResponse {
    pub id: Uuid,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub id_konversi_aktivitas: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_anggota: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_indeks: Option<f32>,
    pub nilai_huruf: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateKonversiKampusMerdekaRequest {
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub id_konversi_aktivitas: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_anggota: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_indeks: Option<f32>,
    pub nilai_huruf: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateKonversiKampusMerdekaRequest {
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub id_konversi_aktivitas: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_anggota: Option<Uuid>,
    pub nama_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub nilai_angka: Option<f32>,
    pub nilai_indeks: Option<f32>,
    pub nilai_huruf: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedKonversiKampusMerdekaResponse {
    pub data: Vec<KonversiKampusMerdekaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
