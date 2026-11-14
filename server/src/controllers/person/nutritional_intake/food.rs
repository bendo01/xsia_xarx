use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::common::reference::{MessageResponse, OptionItem, OptionRequest};
use crate::dtos::person::nutritional_intake::foods::{
    CreateFoodRequest, PaginatedFoodResponse, UpdateFoodRequest, FoodQuery, FoodResponse,
};
use crate::middleware::auth::auth_user_id;
use crate::models::person::nutritional_intake::food as entity_mod;

#[endpoint(tags("Person - NutritionalIntake - Food"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedFoodResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: FoodQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(10).clamp(1, 1000);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    if let Some(ref v) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(v));
    }
    if let Some(v) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(v));
    }
    if let Some(v) = query.food_group_id {
        select = select.filter(entity_mod::Column::FoodGroupId.eq(v));
    }
    if let Some(v) = query.source_id {
        select = select.filter(entity_mod::Column::SourceId.eq(v));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Code)
        .paginate(db, page_size);

    let total = paginator
        .num_items()
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = total.div_ceil(page_size);

    let items = paginator
        .fetch_page(page - 1)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PaginatedFoodResponse {
        data: items.into_iter().map(FoodResponse::from).collect(),
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Person - NutritionalIntake - Food"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<FoodResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Food not found"))?;

    Ok(Json(FoodResponse::from(item)))
}

#[endpoint(tags("Person - NutritionalIntake - Food"), status_codes(200, 400, 500))]
pub async fn store(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<FoodResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateFoodRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let user_id = auth_user_id(depot);

    let active_model = entity_mod::ActiveModel {
        id: Set(Uuid::new_v4()),
        food_group_id: Set(payload.food_group_id),
        source_id: Set(payload.source_id),
        code: Set(payload.code),
        name: Set(payload.name),
        kind: Set(payload.kind),
        edible_portion: Set(payload.edible_portion),
        species: Set(payload.species),
        genus: Set(payload.genus),
        family: Set(payload.family),
        english_name: Set(payload.english_name),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(user_id),
        updated_by: Set(user_id),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(FoodResponse::from(item)))
}

#[endpoint(tags("Person - NutritionalIntake - Food"), status_codes(200, 400, 404, 500))]
pub async fn update(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<FoodResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateFoodRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Food not found"))?;

    let mut active_model = existing.into_active_model();
    if let Some(v) = payload.food_group_id {
        active_model.food_group_id = Set(v);
    }
    if payload.source_id.is_some() {
        active_model.source_id = Set(payload.source_id);
    }
    if let Some(v) = payload.code {
        active_model.code = Set(v);
    }
    if let Some(v) = payload.name {
        active_model.name = Set(v);
    }
    if payload.kind.is_some() {
        active_model.kind = Set(payload.kind);
    }
    if payload.edible_portion.is_some() {
        active_model.edible_portion = Set(payload.edible_portion);
    }
    if payload.species.is_some() {
        active_model.species = Set(payload.species);
    }
    if payload.genus.is_some() {
        active_model.genus = Set(payload.genus);
    }
    if payload.family.is_some() {
        active_model.family = Set(payload.family);
    }
    if payload.english_name.is_some() {
        active_model.english_name = Set(payload.english_name);
    }
    active_model.updated_at = Set(Utc::now().naive_utc());
    active_model.updated_by = Set(auth_user_id(depot));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(FoodResponse::from(item)))
}

#[endpoint(tags("Person - NutritionalIntake - Food"), status_codes(200, 400, 404, 500))]
pub async fn delete(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Food not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(now);
    active_model.updated_by = Set(auth_user_id(depot));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Food deleted successfully".to_string(),
    }))
}

#[endpoint(tags("Person - NutritionalIntake - Food"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: OptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            select = select.filter(entity_mod::Column::Name.contains(search_trimmed));
        }
    }

    let items = select
        .order_by_asc(entity_mod::Column::Code)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: item.name,
        })
        .collect();

    Ok(Json(data))
}
