use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct TeachQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct TeachResponse {
    pub id: Uuid,
    pub name: Option<String>,
    pub class_code_id: Uuid,
    pub course_id: Uuid,
    pub activity_id: Option<Uuid>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub practice_start_date: Option<NaiveDate>,
    pub practice_end_date: Option<NaiveDate>,
    pub curriculum_detail_id: Option<Uuid>,
    pub teach_decree_id: Uuid,
    pub is_lecturer_credit_sum_problem: Option<bool>,
    pub is_lock: Option<bool>,
    pub encounter_category_id: Option<Uuid>,
    pub scope_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub max_member: Option<i32>,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateTeachRequest {
    pub name: Option<String>,
    pub class_code_id: Uuid,
    pub course_id: Uuid,
    pub activity_id: Option<Uuid>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub practice_start_date: Option<NaiveDate>,
    pub practice_end_date: Option<NaiveDate>,
    pub curriculum_detail_id: Option<Uuid>,
    pub teach_decree_id: Uuid,
    pub is_lecturer_credit_sum_problem: Option<bool>,
    pub is_lock: Option<bool>,
    pub encounter_category_id: Option<Uuid>,
    pub scope_id: Option<Uuid>,
    pub max_member: Option<i32>,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateTeachRequest {
    pub name: Option<String>,
    pub class_code_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
    pub activity_id: Option<Uuid>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub practice_start_date: Option<NaiveDate>,
    pub practice_end_date: Option<NaiveDate>,
    pub curriculum_detail_id: Option<Uuid>,
    pub teach_decree_id: Option<Uuid>,
    pub is_lecturer_credit_sum_problem: Option<bool>,
    pub is_lock: Option<bool>,
    pub encounter_category_id: Option<Uuid>,
    pub scope_id: Option<Uuid>,
    pub max_member: Option<i32>,
    pub feeder_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedTeachResponse {
    pub data: Vec<TeachResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
