use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct JenisPendaftaranQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct JenisPendaftaranResponse {
    pub id: Uuid,
    pub id_jenis_daftar: Option<String>,
    pub nama_jenis_daftar: Option<String>,
    pub untuk_daftar_sekolah: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateJenisPendaftaranRequest {
    pub id_jenis_daftar: Option<String>,
    pub nama_jenis_daftar: Option<String>,
    pub untuk_daftar_sekolah: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateJenisPendaftaranRequest {
    pub id_jenis_daftar: Option<String>,
    pub nama_jenis_daftar: Option<String>,
    pub untuk_daftar_sekolah: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedJenisPendaftaranResponse {
    pub data: Vec<JenisPendaftaranResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
