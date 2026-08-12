use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::survey::transaction::responds::{
    CreateRespondRequest, RespondQuery, RespondResponse, PaginatedRespondResponse,
    UpdateRespondRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::survey::transaction::responds as entity_mod;

#[endpoint(tags("Academic - Survey - Transaction - Respond"), status_codes(200, 500))]
pub async fn list_responds(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRespondResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RespondQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| RespondResponse {
            id: item.id,
            name: item.name,
            conduct_id: item.conduct_id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            answer_id: item.answer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedRespondResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Survey - Transaction - Respond"), status_codes(200, 400, 404, 500))]
pub async fn get_respond(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RespondResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Respond not found"))?;

    Ok(Json(RespondResponse {
            id: item.id,
            name: item.name,
            conduct_id: item.conduct_id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            answer_id: item.answer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Survey - Transaction - Respond"), status_codes(200, 400, 500))]
pub async fn create_respond(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RespondResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRespondRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        conduct_id: Set(payload.conduct_id),
        bundle_id: Set(payload.bundle_id),
        question_id: Set(payload.question_id),
        answer_id: Set(payload.answer_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RespondResponse {
            id: item.id,
            name: item.name,
            conduct_id: item.conduct_id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            answer_id: item.answer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Survey - Transaction - Respond"), status_codes(200, 400, 404, 500))]
pub async fn update_respond(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RespondResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRespondRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Respond not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(conduct_id) = payload.conduct_id {
            active_model.conduct_id = Set(conduct_id);
        }
    if let Some(bundle_id) = payload.bundle_id {
            active_model.bundle_id = Set(bundle_id);
        }
    if let Some(question_id) = payload.question_id {
            active_model.question_id = Set(question_id);
        }
    if let Some(answer_id) = payload.answer_id {
            active_model.answer_id = Set(Some(answer_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RespondResponse {
            id: item.id,
            name: item.name,
            conduct_id: item.conduct_id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            answer_id: item.answer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Survey - Transaction - Respond"), status_codes(200, 400, 404, 500))]
pub async fn delete_respond(
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
            .ok_or_else(|| StatusError::not_found().brief("Respond not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Respond deleted successfully".to_string(),
        }))
}
