use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct KategoriKegiatanQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KategoriKegiatanResponse {
    pub id: Uuid,
    pub id_kategori_kegiatan: Option<i32>,
    pub nama_kategori_kegiatan: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateKategoriKegiatanRequest {
    pub id_kategori_kegiatan: Option<i32>,
    pub nama_kategori_kegiatan: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateKategoriKegiatanRequest {
    pub id_kategori_kegiatan: Option<i32>,
    pub nama_kategori_kegiatan: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedKategoriKegiatanResponse {
    pub data: Vec<KategoriKegiatanResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
