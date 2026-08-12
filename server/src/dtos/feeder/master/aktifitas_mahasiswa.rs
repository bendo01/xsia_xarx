use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AktifitasMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AktifitasMahasiswaResponse {
    pub id: Uuid,
    pub asal_data: Option<String>,
    pub nm_asaldata: Option<String>,
    pub id_aktivitas: Option<Uuid>,
    pub jenis_anggota: Option<String>,
    pub nama_jenis_anggota: Option<String>,
    pub id_jenis_aktivitas: Option<Uuid>,
    pub nama_jenis_aktivitas: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_prodi: Option<String>,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub judul: Option<String>,
    pub keterangan: Option<String>,
    pub lokasi: Option<String>,
    pub sk_tugas: Option<String>,
    pub tanggal_sk_tugas: Option<NaiveDate>,
    pub untuk_kampus_merdeka: Option<i32>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateAktifitasMahasiswaRequest {
    pub asal_data: Option<String>,
    pub nm_asaldata: Option<String>,
    pub id_aktivitas: Option<Uuid>,
    pub jenis_anggota: Option<String>,
    pub nama_jenis_anggota: Option<String>,
    pub id_jenis_aktivitas: Option<Uuid>,
    pub nama_jenis_aktivitas: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_prodi: Option<String>,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub judul: Option<String>,
    pub keterangan: Option<String>,
    pub lokasi: Option<String>,
    pub sk_tugas: Option<String>,
    pub tanggal_sk_tugas: Option<NaiveDate>,
    pub untuk_kampus_merdeka: Option<i32>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateAktifitasMahasiswaRequest {
    pub asal_data: Option<String>,
    pub nm_asaldata: Option<String>,
    pub id_aktivitas: Option<Uuid>,
    pub jenis_anggota: Option<String>,
    pub nama_jenis_anggota: Option<String>,
    pub id_jenis_aktivitas: Option<Uuid>,
    pub nama_jenis_aktivitas: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_prodi: Option<String>,
    pub id_semester: Option<Uuid>,
    pub nama_semester: Option<String>,
    pub judul: Option<String>,
    pub keterangan: Option<String>,
    pub lokasi: Option<String>,
    pub sk_tugas: Option<String>,
    pub tanggal_sk_tugas: Option<NaiveDate>,
    pub untuk_kampus_merdeka: Option<i32>,
    pub tanggal_mulai: Option<NaiveDate>,
    pub tanggal_selesai: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedAktifitasMahasiswaResponse {
    pub data: Vec<AktifitasMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
