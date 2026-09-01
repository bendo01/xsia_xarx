use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::course::master::courses::{
    CreateCourseRequest, CourseQuery, CourseResponse, PaginatedCourseResponse,
    UpdateCourseRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::course::master::courses as entity_mod;

#[endpoint(tags("Academic - Course - Master - Course"), status_codes(200, 500))]
pub async fn list_courses(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCourseResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CourseQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    if let Some(unit_id) = query.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| CourseResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
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

    }).collect();

    Ok(Json(PaginatedCourseResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Course - Master - Course"), status_codes(200, 400, 404, 500))]
pub async fn get_course(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CourseResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Course not found"))?;

    Ok(Json(CourseResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
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

    }))
}#[endpoint(tags("Academic - Course - Master - Course"), status_codes(200, 400, 500))]
pub async fn create_course(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CourseResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateCourseRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        implementation_method: Set(payload.implementation_method),
        total_credit: Set(payload.total_credit),
        lecture_credit: Set(payload.lecture_credit),
        practice_credit: Set(payload.practice_credit),
        field_practice_credit: Set(payload.field_practice_credit),
        simulation_credit: Set(payload.simulation_credit),
        has_unit: Set(payload.has_unit),
        has_syllabus: Set(payload.has_syllabus),
        has_material: Set(payload.has_material),
        has_practice: Set(payload.has_practice),
        has_dictation: Set(payload.has_dictation),
        group_id: Set(payload.group_id),
        variety_id: Set(payload.variety_id),
        unit_id: Set(payload.unit_id),
        competence_id: Set(payload.competence_id),
        feeder_course_group_id: Set(payload.feeder_course_group_id),
        feeder_course_type_id: Set(payload.feeder_course_type_id),
        feeder_course_id: Set(payload.feeder_course_id),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CourseResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
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

        }))
}

#[endpoint(tags("Academic - Course - Master - Course"), status_codes(200, 400, 404, 500))]
pub async fn update_course(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CourseResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCourseRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Course not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(implementation_method) = payload.implementation_method {
            active_model.implementation_method = Set(Some(implementation_method));
        }
    if let Some(total_credit) = payload.total_credit {
            active_model.total_credit = Set(total_credit);
        }
    if let Some(lecture_credit) = payload.lecture_credit {
            active_model.lecture_credit = Set(lecture_credit);
        }
    if let Some(practice_credit) = payload.practice_credit {
            active_model.practice_credit = Set(practice_credit);
        }
    if let Some(field_practice_credit) = payload.field_practice_credit {
            active_model.field_practice_credit = Set(field_practice_credit);
        }
    if let Some(simulation_credit) = payload.simulation_credit {
            active_model.simulation_credit = Set(simulation_credit);
        }
    if let Some(has_unit) = payload.has_unit {
            active_model.has_unit = Set(has_unit);
        }
    if let Some(has_syllabus) = payload.has_syllabus {
            active_model.has_syllabus = Set(has_syllabus);
        }
    if let Some(has_material) = payload.has_material {
            active_model.has_material = Set(has_material);
        }
    if let Some(has_practice) = payload.has_practice {
            active_model.has_practice = Set(has_practice);
        }
    if let Some(has_dictation) = payload.has_dictation {
            active_model.has_dictation = Set(has_dictation);
        }
    if let Some(group_id) = payload.group_id {
            active_model.group_id = Set(Some(group_id));
        }
    if let Some(variety_id) = payload.variety_id {
            active_model.variety_id = Set(variety_id);
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(unit_id);
        }
    if let Some(competence_id) = payload.competence_id {
            active_model.competence_id = Set(Some(competence_id));
        }
    if let Some(feeder_course_group_id) = payload.feeder_course_group_id {
            active_model.feeder_course_group_id = Set(Some(feeder_course_group_id));
        }
    if let Some(feeder_course_type_id) = payload.feeder_course_type_id {
            active_model.feeder_course_type_id = Set(Some(feeder_course_type_id));
        }
    if let Some(feeder_course_id) = payload.feeder_course_id {
            active_model.feeder_course_id = Set(Some(feeder_course_id));
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CourseResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
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

        }))
}
#[endpoint(tags("Academic - Course - Master - Course"), status_codes(200, 400, 404, 500))]
pub async fn delete_course(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Course not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Course deleted successfully".to_string(),
        }))
}
