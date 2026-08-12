use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::auth::user::{
    CreateUserRequest, UserQuery, UserResponse, PaginatedUserResponse,
    UpdateUserRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::auth::user as entity_mod;

#[endpoint(tags("Auth -  - User"), status_codes(200, 500))]
pub async fn list_user(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedUserResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: UserQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedUserResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 404, 500))]
pub async fn get_user(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

    Ok(Json(UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 500))]
pub async fn create_user(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateUserRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        pid: Set(payload.pid),
        email: Set(payload.email),
        password: Set(payload.password),
        api_key: Set(payload.api_key),
        name: Set(payload.name),
        individual_id: Set(payload.individual_id),
        is_active: Set(payload.is_active),
        current_role_id: Set(payload.current_role_id),
        reset_token: Set(payload.reset_token),
        reset_sent_at: Set(payload.reset_sent_at),
        email_verification_token: Set(payload.email_verification_token),
        email_verification_sent_at: Set(payload.email_verification_sent_at),
        email_verified_at: Set(payload.email_verified_at),
        magic_link_token: Set(payload.magic_link_token),
        magic_link_expiration: Set(payload.magic_link_expiration),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 404, 500))]
pub async fn update_user(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UserResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateUserRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(pid) = payload.pid {
            active_model.pid = Set(pid);
        }
    if let Some(email) = payload.email {
            active_model.email = Set(email);
        }
    if let Some(password) = payload.password {
            active_model.password = Set(password);
        }
    if let Some(api_key) = payload.api_key {
            active_model.api_key = Set(api_key);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    if let Some(current_role_id) = payload.current_role_id {
            active_model.current_role_id = Set(Some(current_role_id));
        }
    if let Some(reset_token) = payload.reset_token {
            active_model.reset_token = Set(Some(reset_token));
        }
    if let Some(reset_sent_at) = payload.reset_sent_at {
            active_model.reset_sent_at = Set(Some(reset_sent_at));
        }
    if let Some(email_verification_token) = payload.email_verification_token {
            active_model.email_verification_token = Set(Some(email_verification_token));
        }
    if let Some(email_verification_sent_at) = payload.email_verification_sent_at {
            active_model.email_verification_sent_at = Set(Some(email_verification_sent_at));
        }
    if let Some(email_verified_at) = payload.email_verified_at {
            active_model.email_verified_at = Set(Some(email_verified_at));
        }
    if let Some(magic_link_token) = payload.magic_link_token {
            active_model.magic_link_token = Set(Some(magic_link_token));
        }
    if let Some(magic_link_expiration) = payload.magic_link_expiration {
            active_model.magic_link_expiration = Set(Some(magic_link_expiration));
        }
    active_model.updated_at = Set(now);

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UserResponse {
            id: item.id,
            pid: item.pid,
            email: item.email.clone(),
            password: item.password.clone(),
            api_key: item.api_key.clone(),
            name: item.name.clone(),
            individual_id: item.individual_id,
            is_active: item.is_active,
            current_role_id: item.current_role_id,
            reset_token: item.reset_token,
            reset_sent_at: item.reset_sent_at,
            email_verification_token: item.email_verification_token,
            email_verification_sent_at: item.email_verification_sent_at,
            email_verified_at: item.email_verified_at,
            magic_link_token: item.magic_link_token,
            magic_link_expiration: item.magic_link_expiration,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Auth -  - User"), status_codes(200, 400, 404, 500))]
pub async fn delete_user(
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
            .ok_or_else(|| StatusError::not_found().brief("User not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(now);

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "User deleted successfully".to_string(),
        }))
}
