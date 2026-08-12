use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::final_assignment::transaction::evaluation_summaries::{
    CreateEvaluationSummariRequest, EvaluationSummariQuery, EvaluationSummariResponse, PaginatedEvaluationSummariResponse,
    UpdateEvaluationSummariRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::final_assignment::transaction::evaluation_summaries as entity_mod;

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - EvaluationSummari"), status_codes(200, 500))]
pub async fn list_evaluation_summaries(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEvaluationSummariResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: EvaluationSummariQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| EvaluationSummariResponse {
            id: item.id,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            mark: item.mark,
            grade_id: item.grade_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedEvaluationSummariResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - EvaluationSummari"), status_codes(200, 400, 404, 500))]
pub async fn get_evaluation_summarie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EvaluationSummariResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("EvaluationSummari not found"))?;

    Ok(Json(EvaluationSummariResponse {
            id: item.id,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            mark: item.mark,
            grade_id: item.grade_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - EvaluationSummari"), status_codes(200, 400, 500))]
pub async fn create_evaluation_summarie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EvaluationSummariResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateEvaluationSummariRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        submission_id: Set(payload.submission_id),
        detail_activity_id: Set(payload.detail_activity_id),
        stage_id: Set(payload.stage_id),
        mark: Set(payload.mark),
        grade_id: Set(payload.grade_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EvaluationSummariResponse {
            id: item.id,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            mark: item.mark,
            grade_id: item.grade_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - EvaluationSummari"), status_codes(200, 400, 404, 500))]
pub async fn update_evaluation_summarie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EvaluationSummariResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateEvaluationSummariRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("EvaluationSummari not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(submission_id) = payload.submission_id {
            active_model.submission_id = Set(Some(submission_id));
        }
    if let Some(detail_activity_id) = payload.detail_activity_id {
            active_model.detail_activity_id = Set(detail_activity_id);
        }
    if let Some(stage_id) = payload.stage_id {
            active_model.stage_id = Set(stage_id);
        }
    if let Some(mark) = payload.mark {
            active_model.mark = Set(Some(mark));
        }
    if let Some(grade_id) = payload.grade_id {
            active_model.grade_id = Set(Some(grade_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EvaluationSummariResponse {
            id: item.id,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            mark: item.mark,
            grade_id: item.grade_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - EvaluationSummari"), status_codes(200, 400, 404, 500))]
pub async fn delete_evaluation_summarie(
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
            .ok_or_else(|| StatusError::not_found().brief("EvaluationSummari not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "EvaluationSummari deleted successfully".to_string(),
        }))
}
