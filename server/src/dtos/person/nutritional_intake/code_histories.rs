use chrono::NaiveDateTime;
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

use crate::models::person::nutritional_intake::code_history;

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CodeHistoryQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub old_code: Option<String>,
    pub food_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CodeHistoryResponse {
    pub id: Uuid,
    pub food_id: Uuid,
    pub old_code: String,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl From<code_history::Model> for CodeHistoryResponse {
    fn from(m: code_history::Model) -> Self {
        Self {
            id: m.id,
            food_id: m.food_id,
            old_code: m.old_code,
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
pub struct CreateCodeHistoryRequest {
    pub food_id: Uuid,
    #[validate(length(min = 1, max = 255))]
    pub old_code: String,
}

#[derive(Serialize, Deserialize, ToSchema, Validate, Debug, Clone, Default)]
pub struct UpdateCodeHistoryRequest {
    pub food_id: Option<Uuid>,
    #[validate(length(min = 1, max = 255))]
    pub old_code: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCodeHistoryResponse {
    pub data: Vec<CodeHistoryResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
