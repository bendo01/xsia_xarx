use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use sea_orm::entity::prelude::Decimal;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::correction;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CorrectionQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub food_id: Option<Uuid>,
    pub nutrient_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CorrectionResponse {
    pub id: Uuid,
    pub food_id: Uuid,
    pub nutrient_id: Uuid,
    pub original_value: Option<Decimal>,
    pub corrected_value: Option<Decimal>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<correction::Model> for CorrectionResponse {
    fn from(m: correction::Model) -> Self {
        Self {
            id: m.id,
            food_id: m.food_id,
            nutrient_id: m.nutrient_id,
            original_value: m.original_value,
            corrected_value: m.corrected_value,
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
pub struct CreateCorrectionRequest {
    pub food_id: Uuid,
    pub nutrient_id: Uuid,
    pub original_value: Option<Decimal>,
    pub corrected_value: Option<Decimal>,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateCorrectionRequest {
    pub food_id: Option<Uuid>,
    pub nutrient_id: Option<Uuid>,
    pub original_value: Option<Decimal>,
    pub corrected_value: Option<Decimal>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCorrectionResponse {
    pub data: Vec<CorrectionResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
