use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct JenisAktifitasMahasiswaQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct JenisAktifitasMahasiswaResponse {
    pub id: Uuid,
    pub id_jenis_aktivitas_mahasiswa: Option<String>,
    pub nama_jenis_aktivitas_mahasiswa: Option<String>,
    pub untuk_kampus_merdeka: Option<String>,
    pub jenis_aktivitas_mahasiswa: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateJenisAktifitasMahasiswaRequest {
    pub id_jenis_aktivitas_mahasiswa: Option<String>,
    pub nama_jenis_aktivitas_mahasiswa: Option<String>,
    pub untuk_kampus_merdeka: Option<String>,
    pub jenis_aktivitas_mahasiswa: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateJenisAktifitasMahasiswaRequest {
    pub id_jenis_aktivitas_mahasiswa: Option<String>,
    pub nama_jenis_aktivitas_mahasiswa: Option<String>,
    pub untuk_kampus_merdeka: Option<String>,
    pub jenis_aktivitas_mahasiswa: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedJenisAktifitasMahasiswaResponse {
    pub data: Vec<JenisAktifitasMahasiswaResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
