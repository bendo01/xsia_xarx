use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct KartuHasilStudiMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KartuHasilStudiMahasiswaResponse {
    pub id: Uuid,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<i32>,
    pub nama_mahasiswa: Option<String>,
    pub id_periode: Option<Uuid>,
    pub nama_periode: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<i32>,
    pub nilai_angka: Option<i32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<i32>,
    pub sks_x_indeks: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateKartuHasilStudiMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<i32>,
    pub nama_mahasiswa: Option<String>,
    pub id_periode: Option<Uuid>,
    pub nama_periode: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<i32>,
    pub nilai_angka: Option<i32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<i32>,
    pub sks_x_indeks: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateKartuHasilStudiMahasiswaRequest {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<i32>,
    pub nama_mahasiswa: Option<String>,
    pub id_periode: Option<Uuid>,
    pub nama_periode: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<i32>,
    pub nilai_angka: Option<i32>,
    pub nilai_huruf: Option<String>,
    pub nilai_indeks: Option<i32>,
    pub sks_x_indeks: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedKartuHasilStudiMahasiswaResponse {
    pub data: Vec<KartuHasilStudiMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
