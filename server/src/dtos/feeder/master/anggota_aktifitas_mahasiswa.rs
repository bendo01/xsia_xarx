use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AnggotaAktifitasMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AnggotaAktifitasMahasiswaResponse {
    pub id: Uuid,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_anggota: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub jenis_peran: Option<String>,
    pub nama_jenis_peran: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateAnggotaAktifitasMahasiswaRequest {
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_anggota: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub jenis_peran: Option<String>,
    pub nama_jenis_peran: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateAnggotaAktifitasMahasiswaRequest {
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_anggota: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub jenis_peran: Option<String>,
    pub nama_jenis_peran: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedAnggotaAktifitasMahasiswaResponse {
    pub data: Vec<AnggotaAktifitasMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
