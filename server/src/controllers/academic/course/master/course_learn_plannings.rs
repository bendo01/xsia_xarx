use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::course::master::course_learn_plannings::{
    CreateCourseLearnPlanningRequest, CourseLearnPlanningQuery, CourseLearnPlanningResponse, PaginatedCourseLearnPlanningResponse,
    UpdateCourseLearnPlanningRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::course::master::course_learn_plannings as entity_mod;

#[endpoint(tags("Academic - Course - Master - CourseLearnPlanning"), status_codes(200, 500))]
pub async fn list_course_learn_plannings(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCourseLearnPlanningResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CourseLearnPlanningQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| CourseLearnPlanningResponse {
            id: item.id,
            code: item.code,
            name: item.name.clone(),
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id_rencana_ajar: item.feeder_id_rencana_ajar,

    }).collect();

    Ok(Json(PaginatedCourseLearnPlanningResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Course - Master - CourseLearnPlanning"), status_codes(200, 400, 404, 500))]
pub async fn get_course_learn_planning(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CourseLearnPlanningResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("CourseLearnPlanning not found"))?;

    Ok(Json(CourseLearnPlanningResponse {
            id: item.id,
            code: item.code,
            name: item.name.clone(),
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id_rencana_ajar: item.feeder_id_rencana_ajar,

    }))
}#[endpoint(tags("Academic - Course - Master - CourseLearnPlanning"), status_codes(200, 400, 500))]
pub async fn create_course_learn_planning(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CourseLearnPlanningResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateCourseLearnPlanningRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        decription_indonesian: Set(payload.decription_indonesian),
        decription_english: Set(payload.decription_english),
        course_id: Set(payload.course_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        feeder_id_rencana_ajar: Set(payload.feeder_id_rencana_ajar),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CourseLearnPlanningResponse {
            id: item.id,
            code: item.code,
            name: item.name.clone(),
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id_rencana_ajar: item.feeder_id_rencana_ajar,

        }))
}

#[endpoint(tags("Academic - Course - Master - CourseLearnPlanning"), status_codes(200, 400, 404, 500))]
pub async fn update_course_learn_planning(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CourseLearnPlanningResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCourseLearnPlanningRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("CourseLearnPlanning not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(decription_indonesian) = payload.decription_indonesian {
            active_model.decription_indonesian = Set(decription_indonesian);
        }
    if let Some(decription_english) = payload.decription_english {
            active_model.decription_english = Set(Some(decription_english));
        }
    if let Some(course_id) = payload.course_id {
            active_model.course_id = Set(course_id);
        }
    if let Some(feeder_id_rencana_ajar) = payload.feeder_id_rencana_ajar {
            active_model.feeder_id_rencana_ajar = Set(Some(feeder_id_rencana_ajar));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CourseLearnPlanningResponse {
            id: item.id,
            code: item.code,
            name: item.name.clone(),
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id_rencana_ajar: item.feeder_id_rencana_ajar,

        }))
}
#[endpoint(tags("Academic - Course - Master - CourseLearnPlanning"), status_codes(200, 400, 404, 500))]
pub async fn delete_course_learn_planning(
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
            .ok_or_else(|| StatusError::not_found().brief("CourseLearnPlanning not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "CourseLearnPlanning deleted successfully".to_string(),
        }))
}
