use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::course::master::course_evaluation_plannings::{
    CreateCourseEvaluationPlanningRequest, CourseEvaluationPlanningQuery, CourseEvaluationPlanningResponse, PaginatedCourseEvaluationPlanningResponse,
    UpdateCourseEvaluationPlanningRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::course::master::course_evaluation_plannings as entity_mod;

#[endpoint(tags("Academic - Course - Master - CourseEvaluationPlanning"), status_codes(200, 500))]
pub async fn list_course_evaluation_plannings(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCourseEvaluationPlanningResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CourseEvaluationPlanningQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| CourseEvaluationPlanningResponse {
            id: item.id,
            name: item.name.clone(),
            percentage: item.percentage,
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            evaluation_type_id: item.evaluation_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            code: item.code,

    }).collect();

    Ok(Json(PaginatedCourseEvaluationPlanningResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Course - Master - CourseEvaluationPlanning"), status_codes(200, 400, 404, 500))]
pub async fn get_course_evaluation_planning(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CourseEvaluationPlanningResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("CourseEvaluationPlanning not found"))?;

    Ok(Json(CourseEvaluationPlanningResponse {
            id: item.id,
            name: item.name.clone(),
            percentage: item.percentage,
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            evaluation_type_id: item.evaluation_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            code: item.code,

    }))
}#[endpoint(tags("Academic - Course - Master - CourseEvaluationPlanning"), status_codes(200, 400, 500))]
pub async fn create_course_evaluation_planning(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CourseEvaluationPlanningResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateCourseEvaluationPlanningRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        percentage: Set(payload.percentage),
        decription_indonesian: Set(payload.decription_indonesian),
        decription_english: Set(payload.decription_english),
        course_id: Set(payload.course_id),
        evaluation_type_id: Set(payload.evaluation_type_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        code: Set(payload.code),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CourseEvaluationPlanningResponse {
            id: item.id,
            name: item.name.clone(),
            percentage: item.percentage,
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            evaluation_type_id: item.evaluation_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            code: item.code,

        }))
}

#[endpoint(tags("Academic - Course - Master - CourseEvaluationPlanning"), status_codes(200, 400, 404, 500))]
pub async fn update_course_evaluation_planning(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CourseEvaluationPlanningResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCourseEvaluationPlanningRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("CourseEvaluationPlanning not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(percentage) = payload.percentage {
            active_model.percentage = Set(Some(percentage));
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
    if let Some(evaluation_type_id) = payload.evaluation_type_id {
            active_model.evaluation_type_id = Set(evaluation_type_id);
        }
    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CourseEvaluationPlanningResponse {
            id: item.id,
            name: item.name.clone(),
            percentage: item.percentage,
            decription_indonesian: item.decription_indonesian.clone(),
            decription_english: item.decription_english,
            course_id: item.course_id,
            evaluation_type_id: item.evaluation_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            code: item.code,

        }))
}
#[endpoint(tags("Academic - Course - Master - CourseEvaluationPlanning"), status_codes(200, 400, 404, 500))]
pub async fn delete_course_evaluation_planning(
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
            .ok_or_else(|| StatusError::not_found().brief("CourseEvaluationPlanning not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "CourseEvaluationPlanning deleted successfully".to_string(),
        }))
}
