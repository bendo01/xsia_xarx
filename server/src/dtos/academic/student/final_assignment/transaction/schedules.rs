use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ScheduleQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ScheduleResponse {
    pub id: Uuid,
    pub ecree_number: Option<String>,
    pub schedule_date: Option<NaiveDate>,
    #[salvo(schema(value_type = Option<String>))]
    pub schedule_time: Option<NaiveTime>,
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub stage_id: Uuid,
    pub room_id: Option<Uuid>,
    pub zoom_meeting: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateScheduleRequest {
    pub ecree_number: Option<String>,
    pub schedule_date: Option<NaiveDate>,
    #[salvo(schema(value_type = Option<String>))]
    pub schedule_time: Option<NaiveTime>,
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Uuid,
    pub stage_id: Uuid,
    pub room_id: Option<Uuid>,
    pub zoom_meeting: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateScheduleRequest {
    pub ecree_number: Option<String>,
    pub schedule_date: Option<NaiveDate>,
    #[salvo(schema(value_type = Option<String>))]
    pub schedule_time: Option<NaiveTime>,
    pub submission_id: Option<Uuid>,
    pub detail_activity_id: Option<Uuid>,
    pub stage_id: Option<Uuid>,
    pub room_id: Option<Uuid>,
    pub zoom_meeting: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedScheduleResponse {
    pub data: Vec<ScheduleResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
