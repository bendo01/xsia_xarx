use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RoomQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RoomResponse {
    pub id: Uuid,
    pub alphabet_code: Option<String>,
    pub name: String,
    pub long: Option<f32>,
    pub wide: Option<f32>,
    pub high: Option<f32>,
    pub room_type_id: Uuid,
    pub unit_id: Option<Uuid>,
    pub building_id: Uuid,
    pub condition_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateRoomRequest {
    pub alphabet_code: Option<String>,
    pub name: String,
    pub long: Option<f32>,
    pub wide: Option<f32>,
    pub high: Option<f32>,
    pub room_type_id: Uuid,
    pub unit_id: Option<Uuid>,
    pub building_id: Uuid,
    pub condition_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateRoomRequest {
    pub alphabet_code: Option<String>,
    pub name: Option<String>,
    pub long: Option<f32>,
    pub wide: Option<f32>,
    pub high: Option<f32>,
    pub room_type_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub building_id: Option<Uuid>,
    pub condition_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedRoomResponse {
    pub data: Vec<RoomResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
