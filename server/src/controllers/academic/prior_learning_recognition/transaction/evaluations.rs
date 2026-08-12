use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::prior_learning_recognition::transaction::evaluations::{
    CreateEvaluationRequest, EvaluationQuery, EvaluationResponse, PaginatedEvaluationResponse,
    UpdateEvaluationRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::prior_learning_recognition::transaction::evaluations as entity_mod;

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - Evaluation"), status_codes(200, 500))]
pub async fn list_evaluations(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEvaluationResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: EvaluationQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| EvaluationResponse {
            id: item.id,
            recognition_id: item.recognition_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            professionalism_id: item.professionalism_id,
            evidence_type_id: item.evidence_type_id,
            evaluator_id: item.evaluator_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedEvaluationResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - Evaluation"), status_codes(200, 400, 404, 500))]
pub async fn get_evaluation(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EvaluationResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Evaluation not found"))?;

    Ok(Json(EvaluationResponse {
            id: item.id,
            recognition_id: item.recognition_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            professionalism_id: item.professionalism_id,
            evidence_type_id: item.evidence_type_id,
            evaluator_id: item.evaluator_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - Evaluation"), status_codes(200, 400, 500))]
pub async fn create_evaluation(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EvaluationResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateEvaluationRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        recognition_id: Set(payload.recognition_id),
        course_evaluation_planning_id: Set(payload.course_evaluation_planning_id),
        professionalism_id: Set(payload.professionalism_id),
        evidence_type_id: Set(payload.evidence_type_id),
        evaluator_id: Set(payload.evaluator_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EvaluationResponse {
            id: item.id,
            recognition_id: item.recognition_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            professionalism_id: item.professionalism_id,
            evidence_type_id: item.evidence_type_id,
            evaluator_id: item.evaluator_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - Evaluation"), status_codes(200, 400, 404, 500))]
pub async fn update_evaluation(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EvaluationResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateEvaluationRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Evaluation not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(recognition_id) = payload.recognition_id {
            active_model.recognition_id = Set(Some(recognition_id));
        }
    if let Some(course_evaluation_planning_id) = payload.course_evaluation_planning_id {
            active_model.course_evaluation_planning_id = Set(Some(course_evaluation_planning_id));
        }
    if let Some(professionalism_id) = payload.professionalism_id {
            active_model.professionalism_id = Set(Some(professionalism_id));
        }
    if let Some(evidence_type_id) = payload.evidence_type_id {
            active_model.evidence_type_id = Set(Some(evidence_type_id));
        }
    if let Some(evaluator_id) = payload.evaluator_id {
            active_model.evaluator_id = Set(Some(evaluator_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EvaluationResponse {
            id: item.id,
            recognition_id: item.recognition_id,
            course_evaluation_planning_id: item.course_evaluation_planning_id,
            professionalism_id: item.professionalism_id,
            evidence_type_id: item.evidence_type_id,
            evaluator_id: item.evaluator_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - Evaluation"), status_codes(200, 400, 404, 500))]
pub async fn delete_evaluation(
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
            .ok_or_else(|| StatusError::not_found().brief("Evaluation not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Evaluation deleted successfully".to_string(),
        }))
}
