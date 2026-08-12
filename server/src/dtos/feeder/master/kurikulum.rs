use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct KurikulumQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KurikulumResponse {
    pub id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_jenj_didik: Option<i32>,
    pub jml_sem_normal: Option<i32>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    pub jumlah_sks_lulus: Option<f32>,
    pub jumlah_sks_wajib: Option<f32>,
    pub jumlah_sks_pilihan: Option<f32>,
    pub jumlah_sks_mata_kuliah_wajib: Option<f32>,
    pub jumlah_sks_mata_kuliah_pilihan: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateKurikulumRequest {
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_jenj_didik: Option<i32>,
    pub jml_sem_normal: Option<i32>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    pub jumlah_sks_lulus: Option<f32>,
    pub jumlah_sks_wajib: Option<f32>,
    pub jumlah_sks_pilihan: Option<f32>,
    pub jumlah_sks_mata_kuliah_wajib: Option<f32>,
    pub jumlah_sks_mata_kuliah_pilihan: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateKurikulumRequest {
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_jenj_didik: Option<i32>,
    pub jml_sem_normal: Option<i32>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    pub jumlah_sks_lulus: Option<f32>,
    pub jumlah_sks_wajib: Option<f32>,
    pub jumlah_sks_pilihan: Option<f32>,
    pub jumlah_sks_mata_kuliah_wajib: Option<f32>,
    pub jumlah_sks_mata_kuliah_pilihan: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedKurikulumResponse {
    pub data: Vec<KurikulumResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
