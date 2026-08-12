use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::final_assignment::transaction::advisers::{
    CreateAdviserRequest, AdviserQuery, AdviserResponse, PaginatedAdviserResponse,
    UpdateAdviserRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::final_assignment::transaction::advisers as entity_mod;

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Adviser"), status_codes(200, 500))]
pub async fn list_advisers(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedAdviserResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: AdviserQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| AdviserResponse {
            id: item.id,
            thread: item.thread,
            lecturer_id: item.lecturer_id,
            detail_activity_id: item.detail_activity_id,
            submission_id: item.submission_id,
            adviser_category_id: item.adviser_category_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedAdviserResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Adviser"), status_codes(200, 400, 404, 500))]
pub async fn get_adviser(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AdviserResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Adviser not found"))?;

    Ok(Json(AdviserResponse {
            id: item.id,
            thread: item.thread,
            lecturer_id: item.lecturer_id,
            detail_activity_id: item.detail_activity_id,
            submission_id: item.submission_id,
            adviser_category_id: item.adviser_category_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Adviser"), status_codes(200, 400, 500))]
pub async fn create_adviser(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AdviserResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateAdviserRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        thread: Set(payload.thread),
        lecturer_id: Set(payload.lecturer_id),
        detail_activity_id: Set(payload.detail_activity_id),
        submission_id: Set(payload.submission_id),
        adviser_category_id: Set(payload.adviser_category_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AdviserResponse {
            id: item.id,
            thread: item.thread,
            lecturer_id: item.lecturer_id,
            detail_activity_id: item.detail_activity_id,
            submission_id: item.submission_id,
            adviser_category_id: item.adviser_category_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Adviser"), status_codes(200, 400, 404, 500))]
pub async fn update_adviser(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AdviserResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateAdviserRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Adviser not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(thread) = payload.thread {
            active_model.thread = Set(thread);
        }
    if let Some(lecturer_id) = payload.lecturer_id {
            active_model.lecturer_id = Set(lecturer_id);
        }
    if let Some(detail_activity_id) = payload.detail_activity_id {
            active_model.detail_activity_id = Set(detail_activity_id);
        }
    if let Some(submission_id) = payload.submission_id {
            active_model.submission_id = Set(Some(submission_id));
        }
    if let Some(adviser_category_id) = payload.adviser_category_id {
            active_model.adviser_category_id = Set(adviser_category_id);
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AdviserResponse {
            id: item.id,
            thread: item.thread,
            lecturer_id: item.lecturer_id,
            detail_activity_id: item.detail_activity_id,
            submission_id: item.submission_id,
            adviser_category_id: item.adviser_category_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Adviser"), status_codes(200, 400, 404, 500))]
pub async fn delete_adviser(
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
            .ok_or_else(|| StatusError::not_found().brief("Adviser not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Adviser deleted successfully".to_string(),
        }))
}
