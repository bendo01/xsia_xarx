use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::building::master::buildings::{
    CreateBuildingRequest, BuildingQuery, BuildingResponse, PaginatedBuildingResponse,
    UpdateBuildingRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::building::master::buildings as entity_mod;

#[endpoint(tags("Building - Master - Building"), status_codes(200, 500))]
pub async fn list_buildings(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBuildingResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BuildingQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| BuildingResponse {
            id: item.id,
            alphabet_code: item.alphabet_code,
            name: item.name.clone(),
            long: item.long,
            wide: item.wide,
            high: item.high,
            variety_id: item.variety_id,
            category_id: item.category_id,
            total_floor: item.total_floor,
            residence_id: item.residence_id,
            condition_id: item.condition_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedBuildingResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Building - Master - Building"), status_codes(200, 400, 404, 500))]
pub async fn get_building(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BuildingResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Building not found"))?;

    Ok(Json(BuildingResponse {
            id: item.id,
            alphabet_code: item.alphabet_code,
            name: item.name.clone(),
            long: item.long,
            wide: item.wide,
            high: item.high,
            variety_id: item.variety_id,
            category_id: item.category_id,
            total_floor: item.total_floor,
            residence_id: item.residence_id,
            condition_id: item.condition_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Building - Master - Building"), status_codes(200, 400, 500))]
pub async fn create_building(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BuildingResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateBuildingRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        alphabet_code: Set(payload.alphabet_code),
        name: Set(payload.name),
        long: Set(payload.long),
        wide: Set(payload.wide),
        high: Set(payload.high),
        variety_id: Set(payload.variety_id),
        category_id: Set(payload.category_id),
        total_floor: Set(payload.total_floor),
        residence_id: Set(payload.residence_id),
        condition_id: Set(payload.condition_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(BuildingResponse {
            id: item.id,
            alphabet_code: item.alphabet_code,
            name: item.name.clone(),
            long: item.long,
            wide: item.wide,
            high: item.high,
            variety_id: item.variety_id,
            category_id: item.category_id,
            total_floor: item.total_floor,
            residence_id: item.residence_id,
            condition_id: item.condition_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Building - Master - Building"), status_codes(200, 400, 404, 500))]
pub async fn update_building(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BuildingResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateBuildingRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Building not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(alphabet_code) = payload.alphabet_code {
        active_model.alphabet_code = Set(Some(alphabet_code));
    }
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(long) = payload.long {
        active_model.long = Set(Some(long));
    }
    if let Some(wide) = payload.wide {
        active_model.wide = Set(Some(wide));
    }
    if let Some(high) = payload.high {
        active_model.high = Set(Some(high));
    }
    if let Some(variety_id) = payload.variety_id {
        active_model.variety_id = Set(variety_id);
    }
    if let Some(category_id) = payload.category_id {
        active_model.category_id = Set(category_id);
    }
    if let Some(total_floor) = payload.total_floor {
        active_model.total_floor = Set(Some(total_floor));
    }
    if let Some(residence_id) = payload.residence_id {
        active_model.residence_id = Set(residence_id);
    }
    if let Some(condition_id) = payload.condition_id {
        active_model.condition_id = Set(condition_id);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(BuildingResponse {
            id: item.id,
            alphabet_code: item.alphabet_code,
            name: item.name.clone(),
            long: item.long,
            wide: item.wide,
            high: item.high,
            variety_id: item.variety_id,
            category_id: item.category_id,
            total_floor: item.total_floor,
            residence_id: item.residence_id,
            condition_id: item.condition_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Building - Master - Building"), status_codes(200, 400, 404, 500))]
pub async fn delete_building(
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
        .ok_or_else(|| StatusError::not_found().brief("Building not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Building deleted successfully".to_string(),
    }))
}
