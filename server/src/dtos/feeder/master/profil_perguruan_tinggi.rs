use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ProfilPerguruanTinggiQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ProfilPerguruanTinggiResponse {
    pub id: Uuid,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub telepon: Option<String>,
    pub faximile: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub kelurahan: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub lintang_bujur: Option<String>,
    pub bank: Option<String>,
    pub unit_cabang: Option<String>,
    pub nomor_rekening: Option<String>,
    pub mbs: Option<String>,
    pub luas_tanah_milik: Option<String>,
    pub luas_tanah_bukan_milik: Option<String>,
    pub sk_pendirian: Option<String>,
    pub id_status_milik: Option<String>,
    pub nama_status_milik: Option<String>,
    pub status_perguruan_tinggi: Option<String>,
    pub sk_izin_operasional: Option<String>,
    pub tanggal_izin_operasional: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub nama_singkat: Option<String>,
    pub rt_rw: Option<String>,
    pub tanggal_sk_pendirian: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateProfilPerguruanTinggiRequest {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub telepon: Option<String>,
    pub faximile: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub kelurahan: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub lintang_bujur: Option<String>,
    pub bank: Option<String>,
    pub unit_cabang: Option<String>,
    pub nomor_rekening: Option<String>,
    pub mbs: Option<String>,
    pub luas_tanah_milik: Option<String>,
    pub luas_tanah_bukan_milik: Option<String>,
    pub sk_pendirian: Option<String>,
    pub id_status_milik: Option<String>,
    pub nama_status_milik: Option<String>,
    pub status_perguruan_tinggi: Option<String>,
    pub sk_izin_operasional: Option<String>,
    pub tanggal_izin_operasional: Option<NaiveDate>,
    pub nama_singkat: Option<String>,
    pub rt_rw: Option<String>,
    pub tanggal_sk_pendirian: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateProfilPerguruanTinggiRequest {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub telepon: Option<String>,
    pub faximile: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub kelurahan: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub lintang_bujur: Option<String>,
    pub bank: Option<String>,
    pub unit_cabang: Option<String>,
    pub nomor_rekening: Option<String>,
    pub mbs: Option<String>,
    pub luas_tanah_milik: Option<String>,
    pub luas_tanah_bukan_milik: Option<String>,
    pub sk_pendirian: Option<String>,
    pub id_status_milik: Option<String>,
    pub nama_status_milik: Option<String>,
    pub status_perguruan_tinggi: Option<String>,
    pub sk_izin_operasional: Option<String>,
    pub tanggal_izin_operasional: Option<NaiveDate>,
    pub nama_singkat: Option<String>,
    pub rt_rw: Option<String>,
    pub tanggal_sk_pendirian: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedProfilPerguruanTinggiResponse {
    pub data: Vec<ProfilPerguruanTinggiResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
