use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct MahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct MahasiswaResponse {
    pub id: Uuid,
    pub nama_mahasiswa: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub tanggal_lahir: Option<NaiveDate>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nipd: Option<String>,
    pub ipk: Option<f32>,
    pub total_sks: Option<f32>,
    pub id_sms: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub nama_program_studi: Option<String>,
    pub id_status_mahasiswa: Option<i32>,
    pub nama_status_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode_masuk: Option<String>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_periode_keluar: Option<String>,
    pub tanggal_keluar: Option<NaiveDate>,
    pub last_update: Option<NaiveDate>,
    pub tgl_create: Option<NaiveDate>,
    pub status_sync: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateMahasiswaRequest {
    pub nama_mahasiswa: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub tanggal_lahir: Option<NaiveDate>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nipd: Option<String>,
    pub ipk: Option<f32>,
    pub total_sks: Option<f32>,
    pub id_sms: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub nama_program_studi: Option<String>,
    pub id_status_mahasiswa: Option<i32>,
    pub nama_status_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode_masuk: Option<String>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_periode_keluar: Option<String>,
    pub tanggal_keluar: Option<NaiveDate>,
    pub last_update: Option<NaiveDate>,
    pub tgl_create: Option<NaiveDate>,
    pub status_sync: Option<String>,
    pub id_prodi: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateMahasiswaRequest {
    pub nama_mahasiswa: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub tanggal_lahir: Option<NaiveDate>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nipd: Option<String>,
    pub ipk: Option<f32>,
    pub total_sks: Option<f32>,
    pub id_sms: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub nama_program_studi: Option<String>,
    pub id_status_mahasiswa: Option<i32>,
    pub nama_status_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode_masuk: Option<String>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_periode_keluar: Option<String>,
    pub tanggal_keluar: Option<NaiveDate>,
    pub last_update: Option<NaiveDate>,
    pub tgl_create: Option<NaiveDate>,
    pub status_sync: Option<String>,
    pub id_prodi: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedMahasiswaResponse {
    pub data: Vec<MahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
