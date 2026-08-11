use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct StudentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct StudentResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub selection_type_id: Uuid,
    pub registered: NaiveDate,
    pub individual_id: Uuid,
    pub status_id: Uuid,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub registration_id: Uuid,
    pub nisn: Option<String>,
    pub resign_status_id: Uuid,
    pub concentration_id: Uuid,
    pub curriculum_id: Uuid,
    pub class_code_id: Uuid,
    pub transfer_code: Option<String>,
    pub transfer_unit_id: Uuid,
    pub id_mahasiswa: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub finance_fee: Option<f64>,
    pub finance_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateStudentRequest {
    pub code: String,
    pub name: String,
    pub selection_type_id: Uuid,
    pub registered: NaiveDate,
    pub individual_id: Uuid,
    pub status_id: Uuid,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub registration_id: Uuid,
    pub nisn: Option<String>,
    pub resign_status_id: Uuid,
    pub concentration_id: Uuid,
    pub curriculum_id: Uuid,
    pub class_code_id: Uuid,
    pub transfer_code: Option<String>,
    pub transfer_unit_id: Uuid,
    pub id_mahasiswa: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub finance_fee: Option<f64>,
    pub finance_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateStudentRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub selection_type_id: Option<Uuid>,
    pub registered: Option<NaiveDate>,
    pub individual_id: Option<Uuid>,
    pub status_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub registration_id: Option<Uuid>,
    pub nisn: Option<String>,
    pub resign_status_id: Option<Uuid>,
    pub concentration_id: Option<Uuid>,
    pub curriculum_id: Option<Uuid>,
    pub class_code_id: Option<Uuid>,
    pub transfer_code: Option<String>,
    pub transfer_unit_id: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub finance_fee: Option<f64>,
    pub finance_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedStudentResponse {
    pub data: Vec<StudentResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
