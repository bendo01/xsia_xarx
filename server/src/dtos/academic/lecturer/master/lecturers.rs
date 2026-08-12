use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct LecturerQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct LecturerResponse {
    pub id: Uuid,
    pub code: String,
    pub name: Option<String>,
    pub individual_id: Uuid,
    pub institution_id: Option<Uuid>,
    pub alternative_code: Option<String>,
    pub accessor_number: Option<String>,
    pub identification_number: Option<String>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
    pub rank_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub nuptk: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateLecturerRequest {
    pub code: String,
    pub name: Option<String>,
    pub individual_id: Uuid,
    pub institution_id: Option<Uuid>,
    pub alternative_code: Option<String>,
    pub accessor_number: Option<String>,
    pub identification_number: Option<String>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
    pub rank_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateLecturerRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub individual_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub alternative_code: Option<String>,
    pub accessor_number: Option<String>,
    pub identification_number: Option<String>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
    pub rank_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedLecturerResponse {
    pub data: Vec<LecturerResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
