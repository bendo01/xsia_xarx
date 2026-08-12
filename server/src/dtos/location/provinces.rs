use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ProvinceQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ProvinceResponse {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
    pub dikti_code: Option<String>,
    pub epsbed_code: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub alt_slug: Option<String>,
    pub state_ministry_code: Option<String>,
    pub state_ministry_full_code: Option<String>,
    pub state_post_department_code: Option<String>,
    pub state_ministry_name: Option<String>,
    pub dikti_name: Option<String>,
    pub validation_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
    pub country_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateProvinceRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub dikti_code: Option<String>,
    pub epsbed_code: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub alt_slug: Option<String>,
    pub state_ministry_code: Option<String>,
    pub state_ministry_full_code: Option<String>,
    pub state_post_department_code: Option<String>,
    pub state_ministry_name: Option<String>,
    pub dikti_name: Option<String>,
    pub validation_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
    pub country_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateProvinceRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub dikti_code: Option<String>,
    pub epsbed_code: Option<String>,
    pub slug: Option<String>,
    pub description: Option<String>,
    pub alt_slug: Option<String>,
    pub state_ministry_code: Option<String>,
    pub state_ministry_full_code: Option<String>,
    pub state_post_department_code: Option<String>,
    pub state_ministry_name: Option<String>,
    pub dikti_name: Option<String>,
    pub validation_code: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
    pub zoom: Option<i32>,
    pub country_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedProvinceResponse {
    pub data: Vec<ProvinceResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
