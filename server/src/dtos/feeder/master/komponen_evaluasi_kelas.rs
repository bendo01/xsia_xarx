use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct KomponenEvaluasiKelaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KomponenEvaluasiKelaResponse {
    pub id: Uuid,
    pub id_komponen_evaluasi: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_jenis_evaluasi: Option<i32>,
    pub nama: Option<String>,
    pub nama_inggris: Option<String>,
    pub nomor_urut: Option<i32>,
    pub bobot_evaluasi: Option<String>,
    pub last_update: Option<NaiveDate>,
    pub tgl_create: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateKomponenEvaluasiKelaRequest {
    pub id_komponen_evaluasi: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_jenis_evaluasi: Option<i32>,
    pub nama: Option<String>,
    pub nama_inggris: Option<String>,
    pub nomor_urut: Option<i32>,
    pub bobot_evaluasi: Option<String>,
    pub last_update: Option<NaiveDate>,
    pub tgl_create: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateKomponenEvaluasiKelaRequest {
    pub id_komponen_evaluasi: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_jenis_evaluasi: Option<i32>,
    pub nama: Option<String>,
    pub nama_inggris: Option<String>,
    pub nomor_urut: Option<i32>,
    pub bobot_evaluasi: Option<String>,
    pub last_update: Option<NaiveDate>,
    pub tgl_create: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedKomponenEvaluasiKelaResponse {
    pub data: Vec<KomponenEvaluasiKelaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
