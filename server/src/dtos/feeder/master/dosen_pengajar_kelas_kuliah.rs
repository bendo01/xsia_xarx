use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct DosenPengajarKelasKuliahQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DosenPengajarKelasKuliahResponse {
    pub id: Uuid,
    pub id_aktivitas_mengajar: Option<Uuid>,
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub id_substansi: Option<Uuid>,
    pub sks_substansi_total: Option<f32>,
    pub rencana_minggu_pertemuan: Option<i32>,
    pub realisasi_minggu_pertemuan: Option<i32>,
    pub id_jenis_evaluasi: Option<String>,
    pub nama_jenis_evaluasi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub id_semester: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateDosenPengajarKelasKuliahRequest {
    pub id_aktivitas_mengajar: Option<Uuid>,
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub id_substansi: Option<Uuid>,
    pub sks_substansi_total: Option<f32>,
    pub rencana_minggu_pertemuan: Option<i32>,
    pub realisasi_minggu_pertemuan: Option<i32>,
    pub id_jenis_evaluasi: Option<String>,
    pub nama_jenis_evaluasi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub id_semester: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateDosenPengajarKelasKuliahRequest {
    pub id_aktivitas_mengajar: Option<Uuid>,
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub id_substansi: Option<Uuid>,
    pub sks_substansi_total: Option<f32>,
    pub rencana_minggu_pertemuan: Option<i32>,
    pub realisasi_minggu_pertemuan: Option<i32>,
    pub id_jenis_evaluasi: Option<String>,
    pub nama_jenis_evaluasi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub id_semester: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedDosenPengajarKelasKuliahResponse {
    pub data: Vec<DosenPengajarKelasKuliahResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
