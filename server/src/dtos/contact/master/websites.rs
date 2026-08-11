use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct WebsitQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct WebsitResponse {
    pub id: Uuid,
    pub website_url: String,
    pub website_type_id: Option<Uuid>,
    pub websiteable_id: Uuid,
    pub websiteable_type: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateWebsitRequest {
    pub website_url: String,
    pub website_type_id: Option<Uuid>,
    pub websiteable_id: Uuid,
    pub websiteable_type: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateWebsitRequest {
    pub website_url: Option<String>,
    pub website_type_id: Option<Uuid>,
    pub websiteable_id: Option<Uuid>,
    pub websiteable_type: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedWebsitResponse {
    pub data: Vec<WebsitResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
