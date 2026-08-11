use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct NilaiPerkuliahanKelaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct NilaiPerkuliahanKelaResponse {
    pub id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub jumlah_mahasiswa_krs: Option<i32>,
    pub jumlah_mahasiswa_dapat_nilai: Option<i32>,
    pub sks_tm: Option<f32>,
    pub sks_prak: Option<f32>,
    pub sks_prak_lap: Option<f32>,
    pub sks_sim: Option<f32>,
    pub bahasan_case: Option<String>,
    pub a_selenggara_pditt: Option<i32>,
    pub a_pengguna_pditt: Option<i32>,
    pub kuota_pditt: Option<i32>,
    pub tgl_mulai_koas: Option<NaiveDate>,
    pub tgl_selesai_koas: Option<NaiveDate>,
    pub id_mou: Option<Uuid>,
    pub id_kls_pditt: Option<Uuid>,
    pub id_sms: Option<Uuid>,
    pub id_smt: Option<String>,
    pub tgl_create: Option<NaiveDate>,
    pub lingkup_kelas: Option<i32>,
    pub mode_kuliah: Option<String>,
    pub nm_smt: Option<String>,
    pub nama_prodi: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateNilaiPerkuliahanKelaRequest {
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub jumlah_mahasiswa_krs: Option<i32>,
    pub jumlah_mahasiswa_dapat_nilai: Option<i32>,
    pub sks_tm: Option<f32>,
    pub sks_prak: Option<f32>,
    pub sks_prak_lap: Option<f32>,
    pub sks_sim: Option<f32>,
    pub bahasan_case: Option<String>,
    pub a_selenggara_pditt: Option<i32>,
    pub a_pengguna_pditt: Option<i32>,
    pub kuota_pditt: Option<i32>,
    pub tgl_mulai_koas: Option<NaiveDate>,
    pub tgl_selesai_koas: Option<NaiveDate>,
    pub id_mou: Option<Uuid>,
    pub id_kls_pditt: Option<Uuid>,
    pub id_sms: Option<Uuid>,
    pub id_smt: Option<String>,
    pub tgl_create: Option<NaiveDate>,
    pub lingkup_kelas: Option<i32>,
    pub mode_kuliah: Option<String>,
    pub nm_smt: Option<String>,
    pub nama_prodi: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateNilaiPerkuliahanKelaRequest {
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<f32>,
    pub jumlah_mahasiswa_krs: Option<i32>,
    pub jumlah_mahasiswa_dapat_nilai: Option<i32>,
    pub sks_tm: Option<f32>,
    pub sks_prak: Option<f32>,
    pub sks_prak_lap: Option<f32>,
    pub sks_sim: Option<f32>,
    pub bahasan_case: Option<String>,
    pub a_selenggara_pditt: Option<i32>,
    pub a_pengguna_pditt: Option<i32>,
    pub kuota_pditt: Option<i32>,
    pub tgl_mulai_koas: Option<NaiveDate>,
    pub tgl_selesai_koas: Option<NaiveDate>,
    pub id_mou: Option<Uuid>,
    pub id_kls_pditt: Option<Uuid>,
    pub id_sms: Option<Uuid>,
    pub id_smt: Option<String>,
    pub tgl_create: Option<NaiveDate>,
    pub lingkup_kelas: Option<i32>,
    pub mode_kuliah: Option<String>,
    pub nm_smt: Option<String>,
    pub nama_prodi: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedNilaiPerkuliahanKelaResponse {
    pub data: Vec<NilaiPerkuliahanKelaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
