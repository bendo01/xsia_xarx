use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::common::reference::{MessageResponse};
use crate::dtos::person::nutritional_intake::corrections::{
    CreateCorrectionRequest, PaginatedCorrectionResponse, UpdateCorrectionRequest, CorrectionQuery, CorrectionResponse,
};
use crate::middleware::auth::auth_user_id;
use crate::models::person::nutritional_intake::correction as entity_mod;

#[endpoint(tags("Person - NutritionalIntake - Correction"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCorrectionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CorrectionQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1).max(1);
    let page_size = query.page_size.unwrap_or(10).clamp(1, 1000);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    if let Some(v) = query.food_id {
        select = select.filter(entity_mod::Column::FoodId.eq(v));
    }
    if let Some(v) = query.nutrient_id {
        select = select.filter(entity_mod::Column::NutrientId.eq(v));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::CreatedAt)
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

    Ok(Json(PaginatedCorrectionResponse {
        data: items.into_iter().map(CorrectionResponse::from).collect(),
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Person - NutritionalIntake - Correction"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CorrectionResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Correction not found"))?;

    Ok(Json(CorrectionResponse::from(item)))
}

#[endpoint(tags("Person - NutritionalIntake - Correction"), status_codes(200, 400, 500))]
pub async fn store(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CorrectionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateCorrectionRequest = req
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
        food_id: Set(payload.food_id),
        nutrient_id: Set(payload.nutrient_id),
        original_value: Set(payload.original_value),
        corrected_value: Set(payload.corrected_value),
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

    Ok(Json(CorrectionResponse::from(item)))
}

#[endpoint(tags("Person - NutritionalIntake - Correction"), status_codes(200, 400, 404, 500))]
pub async fn update(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CorrectionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateCorrectionRequest = req
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
        .ok_or_else(|| StatusError::not_found().brief("Correction not found"))?;

    let mut active_model = existing.into_active_model();
    if let Some(v) = payload.food_id {
        active_model.food_id = Set(v);
    }
    if let Some(v) = payload.nutrient_id {
        active_model.nutrient_id = Set(v);
    }
    if payload.original_value.is_some() {
        active_model.original_value = Set(payload.original_value);
    }
    if payload.corrected_value.is_some() {
        active_model.corrected_value = Set(payload.corrected_value);
    }
    active_model.updated_at = Set(Utc::now().naive_utc());
    active_model.updated_by = Set(auth_user_id(depot));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CorrectionResponse::from(item)))
}

#[endpoint(tags("Person - NutritionalIntake - Correction"), status_codes(200, 400, 404, 500))]
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
        .ok_or_else(|| StatusError::not_found().brief("Correction not found"))?;

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
        message: "Correction deleted successfully".to_string(),
    }))
}
