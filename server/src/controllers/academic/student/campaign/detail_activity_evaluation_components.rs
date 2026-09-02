use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::detail_activity_evaluation_components::{
    CreateDetailActivityEvaluationComponentRequest, DetailActivityEvaluationComponentQuery, DetailActivityEvaluationComponentResponse, PaginatedDetailActivityEvaluationComponentResponse,
    UpdateDetailActivityEvaluationComponentRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::campaign::detail_activity_evaluation_components as entity_mod;

#[endpoint(tags("Academic - Student - Campaign - DetailActivityEvaluationComponent"), status_codes(200, 500))]
pub async fn list_detail_activity_evaluation_components(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedDetailActivityEvaluationComponentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DetailActivityEvaluationComponentQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
    if let Some(detail_activity_id) = query.detail_activity_id {
        select = select.filter(entity_mod::Column::DetailActivityId.eq(detail_activity_id));
    }
    if let Some(course_evaluation_planning_id) = query.course_evaluation_planning_id {
        select = select.filter(entity_mod::Column::CourseEvaluationPlanningId.eq(course_evaluation_planning_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| DetailActivityEvaluationComponentResponse {
            id: item.id,
            name: item.name,
            detail_activity_id: item.detail_activity_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            mark: item.mark,
            percentage: item.percentage,
            total: item.total,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedDetailActivityEvaluationComponentResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActivityEvaluationComponent"), status_codes(200, 400, 404, 500))]
pub async fn get_detail_activity_evaluation_component(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DetailActivityEvaluationComponentResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("DetailActivityEvaluationComponent not found"))?;

    Ok(Json(DetailActivityEvaluationComponentResponse {
            id: item.id,
            name: item.name,
            detail_activity_id: item.detail_activity_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            mark: item.mark,
            percentage: item.percentage,
            total: item.total,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Student - Campaign - DetailActivityEvaluationComponent"), status_codes(200, 400, 500))]
pub async fn create_detail_activity_evaluation_component(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DetailActivityEvaluationComponentResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateDetailActivityEvaluationComponentRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        detail_activity_id: Set(payload.detail_activity_id),
        course_evaluation_planning_id: Set(payload.course_evaluation_planning_id),
        mark: Set(payload.mark),
        percentage: Set(payload.percentage),
        total: Set(payload.total),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(DetailActivityEvaluationComponentResponse {
            id: item.id,
            name: item.name,
            detail_activity_id: item.detail_activity_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            mark: item.mark,
            percentage: item.percentage,
            total: item.total,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActivityEvaluationComponent"), status_codes(200, 400, 404, 500))]
pub async fn update_detail_activity_evaluation_component(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DetailActivityEvaluationComponentResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateDetailActivityEvaluationComponentRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("DetailActivityEvaluationComponent not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(detail_activity_id) = payload.detail_activity_id {
            active_model.detail_activity_id = Set(detail_activity_id);
        }
    if let Some(course_evaluation_planning_id) = payload.course_evaluation_planning_id {
            active_model.course_evaluation_planning_id = Set(course_evaluation_planning_id);
        }
    if let Some(mark) = payload.mark {
            active_model.mark = Set(Some(mark));
        }
    if let Some(percentage) = payload.percentage {
            active_model.percentage = Set(Some(percentage));
        }
    if let Some(total) = payload.total {
            active_model.total = Set(Some(total));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(DetailActivityEvaluationComponentResponse {
            id: item.id,
            name: item.name,
            detail_activity_id: item.detail_activity_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            mark: item.mark,
            percentage: item.percentage,
            total: item.total,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Student - Campaign - DetailActivityEvaluationComponent"), status_codes(200, 400, 404, 500))]
pub async fn delete_detail_activity_evaluation_component(
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
            .ok_or_else(|| StatusError::not_found().brief("DetailActivityEvaluationComponent not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "DetailActivityEvaluationComponent deleted successfully".to_string(),
        }))
}
