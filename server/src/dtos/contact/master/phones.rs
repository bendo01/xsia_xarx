use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PhonQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PhonResponse {
    pub id: Uuid,
    pub phone_number: String,
    pub phone_type_id: Option<Uuid>,
    pub phoneable_id: Uuid,
    pub phoneable_type: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreatePhonRequest {
    pub phone_number: String,
    pub phone_type_id: Option<Uuid>,
    pub phoneable_id: Uuid,
    pub phoneable_type: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdatePhonRequest {
    pub phone_number: Option<String>,
    pub phone_type_id: Option<Uuid>,
    pub phoneable_id: Option<Uuid>,
    pub phoneable_type: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedPhonResponse {
    pub data: Vec<PhonResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
