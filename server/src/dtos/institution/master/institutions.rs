use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct InstitutionQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
    pub order_by: Option<String>,
    pub order_dir: Option<String>,
    pub column: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct InstitutionResponse {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
    pub alphabet_code: Option<String>,
    pub is_active: bool,
    pub variety_id: Uuid,
    pub category_id: Uuid,
    pub country_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateInstitutionRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub alphabet_code: Option<String>,
    pub is_active: bool,
    pub variety_id: Uuid,
    pub category_id: Uuid,
    pub country_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateInstitutionRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub alphabet_code: Option<String>,
    pub is_active: Option<bool>,
    pub variety_id: Option<Uuid>,
    pub category_id: Option<Uuid>,
    pub country_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedInstitutionResponse {
    pub data: Vec<InstitutionResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
