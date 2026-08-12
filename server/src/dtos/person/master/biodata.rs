use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BiodataQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct BiodataResponse {
    pub id: Uuid,
    pub height: f64,
    pub weight: f64,
    pub is_positive_blood_rhesus: bool,
    pub blood_type_id: Uuid,
    pub hair_type_id: Uuid,
    pub hair_color_id: Uuid,
    pub eye_color_id: Uuid,
    pub individual_id: Uuid,
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
    pub height: f64,
    pub weight: f64,
    pub is_positive_blood_rhesus: bool,
    pub blood_type_id: Uuid,
    pub hair_type_id: Uuid,
    pub hair_color_id: Uuid,
    pub eye_color_id: Uuid,
    pub individual_id: Uuid,
    pub bust: f64,
    pub waist: f64,
    pub hip: f64,
    pub arm_circumference: f64,
    pub menarche_age: i32,
    pub menopause_age: i32,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateBiodataRequest {
    pub height: Option<f64>,
    pub weight: Option<f64>,
    pub is_positive_blood_rhesus: Option<bool>,
    pub blood_type_id: Option<Uuid>,
    pub hair_type_id: Option<Uuid>,
    pub hair_color_id: Option<Uuid>,
    pub eye_color_id: Option<Uuid>,
    pub individual_id: Option<Uuid>,
    pub bust: Option<f64>,
    pub waist: Option<f64>,
    pub hip: Option<f64>,
    pub arm_circumference: Option<f64>,
    pub menarche_age: Option<i32>,
    pub menopause_age: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedBiodataResponse {
    pub data: Vec<BiodataResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
