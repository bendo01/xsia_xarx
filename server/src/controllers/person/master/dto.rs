use chrono::{NaiveDate, NaiveDateTime};
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

// ===================================================================
// Individual DTOs
// ===================================================================

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    /// Format: YYYY-MM-DD
    #[salvo(schema(value_type = String))]
    pub birth_date: NaiveDate,
    pub birth_place: String,
    pub gender_id: Uuid,
    pub religion_id: Uuid,
    pub occupation_id: Uuid,
    pub education_id: Uuid,
    pub income_id: Uuid,
    pub identification_type_id: Uuid,
    pub marital_status_id: Uuid,
    pub profession_id: Uuid,
    pub age_classification_id: Uuid,
    pub is_special_need: bool,
    pub is_social_protection_card_recipient: bool,
    pub is_deceased: bool,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateIndividualRequest {
    #[validate(length(min = 1, max = 50, message = "code must be 1–50 characters"))]
    pub code: String,
    #[validate(length(min = 1, max = 255, message = "name must be 1–255 characters"))]
    pub name: String,
    #[validate(length(max = 50, message = "front_title max 50 characters"))]
    pub front_title: Option<String>,
    #[validate(length(max = 50, message = "last_title max 50 characters"))]
    pub last_title: Option<String>,
    /// Format: YYYY-MM-DD
    #[salvo(schema(value_type = String))]
    pub birth_date: NaiveDate,
    #[validate(length(min = 1, max = 255, message = "birth_place must be 1–255 characters"))]
    pub birth_place: String,
    pub gender_id: Uuid,
    pub religion_id: Uuid,
    pub occupation_id: Uuid,
    pub education_id: Uuid,
    pub income_id: Uuid,
    pub identification_type_id: Uuid,
    pub marital_status_id: Uuid,
    pub profession_id: Uuid,
    pub age_classification_id: Uuid,
    #[serde(default)]
    pub is_special_need: bool,
    #[serde(default)]
    pub is_social_protection_card_recipient: bool,
    #[serde(default)]
    pub is_deceased: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateIndividualRequest {
    #[validate(length(min = 1, max = 50, message = "code must be 1–50 characters"))]
    pub code: Option<String>,
    #[validate(length(min = 1, max = 255, message = "name must be 1–255 characters"))]
    pub name: Option<String>,
    #[validate(length(max = 50))]
    pub front_title: Option<String>,
    #[validate(length(max = 50))]
    pub last_title: Option<String>,
    /// Format: YYYY-MM-DD
    #[salvo(schema(value_type = String))]
    pub birth_date: Option<NaiveDate>,
    #[validate(length(min = 1, max = 255))]
    pub birth_place: Option<String>,
    pub gender_id: Option<Uuid>,
    pub religion_id: Option<Uuid>,
    pub occupation_id: Option<Uuid>,
    pub education_id: Option<Uuid>,
    pub income_id: Option<Uuid>,
    pub identification_type_id: Option<Uuid>,
    pub marital_status_id: Option<Uuid>,
    pub profession_id: Option<Uuid>,
    pub age_classification_id: Option<Uuid>,
    pub is_special_need: Option<bool>,
    pub is_social_protection_card_recipient: Option<bool>,
    pub is_deceased: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct IndividualQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    /// Search by name (partial match)
    pub name: Option<String>,
    /// Search by code (partial match)
    pub code: Option<String>,
    pub is_deceased: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedIndividualResponse {
    pub data: Vec<IndividualResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

// ===================================================================
// Biodata DTOs
// ===================================================================

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct BiodataResponse {
    pub id: Uuid,
    pub individual_id: Uuid,
    pub height: f64,
    pub weight: f64,
    pub is_positive_blood_rhesus: bool,
    pub blood_type_id: Uuid,
    pub hair_type_id: Uuid,
    pub hair_color_id: Uuid,
    pub eye_color_id: Uuid,
    pub bust: f64,
    pub waist: f64,
    pub hip: f64,
    pub arm_circumference: f64,
    pub menarche_age: i32,
    pub menopause_age: i32,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateBiodataRequest {
    pub individual_id: Uuid,
    #[validate(range(min = 0.0, max = 300.0, message = "height must be 0–300 cm"))]
    pub height: f64,
    #[validate(range(min = 0.0, max = 500.0, message = "weight must be 0–500 kg"))]
    pub weight: f64,
    #[serde(default)]
    pub is_positive_blood_rhesus: bool,
    pub blood_type_id: Uuid,
    pub hair_type_id: Uuid,
    pub hair_color_id: Uuid,
    pub eye_color_id: Uuid,
    #[validate(range(min = 0.0, max = 300.0, message = "bust must be 0–300 cm"))]
    #[serde(default)]
    pub bust: f64,
    #[validate(range(min = 0.0, max = 300.0, message = "waist must be 0–300 cm"))]
    #[serde(default)]
    pub waist: f64,
    #[validate(range(min = 0.0, max = 300.0, message = "hip must be 0–300 cm"))]
    #[serde(default)]
    pub hip: f64,
    #[validate(range(min = 0.0, max = 200.0, message = "arm_circumference must be 0–200 cm"))]
    #[serde(default)]
    pub arm_circumference: f64,
    #[validate(range(min = 0, max = 100, message = "menarche_age must be 0–100"))]
    #[serde(default)]
    pub menarche_age: i32,
    #[validate(range(min = 0, max = 100, message = "menopause_age must be 0–100"))]
    #[serde(default)]
    pub menopause_age: i32,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateBiodataRequest {
    #[validate(range(min = 0.0, max = 300.0, message = "height must be 0–300 cm"))]
    pub height: Option<f64>,
    #[validate(range(min = 0.0, max = 500.0, message = "weight must be 0–500 kg"))]
    pub weight: Option<f64>,
    pub is_positive_blood_rhesus: Option<bool>,
    pub blood_type_id: Option<Uuid>,
    pub hair_type_id: Option<Uuid>,
    pub hair_color_id: Option<Uuid>,
    pub eye_color_id: Option<Uuid>,
    #[validate(range(min = 0.0, max = 300.0))]
    pub bust: Option<f64>,
    #[validate(range(min = 0.0, max = 300.0))]
    pub waist: Option<f64>,
    #[validate(range(min = 0.0, max = 300.0))]
    pub hip: Option<f64>,
    #[validate(range(min = 0.0, max = 200.0))]
    pub arm_circumference: Option<f64>,
    #[validate(range(min = 0, max = 100))]
    pub menarche_age: Option<i32>,
    #[validate(range(min = 0, max = 100))]
    pub menopause_age: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BiodataQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    /// Filter by individual UUID
    pub individual_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedBiodataResponse {
    pub data: Vec<BiodataResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

// ===================================================================
// Shared
// ===================================================================

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct MessageResponse {
    pub message: String,
}
