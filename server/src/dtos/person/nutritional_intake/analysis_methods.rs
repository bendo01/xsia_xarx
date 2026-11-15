use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::analysis_method;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AnalysisMethodQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub nutrient_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct AnalysisMethodResponse {
    pub id: Uuid,
    pub nutrient_id: Uuid,
    pub name: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<analysis_method::Model> for AnalysisMethodResponse {
    fn from(m: analysis_method::Model) -> Self {
        Self {
            id: m.id,
            nutrient_id: m.nutrient_id,
            name: m.name,
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
pub struct CreateAnalysisMethodRequest {
    pub nutrient_id: Uuid,
    #[validate(length(min = 1, max = 255))]
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateAnalysisMethodRequest {
    pub nutrient_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedAnalysisMethodResponse {
    pub data: Vec<AnalysisMethodResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
