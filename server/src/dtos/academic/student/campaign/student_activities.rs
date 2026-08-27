use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct StudentActivityQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub student_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct StudentActivityResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub cumulative_index: f64,
    pub grand_cumulative_index: f64,
    pub total_credit: Option<f64>,
    pub grand_total_credit: Option<f64>,
    pub student_id: Uuid,
    pub unit_activity_id: Uuid,
    pub status_id: Uuid,
    pub resign_status_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub is_lock: Option<bool>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub finance_id: Option<Uuid>,
    pub finance_fee: Option<f64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateStudentActivityRequest {
    pub name: Option<String>,
    pub cumulative_index: f64,
    pub grand_cumulative_index: f64,
    pub total_credit: Option<f64>,
    pub grand_total_credit: Option<f64>,
    pub student_id: Uuid,
    pub unit_activity_id: Uuid,
    pub status_id: Uuid,
    pub resign_status_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub is_lock: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub finance_id: Option<Uuid>,
    pub finance_fee: Option<f64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateStudentActivityRequest {
    pub name: Option<String>,
    pub cumulative_index: Option<f64>,
    pub grand_cumulative_index: Option<f64>,
    pub total_credit: Option<f64>,
    pub grand_total_credit: Option<f64>,
    pub student_id: Option<Uuid>,
    pub unit_activity_id: Option<Uuid>,
    pub status_id: Option<Uuid>,
    pub resign_status_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub is_lock: Option<bool>,
    pub feeder_id: Option<Uuid>,
    pub finance_id: Option<Uuid>,
    pub finance_fee: Option<f64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedStudentActivityResponse {
    pub data: Vec<StudentActivityResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
