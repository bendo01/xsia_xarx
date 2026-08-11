use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::contact::master::phones::{
    CreatePhonRequest, PhonQuery, PhonResponse, PaginatedPhonResponse,
    UpdatePhonRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::contact::master::phones as entity_mod;

#[endpoint(tags("Contact - Master - Phon"), status_codes(200, 500))]
pub async fn list_phones(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPhonResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PhonQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PhonResponse {
            id: item.id,
            phone_number: item.phone_number.clone(),
            phone_type_id: item.phone_type_id,
            phoneable_id: item.phoneable_id,
            phoneable_type: item.phoneable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedPhonResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Contact - Master - Phon"), status_codes(200, 400, 404, 500))]
pub async fn get_phone(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PhonResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Phon not found"))?;

    Ok(Json(PhonResponse {
            id: item.id,
            phone_number: item.phone_number.clone(),
            phone_type_id: item.phone_type_id,
            phoneable_id: item.phoneable_id,
            phoneable_type: item.phoneable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Contact - Master - Phon"), status_codes(200, 400, 500))]
pub async fn create_phone(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PhonResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreatePhonRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        phone_number: Set(payload.phone_number),
        phone_type_id: Set(payload.phone_type_id),
        phoneable_id: Set(payload.phoneable_id),
        phoneable_type: Set(payload.phoneable_type),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PhonResponse {
            id: item.id,
            phone_number: item.phone_number.clone(),
            phone_type_id: item.phone_type_id,
            phoneable_id: item.phoneable_id,
            phoneable_type: item.phoneable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Contact - Master - Phon"), status_codes(200, 400, 404, 500))]
pub async fn update_phone(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PhonResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdatePhonRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Phon not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(phone_number) = payload.phone_number {
        active_model.phone_number = Set(phone_number);
    }
    if let Some(phone_type_id) = payload.phone_type_id {
        active_model.phone_type_id = Set(Some(phone_type_id));
    }
    if let Some(phoneable_id) = payload.phoneable_id {
        active_model.phoneable_id = Set(phoneable_id);
    }
    if let Some(phoneable_type) = payload.phoneable_type {
        active_model.phoneable_type = Set(phoneable_type);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PhonResponse {
            id: item.id,
            phone_number: item.phone_number.clone(),
            phone_type_id: item.phone_type_id,
            phoneable_id: item.phoneable_id,
            phoneable_type: item.phoneable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Contact - Master - Phon"), status_codes(200, 400, 404, 500))]
pub async fn delete_phone(
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
        .ok_or_else(|| StatusError::not_found().brief("Phon not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Phon deleted successfully".to_string(),
    }))
}
