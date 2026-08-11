use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PeriodePerkuliahanQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PeriodePerkuliahanResponse {
    pub id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    pub jumlah_pendaftar_ikut_seleksi: Option<i32>,
    pub jumlah_pendaftar_lulus_seleksi: Option<i32>,
    pub jumlah_daftar_ulang: Option<i32>,
    pub jumlah_mengundurkan_diri: Option<i32>,
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    pub jumlah_minggu_pertemuan: Option<i32>,
    pub metode_kul: Option<String>,
    pub metode_kul_eks: Option<String>,
    pub tgl_create: Option<NaiveDate>,
    pub last_update: Option<NaiveDate>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePeriodePerkuliahanRequest {
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    pub jumlah_pendaftar_ikut_seleksi: Option<i32>,
    pub jumlah_pendaftar_lulus_seleksi: Option<i32>,
    pub jumlah_daftar_ulang: Option<i32>,
    pub jumlah_mengundurkan_diri: Option<i32>,
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    pub jumlah_minggu_pertemuan: Option<i32>,
    pub metode_kul: Option<String>,
    pub metode_kul_eks: Option<String>,
    pub tgl_create: Option<NaiveDate>,
    pub last_update: Option<NaiveDate>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePeriodePerkuliahanRequest {
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    pub jumlah_pendaftar_ikut_seleksi: Option<i32>,
    pub jumlah_pendaftar_lulus_seleksi: Option<i32>,
    pub jumlah_daftar_ulang: Option<i32>,
    pub jumlah_mengundurkan_diri: Option<i32>,
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    pub jumlah_minggu_pertemuan: Option<i32>,
    pub metode_kul: Option<String>,
    pub metode_kul_eks: Option<String>,
    pub tgl_create: Option<NaiveDate>,
    pub last_update: Option<NaiveDate>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPeriodePerkuliahanResponse {
    pub data: Vec<PeriodePerkuliahanResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
