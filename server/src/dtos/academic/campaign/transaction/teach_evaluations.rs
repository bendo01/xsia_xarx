use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct TeachEvaluationQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct TeachEvaluationResponse {
    pub id: Uuid,
    pub thread: Option<i32>,
    pub name: Option<String>,
    pub english_name: Option<String>,
    pub evaluation_weight: Option<f32>,
    pub evaluation_type_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub teach_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateTeachEvaluationRequest {
    pub thread: Option<i32>,
    pub name: Option<String>,
    pub english_name: Option<String>,
    pub evaluation_weight: Option<f32>,
    pub evaluation_type_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub teach_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateTeachEvaluationRequest {
    pub thread: Option<i32>,
    pub name: Option<String>,
    pub english_name: Option<String>,
    pub evaluation_weight: Option<f32>,
    pub evaluation_type_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub teach_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedTeachEvaluationResponse {
    pub data: Vec<TeachEvaluationResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
