use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EmployeeQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub individual_id: Option<Uuid>,
    pub with_relations: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EmployeeResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub institution_id: Uuid,
    pub individual_id: Uuid,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub is_active: bool,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,

    // Belongs to relations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub individual: Option<Box<crate::dtos::person::master::individual::IndividualResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub institution: Option<crate::dtos::institution::master::institutions::InstitutionResponse>,

    // Has many relations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub staffes: Option<Vec<crate::dtos::institution::master::staffes::StaffResponse>>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateEmployeeRequest {
    pub code: String,
    pub name: String,
    pub institution_id: Uuid,
    pub individual_id: Uuid,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateEmployeeRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub institution_id: Option<Uuid>,
    pub individual_id: Option<Uuid>,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedEmployeeResponse {
    pub data: Vec<EmployeeResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
