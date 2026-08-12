use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::campaign::transaction::teach_evaluations::{
    CreateTeachEvaluationRequest, TeachEvaluationQuery, TeachEvaluationResponse, PaginatedTeachEvaluationResponse,
    UpdateTeachEvaluationRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::campaign::transaction::teach_evaluations as entity_mod;

#[endpoint(tags("Academic - Campaign - Transaction - TeachEvaluation"), status_codes(200, 500))]
pub async fn list_teach_evaluations(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedTeachEvaluationResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: TeachEvaluationQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| TeachEvaluationResponse {
            id: item.id,
            thread: item.thread,
            name: item.name,
            english_name: item.english_name,
            evaluation_weight: item.evaluation_weight,
            evaluation_type_id: item.evaluation_type_id,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            teach_id: item.teach_id,

    }).collect();

    Ok(Json(PaginatedTeachEvaluationResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - TeachEvaluation"), status_codes(200, 400, 404, 500))]
pub async fn get_teach_evaluation(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<TeachEvaluationResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("TeachEvaluation not found"))?;

    Ok(Json(TeachEvaluationResponse {
            id: item.id,
            thread: item.thread,
            name: item.name,
            english_name: item.english_name,
            evaluation_weight: item.evaluation_weight,
            evaluation_type_id: item.evaluation_type_id,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            teach_id: item.teach_id,

    }))
}#[endpoint(tags("Academic - Campaign - Transaction - TeachEvaluation"), status_codes(200, 400, 500))]
pub async fn create_teach_evaluation(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<TeachEvaluationResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateTeachEvaluationRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        thread: Set(payload.thread),
        name: Set(payload.name),
        english_name: Set(payload.english_name),
        evaluation_weight: Set(payload.evaluation_weight),
        evaluation_type_id: Set(payload.evaluation_type_id),
        feeder_id: Set(payload.feeder_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        teach_id: Set(payload.teach_id),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(TeachEvaluationResponse {
            id: item.id,
            thread: item.thread,
            name: item.name,
            english_name: item.english_name,
            evaluation_weight: item.evaluation_weight,
            evaluation_type_id: item.evaluation_type_id,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            teach_id: item.teach_id,

        }))
}

#[endpoint(tags("Academic - Campaign - Transaction - TeachEvaluation"), status_codes(200, 400, 404, 500))]
pub async fn update_teach_evaluation(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<TeachEvaluationResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateTeachEvaluationRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("TeachEvaluation not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(thread) = payload.thread {
            active_model.thread = Set(Some(thread));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(english_name) = payload.english_name {
            active_model.english_name = Set(Some(english_name));
        }
    if let Some(evaluation_weight) = payload.evaluation_weight {
            active_model.evaluation_weight = Set(Some(evaluation_weight));
        }
    if let Some(evaluation_type_id) = payload.evaluation_type_id {
            active_model.evaluation_type_id = Set(Some(evaluation_type_id));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(teach_id) = payload.teach_id {
            active_model.teach_id = Set(Some(teach_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(TeachEvaluationResponse {
            id: item.id,
            thread: item.thread,
            name: item.name,
            english_name: item.english_name,
            evaluation_weight: item.evaluation_weight,
            evaluation_type_id: item.evaluation_type_id,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            teach_id: item.teach_id,

        }))
}
#[endpoint(tags("Academic - Campaign - Transaction - TeachEvaluation"), status_codes(200, 400, 404, 500))]
pub async fn delete_teach_evaluation(
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
            .ok_or_else(|| StatusError::not_found().brief("TeachEvaluation not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "TeachEvaluation deleted successfully".to_string(),
        }))
}
