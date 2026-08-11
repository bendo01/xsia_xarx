use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::location::regions::{
    CreateRegionRequest, RegionQuery, RegionResponse, PaginatedRegionResponse,
    UpdateRegionRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::location::regions as regions_mod;

#[endpoint(tags("Location - Region"), status_codes(200, 500))]
pub async fn list_regions(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRegionResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: RegionQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        regions_mod::Entity::find().filter(regions_mod::Column::DeletedAt.is_null());

    if let Some(val) = query.code {
        select = select.filter(regions_mod::Column::Code.eq(val));
    }
    if let Some(ref val) = query.name {
        select = select.filter(regions_mod::Column::Name.contains(val));
    }

    let paginator = select
        .order_by_asc(regions_mod::Column::Code)
        .paginate(db, page_size);

    let total = paginator
        .num_items()
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator
        .fetch_page(page.saturating_sub(1))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(regions_to_response).collect();

    Ok(Json(PaginatedRegionResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Location - Region"), status_codes(200, 400, 404, 500))]
pub async fn get_region(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RegionResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = regions_mod::Entity::find_by_id(id)
        .filter(regions_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Region not found"))?;

    Ok(Json(regions_to_response(item)))
}

#[endpoint(tags("Location - Region"), status_codes(200, 400, 500))]
pub async fn create_region(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RegionResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateRegionRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let new_id = Uuid::new_v4();

    let active_model = regions_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        alphabet_code: Set(payload.alphabet_code),
        name: Set(payload.name),
        slug: Set(payload.slug),
        alt_slug: Set(payload.alt_slug),
        created_at: Set(Some(Utc::now().naive_utc())),
        updated_at: Set(Some(Utc::now().naive_utc())),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(regions_to_response(item)))
}

#[endpoint(tags("Location - Region"), status_codes(200, 400, 404, 500))]
pub async fn update_region(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RegionResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateRegionRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = regions_mod::Entity::find_by_id(id)
        .filter(regions_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Region not found"))?;

    let mut active_model = existing.into_active_model();

    if let Some(val) = payload.code {
        active_model.code = Set(val.into());
    }
    if let Some(val) = payload.alphabet_code {
        active_model.alphabet_code = Set(val.into());
    }
    if let Some(val) = payload.name {
        active_model.name = Set(val.into());
    }
    if let Some(val) = payload.slug {
        active_model.slug = Set(val.into());
    }
    if let Some(val) = payload.alt_slug {
        active_model.alt_slug = Set(val.into());
    }
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(regions_to_response(item)))
}

#[endpoint(tags("Location - Region"), status_codes(200, 400, 404, 500))]
pub async fn delete_region(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = regions_mod::Entity::find_by_id(id)
        .filter(regions_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Region not found"))?;

    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now().naive_utc()));
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Region deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn regions_to_response(item: regions_mod::Model) -> RegionResponse {
    RegionResponse {
        id: item.id,
        code: item.code,
        alphabet_code: item.alphabet_code,
        name: item.name,
        slug: item.slug,
        alt_slug: item.alt_slug,
        created_at: item.created_at,
        updated_at: item.updated_at,
        sync_at: item.sync_at,
        deleted_at: item.deleted_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }
}
