use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ResidenceQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ResidenceResponse {
    pub id: Uuid,
    pub street: String,
    pub citizens_association: i32,
    pub neighborhood_association: i32,
    pub province_id: Option<Uuid>,
    pub regency_id: Option<Uuid>,
    pub sub_district_id: Option<Uuid>,
    pub village_id: Option<Uuid>,
    pub residence_type_id: Option<Uuid>,
    pub residenceable_type: Option<String>,
    pub residenceable_id: Option<Uuid>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateResidenceRequest {
    pub street: String,
    pub citizens_association: i32,
    pub neighborhood_association: i32,
    pub province_id: Option<Uuid>,
    pub regency_id: Option<Uuid>,
    pub sub_district_id: Option<Uuid>,
    pub village_id: Option<Uuid>,
    pub residence_type_id: Option<Uuid>,
    pub residenceable_type: Option<String>,
    pub residenceable_id: Option<Uuid>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateResidenceRequest {
    pub street: Option<String>,
    pub citizens_association: Option<i32>,
    pub neighborhood_association: Option<i32>,
    pub province_id: Option<Uuid>,
    pub regency_id: Option<Uuid>,
    pub sub_district_id: Option<Uuid>,
    pub village_id: Option<Uuid>,
    pub residence_type_id: Option<Uuid>,
    pub residenceable_type: Option<String>,
    pub residenceable_id: Option<Uuid>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedResidenceResponse {
    pub data: Vec<ResidenceResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
