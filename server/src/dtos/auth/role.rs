use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RoleQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub user_id: Option<Uuid>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RoleResponse {
    pub id: Uuid,
    pub name: String,
    pub user_id: Option<Uuid>,
    pub position_type_id: Option<Uuid>,
    pub roleable_id: Option<Uuid>,
    pub roleable_type: Option<String>,
    pub created_at: NaiveDateTime,
    pub updated_at: NaiveDateTime,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRoleRequest {
    #[validate(length(min = 1, message = "Name must not be empty"))]
    pub name: String,
    pub user_id: Option<Uuid>,
    pub position_type_id: Option<Uuid>,
    pub roleable_id: Option<Uuid>,
    pub roleable_type: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRoleRequest {
    pub name: Option<String>,
    pub user_id: Option<Uuid>,
    pub position_type_id: Option<Uuid>,
    pub roleable_id: Option<Uuid>,
    pub roleable_type: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRoleResponse {
    pub data: Vec<RoleResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
