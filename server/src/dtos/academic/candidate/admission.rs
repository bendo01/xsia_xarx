use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};

use crate::dtos::auth::user::UserResponse;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct AdmissionRegisterRequest {
    #[validate(length(min = 1, message = "Institution code is required"))]
    pub institution_code: String,
    pub academic_year_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255, message = "Name is required"))]
    pub name: String,
    #[validate(length(equal = 16, message = "NIK must be 16 digits"))]
    pub nik: String,
    #[validate(length(min = 1, max = 255, message = "Birth place is required"))]
    pub birth_place: String,
    pub birth_date: NaiveDate,
    pub gender_id: Uuid,
    pub religion_id: Uuid,
    pub student_national_number: Option<String>,
    pub school_name: Option<String>,
    #[validate(length(min = 8, max = 20, message = "Phone number is invalid"))]
    pub phone_number: String,
    #[validate(email(message = "Email is invalid"))]
    pub email: String,
    #[validate(length(min = 6, message = "Password must be at least 6 characters"))]
    pub password: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionRegisterResponse {
    pub session_id: String,
    pub token: String,
    pub user: UserResponse,
    pub expires_in: u64,
    pub candidate_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AdmissionUnitQuery {
    pub institution_code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionUnitOption {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionUnitOptionsResponse {
    pub units: Vec<AdmissionUnitOption>,
    pub registration_categories: Vec<AdmissionUnitOption>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct AdmissionUnitRequest {
    pub unit_id: Uuid,
    pub registration_category_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct AdmissionFamilyCardRequest {
    #[validate(length(equal = 16, message = "Family card number must be 16 digits"))]
    pub code: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct AdmissionFamilyMemberRequest {
    pub relative_type_id: Uuid,
    #[validate(length(min = 1, max = 255, message = "Name is required"))]
    pub name: String,
    #[validate(length(equal = 16, message = "NIK must be 16 digits"))]
    pub nik: String,
    #[validate(length(min = 1, max = 255, message = "Birth place is required"))]
    pub birth_place: String,
    pub birth_date: NaiveDate,
    pub gender_id: Option<Uuid>,
    pub religion_id: Option<Uuid>,
    #[serde(default)]
    pub is_deceased: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionCandidateSummary {
    pub id: Uuid,
    pub name: String,
    pub code: Option<String>,
    pub nik: Option<String>,
    pub email: Option<String>,
    pub student_national_number: Option<String>,
    pub school_name: Option<String>,
    pub institution_id: Uuid,
    pub individual_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionUnitStatus {
    pub id: Uuid,
    pub unit_id: Uuid,
    pub unit_name: Option<String>,
    pub registration_category_id: Uuid,
    pub registration_category_name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionFamilyCardStatus {
    pub id: Uuid,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionFamilyMemberStatus {
    pub id: Uuid,
    pub relative_id: Uuid,
    pub relative_type_id: Uuid,
    pub relative_type_name: Option<String>,
    pub name: Option<String>,
    pub nik: Option<String>,
    pub birth_place: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub is_deceased: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionArchiveStatus {
    pub archive_type_id: Uuid,
    pub archive_type_name: String,
    pub archive_id: Option<Uuid>,
    pub file_name: Option<String>,
    pub mimetype: Option<String>,
    pub size: Option<i32>,
    pub uploaded_at: Option<NaiveDateTime>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionRequirementStatus {
    pub unit_choice: bool,
    pub family_card: bool,
    pub mother: bool,
    pub father: bool,
    pub guardian_required: bool,
    pub guardian: bool,
    pub parents: bool,
    pub archives: bool,
    pub is_complete: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AdmissionStatusResponse {
    pub candidate: AdmissionCandidateSummary,
    pub unit: Option<AdmissionUnitStatus>,
    pub family_card: Option<AdmissionFamilyCardStatus>,
    pub family_members: Vec<AdmissionFamilyMemberStatus>,
    pub archives: Vec<AdmissionArchiveStatus>,
    pub requirements: AdmissionRequirementStatus,
}
