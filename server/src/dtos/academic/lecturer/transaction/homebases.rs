use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct HomebaseQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub lecturer_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct HomebaseResponse {
    pub id: Uuid,
    pub lecturer_id: Uuid,
    pub unit_id: Uuid,
    pub institution_id: Uuid,
    pub status_id: Uuid,
    pub contract_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contract_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit: Option<crate::dtos::institution::master::units::UnitResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<crate::dtos::common::reference::ReferenceResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contract: Option<crate::dtos::common::reference::ReferenceResponse>,
}

impl Default for HomebaseResponse {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            lecturer_id: Uuid::nil(),
            unit_id: Uuid::nil(),
            institution_id: Uuid::nil(),
            status_id: Uuid::nil(),
            contract_id: Uuid::nil(),
            created_at: None,
            updated_at: None,
            deleted_at: None,
            sync_at: None,
            created_by: None,
            updated_by: None,
            unit_name: None,
            status_name: None,
            contract_name: None,
            unit: None,
            status: None,
            contract: None,
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateHomebaseRequest {
    pub lecturer_id: Uuid,
    pub unit_id: Uuid,
    pub institution_id: Uuid,
    pub status_id: Uuid,
    pub contract_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateHomebaseRequest {
    pub lecturer_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedHomebaseResponse {
    pub data: Vec<HomebaseResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
