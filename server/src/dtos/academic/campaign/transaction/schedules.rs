use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct SchedulQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct SchedulResponse {
    pub id: Uuid,
    pub name: Option<String>,
    #[salvo(schema(value_type = String))]
    pub start_hour: NaiveTime,
    #[salvo(schema(value_type = String))]
    pub end_hour: NaiveTime,
    pub weekday_id: Uuid,
    pub room_id: Uuid,
    pub teach_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateSchedulRequest {
    pub name: Option<String>,
    #[salvo(schema(value_type = String))]
    pub start_hour: NaiveTime,
    #[salvo(schema(value_type = String))]
    pub end_hour: NaiveTime,
    pub weekday_id: Uuid,
    pub room_id: Uuid,
    pub teach_id: Uuid,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateSchedulRequest {
    pub name: Option<String>,
    #[salvo(schema(value_type = Option<String>))]
    pub start_hour: Option<NaiveTime>,
    #[salvo(schema(value_type = Option<String>))]
    pub end_hour: Option<NaiveTime>,
    pub weekday_id: Option<Uuid>,
    pub room_id: Option<Uuid>,
    pub teach_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedSchedulResponse {
    pub data: Vec<SchedulResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
