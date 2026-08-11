use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct WilayahQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct WilayahResponse {
    pub id: Uuid,
    pub id_level_wilayah: Option<i32>,
    pub id_wilayah: Option<String>,
    pub id_negara: Option<String>,
    pub nama_wilayah: Option<String>,
    pub id_induk_wilayah: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateWilayahRequest {
    pub id_level_wilayah: Option<i32>,
    pub id_wilayah: Option<String>,
    pub id_negara: Option<String>,
    pub nama_wilayah: Option<String>,
    pub id_induk_wilayah: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateWilayahRequest {
    pub id_level_wilayah: Option<i32>,
    pub id_wilayah: Option<String>,
    pub id_negara: Option<String>,
    pub nama_wilayah: Option<String>,
    pub id_induk_wilayah: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedWilayahResponse {
    pub data: Vec<WilayahResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
