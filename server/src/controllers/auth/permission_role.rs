use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, Condition, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::auth::permission_role::{
    CreatePermissionRoleRequest, PermissionRoleQuery, PermissionRoleResponse,
    PaginatedPermissionRoleResponse, UpdatePermissionRoleRequest, PermissionRoleOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::auth::permission_role as entity_mod;
use crate::models::auth::role as role_mod;
use crate::models::auth::permission as permission_mod;
use crate::middleware::auth::auth_user_id;

#[endpoint(tags("Auth - PermissionRole"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPermissionRoleResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PermissionRoleQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(role_id) = query.role_id {
        select = select.filter(entity_mod::Column::RoleId.eq(role_id));
    }
    if let Some(permission_id) = query.permission_id {
        select = select.filter(entity_mod::Column::PermissionId.eq(permission_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PermissionRoleResponse {
        id: item.id,
        role_id: item.role_id,
        permission_id: item.permission_id,
        created_at: Some(item.created_at),
        updated_at: Some(item.updated_at),
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }).collect();

    Ok(Json(PaginatedPermissionRoleResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Auth - PermissionRole"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PermissionRoleResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PermissionRole not found"))?;

    Ok(Json(PermissionRoleResponse {
        id: item.id,
        role_id: item.role_id,
        permission_id: item.permission_id,
        created_at: Some(item.created_at),
        updated_at: Some(item.updated_at),
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }))
}

#[endpoint(tags("Auth - PermissionRole"), status_codes(200, 400, 500))]
pub async fn store(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PermissionRoleResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreatePermissionRoleRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    // Assigning an already-assigned permission is a no-op: return the existing link
    if let Some(item) = entity_mod::Entity::find()
        .filter(entity_mod::Column::DeletedAt.is_null())
        .filter(entity_mod::Column::RoleId.eq(payload.role_id))
        .filter(entity_mod::Column::PermissionId.eq(payload.permission_id))
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    {
        return Ok(Json(PermissionRoleResponse {
            id: item.id,
            role_id: item.role_id,
            permission_id: item.permission_id,
            created_at: Some(item.created_at),
            updated_at: Some(item.updated_at),
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
        }));
    }

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        role_id: Set(payload.role_id),
        permission_id: Set(payload.permission_id),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PermissionRoleResponse {
        id: item.id,
        role_id: item.role_id,
        permission_id: item.permission_id,
        created_at: Some(item.created_at),
        updated_at: Some(item.updated_at),
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }))
}

#[endpoint(tags("Auth - PermissionRole"), status_codes(200, 400, 404, 500))]
pub async fn update(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PermissionRoleResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdatePermissionRoleRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("PermissionRole not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(role_id) = payload.role_id {
        active_model.role_id = Set(role_id);
    }
    if let Some(permission_id) = payload.permission_id {
        active_model.permission_id = Set(permission_id);
    }
    active_model.updated_at = Set(now);
    active_model.updated_by = Set(auth_user_id(depot));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PermissionRoleResponse {
        id: item.id,
        role_id: item.role_id,
        permission_id: item.permission_id,
        created_at: Some(item.created_at),
        updated_at: Some(item.updated_at),
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }))
}

#[endpoint(tags("Auth - PermissionRole"), status_codes(200, 400, 404, 500))]
pub async fn delete(
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
        .ok_or_else(|| StatusError::not_found().brief("PermissionRole not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(now);
    active_model.updated_by = Set(auth_user_id(depot));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "PermissionRole deleted successfully".to_string(),
    }))
}

#[endpoint(tags("Auth - PermissionRole"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: PermissionRoleOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(role_id) = payload.role_id {
        select = select.filter(entity_mod::Column::RoleId.eq(role_id));
        is_scoped = true;
    }

    if let Some(permission_id) = payload.permission_id {
        select = select.filter(entity_mod::Column::PermissionId.eq(permission_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let role_ids: Vec<Uuid> = role_mod::Entity::find()
                .filter(role_mod::Column::DeletedAt.is_null())
                .filter(role_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(role_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let permission_ids: Vec<Uuid> = permission_mod::Entity::find()
                .filter(permission_mod::Column::DeletedAt.is_null())
                .filter(permission_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(permission_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(
                Condition::any()
                    .add(entity_mod::Column::RoleId.is_in(role_ids))
                    .add(entity_mod::Column::PermissionId.is_in(permission_ids)),
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

    let role_names: HashMap<Uuid, String> = role_mod::Entity::find()
        .filter(role_mod::Column::Id.is_in(items.iter().map(|item| item.role_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let permission_names: HashMap<Uuid, String> = permission_mod::Entity::find()
        .filter(permission_mod::Column::Id.is_in(items.iter().map(|item| item.permission_id).collect::<Vec<_>>()))
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
                role_names.get(&item.role_id).cloned(),
                permission_names.get(&item.permission_id).cloned(),
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
