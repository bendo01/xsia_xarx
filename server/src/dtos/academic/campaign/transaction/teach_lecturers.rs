use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;
use sea_orm::entity::prelude::Decimal;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct TeachLecturerQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub lecturer_id: Option<Uuid>,
    pub teach_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct TeachLecturerResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub code: Option<String>,
    pub planning: i32,
    pub realization: i32,
    #[salvo(schema(value_type = Option<String>))]
    pub credit: Option<Decimal>,
    pub is_lecturer_home_base: bool,
    pub lecturer_id: Uuid,
    pub teach_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub feeder_id: Option<Uuid>,

    #[serde(skip_serializing_if = "Option::is_none")]
    pub teach: Option<crate::dtos::academic::campaign::transaction::teaches::TeachResponse>,
}

impl Default for TeachLecturerResponse {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            name: None,
            code: None,
            planning: 0,
            realization: 0,
            credit: None,
            is_lecturer_home_base: false,
            lecturer_id: Uuid::nil(),
            teach_id: Uuid::nil(),
            created_at: None,
            updated_at: None,
            deleted_at: None,
            sync_at: None,
            created_by: None,
            updated_by: None,
            feeder_id: None,
            teach: None,
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateTeachLecturerRequest {
    pub name: Option<String>,
    pub planning: i32,
    pub realization: i32,
    #[salvo(schema(value_type = Option<String>))]
    pub credit: Option<Decimal>,
    pub is_lecturer_home_base: bool,
    pub lecturer_id: Uuid,
    pub teach_id: Uuid,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateTeachLecturerRequest {
    pub name: Option<String>,
    pub planning: Option<i32>,
    pub realization: Option<i32>,
    #[salvo(schema(value_type = Option<String>))]
    pub credit: Option<Decimal>,
    pub is_lecturer_home_base: Option<bool>,
    pub lecturer_id: Option<Uuid>,
    pub teach_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedTeachLecturerResponse {
    pub data: Vec<TeachLecturerResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
