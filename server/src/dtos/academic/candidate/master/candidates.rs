use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CandidateQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CandidateResponse {
    pub id: Uuid,
    pub thread: Option<i32>,
    pub code: Option<String>,
    pub name: String,
    pub student_national_number: Option<String>,
    pub school_name: Option<String>,
    pub school_regency_id: Option<Uuid>,
    pub state_smart_card_number: Option<String>,
    pub individual_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub student_id: Option<Uuid>,
    pub user_id: Uuid,
    pub registration_type_id: Uuid,
    pub institution_id: Uuid,
    pub guidence_name: Option<String>,
    pub guidence_phone_number: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCandidateRequest {
    pub thread: Option<i32>,
    pub code: Option<String>,
    pub name: String,
    pub student_national_number: Option<String>,
    pub school_name: Option<String>,
    pub school_regency_id: Option<Uuid>,
    pub state_smart_card_number: Option<String>,
    pub individual_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub student_id: Option<Uuid>,
    pub user_id: Uuid,
    pub registration_type_id: Uuid,
    pub institution_id: Uuid,
    pub guidence_name: Option<String>,
    pub guidence_phone_number: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCandidateRequest {
    pub thread: Option<i32>,
    pub code: Option<String>,
    pub name: Option<String>,
    pub student_national_number: Option<String>,
    pub school_name: Option<String>,
    pub school_regency_id: Option<Uuid>,
    pub state_smart_card_number: Option<String>,
    pub individual_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub student_id: Option<Uuid>,
    pub user_id: Option<Uuid>,
    pub registration_type_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub guidence_name: Option<String>,
    pub guidence_phone_number: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCandidateResponse {
    pub data: Vec<CandidateResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
