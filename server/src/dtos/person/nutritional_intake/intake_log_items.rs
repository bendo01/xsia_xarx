use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use sea_orm::entity::prelude::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::intake_log_item;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct IntakeLogItemQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub intake_log_id: Option<Uuid>,
    pub food_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IntakeLogItemResponse {
    pub id: Uuid,
    pub intake_log_id: Uuid,
    pub food_id: Option<Uuid>,
    pub raw_name: String,
    pub quantity_text: Option<String>,
    pub grams: Option<Decimal>,
    pub edible_portion: Option<Decimal>,
    pub nutrients: Option<serde_json::Value>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<intake_log_item::Model> for IntakeLogItemResponse {
    fn from(m: intake_log_item::Model) -> Self {
        Self {
            id: m.id,
            intake_log_id: m.intake_log_id,
            food_id: m.food_id,
            raw_name: m.raw_name,
            quantity_text: m.quantity_text,
            grams: m.grams,
            edible_portion: m.edible_portion,
            nutrients: m.nutrients,
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
pub struct CreateIntakeLogItemRequest {
    pub intake_log_id: Uuid,
    pub food_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub raw_name: String,
    #[validate(length(max = 255))]
    pub quantity_text: Option<String>,
    pub grams: Option<Decimal>,
    pub edible_portion: Option<Decimal>,
    pub nutrients: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateIntakeLogItemRequest {
    pub intake_log_id: Option<Uuid>,
    pub food_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub raw_name: Option<String>,
    #[validate(length(max = 255))]
    pub quantity_text: Option<String>,
    pub grams: Option<Decimal>,
    pub edible_portion: Option<Decimal>,
    pub nutrients: Option<serde_json::Value>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedIntakeLogItemResponse {
    pub data: Vec<IntakeLogItemResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
