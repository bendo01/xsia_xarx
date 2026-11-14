use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use sea_orm::entity::prelude::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::intake_log;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct IntakeLogQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub individual_id: Option<Uuid>,
    pub status: Option<String>,
    pub meal_type: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IntakeLogResponse {
    pub id: Uuid,
    pub individual_id: Uuid,
    pub eaten_at: NaiveDateTime,
    pub meal_type: Option<String>,
    pub description: String,
    pub status: String,
    pub llm_model: Option<String>,
    pub llm_raw_response: Option<serde_json::Value>,
    pub totals: Option<serde_json::Value>,
    pub error_message: Option<String>,
    pub calculated_at: Option<NaiveDateTime>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<intake_log::Model> for IntakeLogResponse {
    fn from(m: intake_log::Model) -> Self {
        Self {
            id: m.id,
            individual_id: m.individual_id,
            eaten_at: m.eaten_at,
            meal_type: m.meal_type,
            description: m.description,
            status: m.status,
            llm_model: m.llm_model,
            llm_raw_response: m.llm_raw_response,
            totals: m.totals,
            error_message: m.error_message,
            calculated_at: m.calculated_at,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone)]
pub struct CreateIntakeLogRequest {
    pub individual_id: Uuid,
    pub eaten_at: NaiveDateTime,
    #[validate(length(max = 255))]
    pub meal_type: Option<String>,
    pub description: String,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateIntakeLogRequest {
    pub individual_id: Option<Uuid>,
    pub eaten_at: Option<NaiveDateTime>,
    #[validate(length(max = 255))]
    pub meal_type: Option<String>,
    pub description: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedIntakeLogResponse {
    pub data: Vec<IntakeLogResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
