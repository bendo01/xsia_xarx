use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ActivityQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ActivityResponse {
    pub id: Uuid,
    pub name: String,
    pub week_quantity: Option<i32>,
    pub student_target: i32,
    pub candidate_number: i32,
    pub candidate_pass: i32,
    pub became_student: i32,
    pub transfer_student: i32,
    pub total_class_member: Option<i32>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub start_transaction: Option<NaiveDate>,
    pub end_transaction: Option<NaiveDate>,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub is_active: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateActivityRequest {
    pub name: String,
    pub week_quantity: Option<i32>,
    pub student_target: i32,
    pub candidate_number: i32,
    pub candidate_pass: i32,
    pub became_student: i32,
    pub transfer_student: i32,
    pub total_class_member: Option<i32>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub start_transaction: Option<NaiveDate>,
    pub end_transaction: Option<NaiveDate>,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub is_active: Option<bool>,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateActivityRequest {
    pub name: Option<String>,
    pub week_quantity: Option<i32>,
    pub student_target: Option<i32>,
    pub candidate_number: Option<i32>,
    pub candidate_pass: Option<i32>,
    pub became_student: Option<i32>,
    pub transfer_student: Option<i32>,
    pub total_class_member: Option<i32>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub start_transaction: Option<NaiveDate>,
    pub end_transaction: Option<NaiveDate>,
    pub unit_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub is_active: Option<bool>,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedActivityResponse {
    pub data: Vec<ActivityResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
