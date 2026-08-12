use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CalendarDetailQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CalendarDetailResponse {
    pub id: Uuid,
    pub name: String,
    pub calendar_category_id: Uuid,
    pub calendar_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCalendarDetailRequest {
    pub name: String,
    pub calendar_category_id: Uuid,
    pub calendar_id: Uuid,
    pub start_date: NaiveDate,
    pub end_date: NaiveDate,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCalendarDetailRequest {
    pub name: Option<String>,
    pub calendar_category_id: Option<Uuid>,
    pub calendar_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCalendarDetailResponse {
    pub data: Vec<CalendarDetailResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
