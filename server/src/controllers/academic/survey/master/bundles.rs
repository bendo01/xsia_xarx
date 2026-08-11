use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::survey::master::bundles::{
    CreateBundlRequest, BundlQuery, BundlResponse, PaginatedBundlResponse,
    UpdateBundlRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::survey::master::bundles as entity_mod;

#[endpoint(tags("Academic - Survey - Master - Bundl"), status_codes(200, 500))]
pub async fn list_bundles(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBundlResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BundlQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| BundlResponse {
            id: item.id,
            code: item.code,
            alphabet_code: item.alphabet_code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            bundle_category_id: item.bundle_category_id,
            unit_id: item.unit_id,
            suggestion: item.suggestion,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedBundlResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Survey - Master - Bundl"), status_codes(200, 400, 404, 500))]
pub async fn get_bundle(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BundlResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Bundl not found"))?;

    Ok(Json(BundlResponse {
            id: item.id,
            code: item.code,
            alphabet_code: item.alphabet_code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            bundle_category_id: item.bundle_category_id,
            unit_id: item.unit_id,
            suggestion: item.suggestion,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Survey - Master - Bundl"), status_codes(200, 400, 500))]
pub async fn create_bundle(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BundlResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateBundlRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        alphabet_code: Set(payload.alphabet_code),
        name: Set(payload.name),
        institution_id: Set(payload.institution_id),
        bundle_category_id: Set(payload.bundle_category_id),
        unit_id: Set(payload.unit_id),
        suggestion: Set(payload.suggestion),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(BundlResponse {
            id: item.id,
            code: item.code,
            alphabet_code: item.alphabet_code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            bundle_category_id: item.bundle_category_id,
            unit_id: item.unit_id,
            suggestion: item.suggestion,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Survey - Master - Bundl"), status_codes(200, 400, 404, 500))]
pub async fn update_bundle(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BundlResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateBundlRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Bundl not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
        active_model.code = Set(code);
    }
    if let Some(alphabet_code) = payload.alphabet_code {
        active_model.alphabet_code = Set(alphabet_code);
    }
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(institution_id) = payload.institution_id {
        active_model.institution_id = Set(institution_id);
    }
    if let Some(bundle_category_id) = payload.bundle_category_id {
        active_model.bundle_category_id = Set(bundle_category_id);
    }
    if let Some(unit_id) = payload.unit_id {
        active_model.unit_id = Set(Some(unit_id));
    }
    if let Some(suggestion) = payload.suggestion {
        active_model.suggestion = Set(Some(suggestion));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(BundlResponse {
            id: item.id,
            code: item.code,
            alphabet_code: item.alphabet_code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            bundle_category_id: item.bundle_category_id,
            unit_id: item.unit_id,
            suggestion: item.suggestion,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Survey - Master - Bundl"), status_codes(200, 400, 404, 500))]
pub async fn delete_bundle(
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
        .ok_or_else(|| StatusError::not_found().brief("Bundl not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now().into()));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Bundl deleted successfully".to_string(),
    }))
}
