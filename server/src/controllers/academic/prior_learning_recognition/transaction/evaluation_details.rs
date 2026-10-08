use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, Condition, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::prior_learning_recognition::transaction::evaluation_details::{
    CreateEvaluationDetailRequest, EvaluationDetailQuery, EvaluationDetailResponse,
    PaginatedEvaluationDetailResponse, UpdateEvaluationDetailRequest, EvaluationDetailOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::prior_learning_recognition::transaction::evaluation_details as entity_mod;
use crate::models::academic::prior_learning_recognition::reference::evidence_types as evidence_type_mod;
use crate::models::document::transaction::archives as archive_mod;
use crate::middleware::auth::auth_user_id;

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - EvaluationDetail"), status_codes(200, 500))]
pub async fn list_evaluation_details(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEvaluationDetailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: EvaluationDetailQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| EvaluationDetailResponse {
            id: item.id,
            evaluation_id: item.evaluation_id,
            archive_id: item.archive_id,
            evidence_type_id: item.evidence_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedEvaluationDetailResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - EvaluationDetail"), status_codes(200, 400, 404, 500))]
pub async fn get_evaluation_detail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EvaluationDetailResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("EvaluationDetail not found"))?;

    Ok(Json(EvaluationDetailResponse {
            id: item.id,
            evaluation_id: item.evaluation_id,
            archive_id: item.archive_id,
            evidence_type_id: item.evidence_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - EvaluationDetail"), status_codes(200, 400, 500))]
pub async fn create_evaluation_detail(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EvaluationDetailResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateEvaluationDetailRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        evaluation_id: Set(payload.evaluation_id),
        archive_id: Set(payload.archive_id),
        evidence_type_id: Set(payload.evidence_type_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EvaluationDetailResponse {
            id: item.id,
            evaluation_id: item.evaluation_id,
            archive_id: item.archive_id,
            evidence_type_id: item.evidence_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - EvaluationDetail"), status_codes(200, 400, 404, 500))]
pub async fn update_evaluation_detail(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EvaluationDetailResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateEvaluationDetailRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("EvaluationDetail not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(evaluation_id) = payload.evaluation_id {
            active_model.evaluation_id = Set(Some(evaluation_id));
        }
    if let Some(archive_id) = payload.archive_id {
            active_model.archive_id = Set(Some(archive_id));
        }
    if let Some(evidence_type_id) = payload.evidence_type_id {
            active_model.evidence_type_id = Set(Some(evidence_type_id));
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EvaluationDetailResponse {
            id: item.id,
            evaluation_id: item.evaluation_id,
            archive_id: item.archive_id,
            evidence_type_id: item.evidence_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - EvaluationDetail"), status_codes(200, 400, 404, 500))]
pub async fn delete_evaluation_detail(
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
            .ok_or_else(|| StatusError::not_found().brief("EvaluationDetail not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "EvaluationDetail deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Prior_Learning_Recognition - Transaction - EvaluationDetail"), status_codes(200, 500))]
pub async fn options_evaluation_details(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: EvaluationDetailOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(evaluation_id) = payload.evaluation_id {
        select = select.filter(entity_mod::Column::EvaluationId.eq(evaluation_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let evidence_type_ids: Vec<Uuid> = evidence_type_mod::Entity::find()
                .filter(evidence_type_mod::Column::DeletedAt.is_null())
                .filter(evidence_type_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(evidence_type_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let archive_ids: Vec<Uuid> = archive_mod::Entity::find()
                .filter(archive_mod::Column::DeletedAt.is_null())
                .filter(archive_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(archive_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(
                Condition::any()
                    .add(entity_mod::Column::EvidenceTypeId.is_in(evidence_type_ids))
                    .add(entity_mod::Column::ArchiveId.is_in(archive_ids)),
            );
        }
    }

    // Unscoped requests are capped; slim-select narrows the list through `search`.
    if !is_scoped {
        select = select.limit(100);
    }

    let items = select
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let evidence_type_names: HashMap<Uuid, String> = evidence_type_mod::Entity::find()
        .filter(evidence_type_mod::Column::Id.is_in(items.iter().filter_map(|item| item.evidence_type_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let archive_names: HashMap<Uuid, String> = archive_mod::Entity::find()
        .filter(archive_mod::Column::Id.is_in(items.iter().filter_map(|item| item.archive_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let mut data: Vec<OptionItem> = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: [
                item.evidence_type_id.and_then(|id| evidence_type_names.get(&id).cloned()),
                item.archive_id.and_then(|id| archive_names.get(&id).cloned()),
            ]
            .into_iter()
            .flatten()
            .collect::<Vec<_>>()
            .join(" - "),
        })
        .collect();
    data.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(Json(data))
}
