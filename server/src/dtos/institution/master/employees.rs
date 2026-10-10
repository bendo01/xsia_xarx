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

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EmployeeOptionRequest {
    pub search: Option<String>,
    pub institution_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct EmployeeIndividualLookupRequest {
    pub search: Option<String>,
    pub institution_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct EmployeeIndividualLookupItem {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub birth_place: String,
    pub birth_date: NaiveDate,
    pub user_id: Option<Uuid>,
    pub user_email: Option<String>,
    /// Already registered as an employee of the requested institution
    pub is_employee: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct RegisterEmployeeNewIndividual {
    #[validate(length(min = 1, max = 32, message = "NIK is required"))]
    pub code: String,
    #[validate(length(min = 1, max = 255, message = "Name is required"))]
    pub name: String,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    #[validate(length(min = 1, max = 255, message = "Birth place is required"))]
    pub birth_place: String,
    pub birth_date: NaiveDate,
    pub gender_id: Uuid,
    pub religion_id: Uuid,
    #[validate(email(message = "Email is invalid"))]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
    #[validate(length(min = 8, max = 20, message = "Phone number is invalid"))]
    pub phone_number: String,
    #[validate(length(min = 1, message = "Street is required"))]
    pub street: String,
    pub citizens_association: i32,
    pub neighborhood_association: i32,
    pub province_id: Option<Uuid>,
    pub regency_id: Option<Uuid>,
    pub sub_district_id: Option<Uuid>,
    pub village_id: Option<Uuid>,
}

/// Exactly one of `individual_id` (existing individual, plus `new_account` when it has no user) or `new_individual` must be set
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct RegisterEmployeeRequest {
    pub institution_id: Uuid,
    #[validate(length(min = 1, max = 64, message = "Employee code is required"))]
    pub code: String,
    pub decree_number: Option<String>,
    pub decree_date: Option<NaiveDate>,
    pub is_active: bool,
    pub individual_id: Option<Uuid>,
    /// Login account for an existing individual that has none; required in that case
    #[validate(nested)]
    pub new_account: Option<RegisterEmployeeNewAccount>,
    #[validate(nested)]
    pub new_individual: Option<RegisterEmployeeNewIndividual>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct RegisterEmployeeNewAccount {
    #[validate(email(message = "Email is invalid"))]
    pub email: String,
    #[validate(length(min = 8, message = "Password must be at least 8 characters"))]
    pub password: String,
}
