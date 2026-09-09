use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CourseQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub search: Option<String>,
    pub unit_id: Option<Uuid>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
}

pub async fn list_courses_by_unit(
    db: &DatabaseConnection,
    unit_id: Uuid,
) -> Result<Vec<CourseResponse>, sea_orm::DbErr> {
    let items = crate::models::academic::course::master::courses::Entity::find()
        .filter(crate::models::academic::course::master::courses::Column::UnitId.eq(unit_id))
        .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
        .order_by_asc(crate::models::academic::course::master::courses::Column::Name)
        .all(db)
        .await?;

    let data = items
        .into_iter()
        .map(|item| CourseResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            implementation_method: item.implementation_method,
            total_credit: item.total_credit,
            lecture_credit: item.lecture_credit,
            practice_credit: item.practice_credit,
            field_practice_credit: item.field_practice_credit,
            simulation_credit: item.simulation_credit,
            has_unit: item.has_unit,
            has_syllabus: item.has_syllabus,
            has_material: item.has_material,
            has_practice: item.has_practice,
            has_dictation: item.has_dictation,
            group_id: item.group_id,
            variety_id: item.variety_id,
            unit_id: item.unit_id,
            competence_id: item.competence_id,
            feeder_course_group_id: item.feeder_course_group_id,
            feeder_course_type_id: item.feeder_course_type_id,
            feeder_course_id: item.feeder_course_id,
            start_date: item.start_date,
            end_date: item.end_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
        })
        .collect();

    Ok(data)
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CourseResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub implementation_method: Option<String>,
    pub total_credit: f64,
    pub lecture_credit: f64,
    pub practice_credit: f64,
    pub field_practice_credit: f64,
    pub simulation_credit: f64,
    pub has_unit: bool,
    pub has_syllabus: bool,
    pub has_material: bool,
    pub has_practice: bool,
    pub has_dictation: bool,
    pub group_id: Option<Uuid>,
    pub variety_id: Uuid,
    pub unit_id: Uuid,
    pub competence_id: Option<Uuid>,
    pub feeder_course_group_id: Option<Uuid>,
    pub feeder_course_type_id: Option<Uuid>,
    pub feeder_course_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCourseRequest {
    pub code: String,
    pub name: String,
    pub implementation_method: Option<String>,
    pub total_credit: f64,
    pub lecture_credit: f64,
    pub practice_credit: f64,
    pub field_practice_credit: f64,
    pub simulation_credit: f64,
    pub has_unit: bool,
    pub has_syllabus: bool,
    pub has_material: bool,
    pub has_practice: bool,
    pub has_dictation: bool,
    pub group_id: Option<Uuid>,
    pub variety_id: Uuid,
    pub unit_id: Uuid,
    pub competence_id: Option<Uuid>,
    pub feeder_course_group_id: Option<Uuid>,
    pub feeder_course_type_id: Option<Uuid>,
    pub feeder_course_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCourseRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub implementation_method: Option<String>,
    pub total_credit: Option<f64>,
    pub lecture_credit: Option<f64>,
    pub practice_credit: Option<f64>,
    pub field_practice_credit: Option<f64>,
    pub simulation_credit: Option<f64>,
    pub has_unit: Option<bool>,
    pub has_syllabus: Option<bool>,
    pub has_material: Option<bool>,
    pub has_practice: Option<bool>,
    pub has_dictation: Option<bool>,
    pub group_id: Option<Uuid>,
    pub variety_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub competence_id: Option<Uuid>,
    pub feeder_course_group_id: Option<Uuid>,
    pub feeder_course_type_id: Option<Uuid>,
    pub feeder_course_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCourseResponse {
    pub data: Vec<CourseResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
