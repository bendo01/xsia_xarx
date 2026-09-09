use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct CurriculumQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub search: Option<String>,
    pub unit_id: Option<Uuid>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
}

pub async fn list_curriculums_by_unit(
    db: &DatabaseConnection,
    unit_id: Uuid,
) -> Result<Vec<CurriculumResponse>, sea_orm::DbErr> {
    let items = crate::models::academic::course::master::curriculums::Entity::find()
        .filter(crate::models::academic::course::master::curriculums::Column::UnitId.eq(unit_id))
        .filter(crate::models::academic::course::master::curriculums::Column::DeletedAt.is_null())
        .order_by_asc(crate::models::academic::course::master::curriculums::Column::Name)
        .all(db)
        .await?;

    let data = items
        .into_iter()
        .map(|item| CurriculumResponse {
            id: item.id,
            name: item.name,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            curriculum_type_id: item.curriculum_type_id,
            total_credit: item.total_credit,
            mandatory_course_credit: item.mandatory_course_credit,
            optional_course_credit: item.optional_course_credit,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            is_active: item.is_active,
        })
        .collect();

    Ok(data)
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct CurriculumResponse {
    pub id: Uuid,
    pub name: String,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub curriculum_type_id: Uuid,
    pub total_credit: Option<f64>,
    pub mandatory_course_credit: Option<f64>,
    pub optional_course_credit: Option<f64>,
    pub feeder_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateCurriculumRequest {
    pub name: String,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub curriculum_type_id: Uuid,
    pub total_credit: Option<f64>,
    pub mandatory_course_credit: Option<f64>,
    pub optional_course_credit: Option<f64>,
    pub feeder_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateCurriculumRequest {
    pub name: Option<String>,
    pub unit_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub curriculum_type_id: Option<Uuid>,
    pub total_credit: Option<f64>,
    pub mandatory_course_credit: Option<f64>,
    pub optional_course_credit: Option<f64>,
    pub feeder_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub is_active: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedCurriculumResponse {
    pub data: Vec<CurriculumResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
