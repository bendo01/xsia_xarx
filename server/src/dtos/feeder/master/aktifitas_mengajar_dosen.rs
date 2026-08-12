use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AktifitasMengajarDosenQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AktifitasMengajarDosenResponse {
    pub id: Uuid,
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub rencana_minggu_pertemuan: Option<i32>,
    pub realisasi_minggu_pertemuan: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateAktifitasMengajarDosenRequest {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub rencana_minggu_pertemuan: Option<i32>,
    pub realisasi_minggu_pertemuan: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateAktifitasMengajarDosenRequest {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub rencana_minggu_pertemuan: Option<i32>,
    pub realisasi_minggu_pertemuan: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedAktifitasMengajarDosenResponse {
    pub data: Vec<AktifitasMengajarDosenResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
