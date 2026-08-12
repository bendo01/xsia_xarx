use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CountryQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CountryResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub alpha2_code: String,
    pub alpha3_code: String,
    pub iso3166_2_code: String,
    pub dikti_code: Option<String>,
    pub continent_id: Option<Uuid>,
    pub region_id: Option<Uuid>,
    pub slug: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCountryRequest {
    pub code: String,
    pub name: String,
    pub alpha2_code: String,
    pub alpha3_code: String,
    pub iso3166_2_code: String,
    pub dikti_code: Option<String>,
    pub continent_id: Option<Uuid>,
    pub region_id: Option<Uuid>,
    pub slug: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCountryRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub alpha2_code: Option<String>,
    pub alpha3_code: Option<String>,
    pub iso3166_2_code: Option<String>,
    pub dikti_code: Option<String>,
    pub continent_id: Option<Uuid>,
    pub region_id: Option<Uuid>,
    pub slug: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCountryResponse {
    pub data: Vec<CountryResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
