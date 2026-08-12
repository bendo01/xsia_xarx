use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct KelasKuliahQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KelasKuliahResponse {
    pub id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_kelas_kuliah: Uuid,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mk: Option<f32>,
    pub sks_tm: Option<f32>,
    pub sks_prak: Option<f32>,
    pub sks_prak_lap: Option<f32>,
    pub sks_sim: Option<f32>,
    pub bahasan: Option<String>,
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    pub kapasitas: Option<i32>,
    pub tanggal_tutup_daftar: Option<NaiveDate>,
    pub prodi_penyelenggara: Option<String>,
    pub perguruan_tinggi_penyelenggara: Option<String>,
    pub sks: Option<f32>,
    pub id_dosen: Option<String>,
    pub nama_dosen: Option<String>,
    pub jumlah_mahasiswa: Option<i32>,
    pub apa_untuk_pditt: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateKelasKuliahRequest {
    pub id_kelas_kuliah: Uuid,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mk: Option<f32>,
    pub sks_tm: Option<f32>,
    pub sks_prak: Option<f32>,
    pub sks_prak_lap: Option<f32>,
    pub sks_sim: Option<f32>,
    pub bahasan: Option<String>,
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    pub kapasitas: Option<i32>,
    pub tanggal_tutup_daftar: Option<NaiveDate>,
    pub prodi_penyelenggara: Option<String>,
    pub perguruan_tinggi_penyelenggara: Option<String>,
    pub sks: Option<f32>,
    pub id_dosen: Option<String>,
    pub nama_dosen: Option<String>,
    pub jumlah_mahasiswa: Option<i32>,
    pub apa_untuk_pditt: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateKelasKuliahRequest {
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub nama_kelas_kuliah: Option<String>,
    pub sks_mk: Option<f32>,
    pub sks_tm: Option<f32>,
    pub sks_prak: Option<f32>,
    pub sks_prak_lap: Option<f32>,
    pub sks_sim: Option<f32>,
    pub bahasan: Option<String>,
    pub tanggal_mulai_efektif: Option<NaiveDate>,
    pub tanggal_akhir_efektif: Option<NaiveDate>,
    pub kapasitas: Option<i32>,
    pub tanggal_tutup_daftar: Option<NaiveDate>,
    pub prodi_penyelenggara: Option<String>,
    pub perguruan_tinggi_penyelenggara: Option<String>,
    pub sks: Option<f32>,
    pub id_dosen: Option<String>,
    pub nama_dosen: Option<String>,
    pub jumlah_mahasiswa: Option<i32>,
    pub apa_untuk_pditt: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedKelasKuliahResponse {
    pub data: Vec<KelasKuliahResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
