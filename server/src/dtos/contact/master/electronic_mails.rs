use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ElectronicMailQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ElectronicMailResponse {
    pub id: Uuid,
    pub email_address: String,
    pub electronic_mail_type_id: Option<Uuid>,
    pub electronic_mailable_id: Uuid,
    pub electronic_mailable_type: String,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateElectronicMailRequest {
    pub email_address: String,
    pub electronic_mail_type_id: Option<Uuid>,
    pub electronic_mailable_id: Uuid,
    pub electronic_mailable_type: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateElectronicMailRequest {
    pub email_address: Option<String>,
    pub electronic_mail_type_id: Option<Uuid>,
    pub electronic_mailable_id: Option<Uuid>,
    pub electronic_mailable_type: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedElectronicMailResponse {
    pub data: Vec<ElectronicMailResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
