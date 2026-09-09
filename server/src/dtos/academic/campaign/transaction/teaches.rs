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
    pub activity_id: Option<Uuid>,
    pub teach_decree_id: Option<Uuid>,
    pub course_id: Option<Uuid>,
    pub lecturer_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct LecturerAssignedTeachResponse {
    pub teach_lecturer_id: Uuid,
    pub teach_id: Uuid,
    pub lecturer_id: Uuid,
    pub planning: i32,
    pub realization: i32,
    pub credit: f64,
    pub is_lecturer_home_base: bool,
    pub role_name: Option<String>,

    pub teach_name: Option<String>,
    pub description: Option<String>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub max_member: Option<i32>,
    pub activity_id: Option<Uuid>,
    pub activity_name: Option<String>,
    pub academic_year_id: Option<Uuid>,
    pub academic_year_name: Option<String>,
    pub academic_year_code: Option<i32>,

    pub course_id: Uuid,
    pub course_code: Option<String>,
    pub course_name: Option<String>,
    pub course_total_credit: Option<f64>,
    pub course_lecture_credit: Option<f64>,
    pub course_practice_credit: Option<f64>,

    pub class_code_id: Uuid,
    pub class_name: Option<String>,
    pub class_alphabet_code: Option<String>,
    pub class_capacity: Option<i32>,
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
    pub enrolled_count: Option<i64>,
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
