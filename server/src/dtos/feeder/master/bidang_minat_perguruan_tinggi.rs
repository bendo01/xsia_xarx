use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BidangMinatPerguruanTinggiQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct BidangMinatPerguruanTinggiResponse {
    pub id: Uuid,
    pub id_bidang_minat: Option<Uuid>,
    pub nm_bidang_minat: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub smt_dimulai: Option<i32>,
    pub sk_bidang_minat: Option<i32>,
    pub tamat_sk_bidang_minat: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateBidangMinatPerguruanTinggiRequest {
    pub id_bidang_minat: Option<Uuid>,
    pub nm_bidang_minat: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub smt_dimulai: Option<i32>,
    pub sk_bidang_minat: Option<i32>,
    pub tamat_sk_bidang_minat: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateBidangMinatPerguruanTinggiRequest {
    pub id_bidang_minat: Option<Uuid>,
    pub nm_bidang_minat: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub smt_dimulai: Option<i32>,
    pub sk_bidang_minat: Option<i32>,
    pub tamat_sk_bidang_minat: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedBidangMinatPerguruanTinggiResponse {
    pub data: Vec<BidangMinatPerguruanTinggiResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
