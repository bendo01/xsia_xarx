use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::location::villages::{
    CreateVillageRequest, VillageQuery, VillageResponse, PaginatedVillageResponse,
    UpdateVillageRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::location::villages as villages_mod;

#[endpoint(tags("Location - Village"), status_codes(200, 500))]
pub async fn list_villages(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedVillageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: VillageQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        villages_mod::Entity::find().filter(villages_mod::Column::DeletedAt.is_null());

    if let Some(val) = query.code {
        select = select.filter(villages_mod::Column::Code.eq(val));
    }
    if let Some(ref val) = query.name {
        select = select.filter(villages_mod::Column::Name.contains(val));
    }
    if let Some(val) = query.sub_district_id {
        select = select.filter(villages_mod::Column::SubDistrictId.eq(val));
    }

    let paginator = select
        .order_by_asc(villages_mod::Column::Code)
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

    let data = items.into_iter().map(villages_to_response).collect();

    Ok(Json(PaginatedVillageResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Location - Village"), status_codes(200, 400, 404, 500))]
pub async fn get_village(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<VillageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = villages_mod::Entity::find_by_id(id)
        .filter(villages_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Village not found"))?;

    Ok(Json(villages_to_response(item)))
}

#[endpoint(tags("Location - Village"), status_codes(200, 400, 500))]
pub async fn create_village(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<VillageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateVillageRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now();
    let new_id = Uuid::new_v4();

    let active_model = villages_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        sub_district_id: Set(payload.sub_district_id),
        slug: Set(payload.slug),
        alt_slug: Set(payload.alt_slug),
        state_ministry_code: Set(payload.state_ministry_code),
        state_post_department_code: Set(payload.state_post_department_code),
        state_ministry_name: Set(payload.state_ministry_name),
        dikti_name: Set(payload.dikti_name),
        dikti_code: Set(payload.dikti_code),
        latitude: Set(payload.latitude),
        longitude: Set(payload.longitude),
        zoom: Set(payload.zoom),
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

    Ok(Json(villages_to_response(item)))
}

#[endpoint(tags("Location - Village"), status_codes(200, 400, 404, 500))]
pub async fn update_village(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<VillageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateVillageRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = villages_mod::Entity::find_by_id(id)
        .filter(villages_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Village not found"))?;

    let mut active_model = existing.into_active_model();

    if let Some(val) = payload.code {
        active_model.code = Set(val.into());
    }
    if let Some(val) = payload.name {
        active_model.name = Set(val.into());
    }
    if let Some(val) = payload.sub_district_id {
        active_model.sub_district_id = Set(val.into());
    }
    if let Some(val) = payload.slug {
        active_model.slug = Set(val.into());
    }
    if let Some(val) = payload.alt_slug {
        active_model.alt_slug = Set(val.into());
    }
    if let Some(val) = payload.state_ministry_code {
        active_model.state_ministry_code = Set(val.into());
    }
    if let Some(val) = payload.state_post_department_code {
        active_model.state_post_department_code = Set(val.into());
    }
    if let Some(val) = payload.state_ministry_name {
        active_model.state_ministry_name = Set(val.into());
    }
    if let Some(val) = payload.dikti_name {
        active_model.dikti_name = Set(val.into());
    }
    if let Some(val) = payload.dikti_code {
        active_model.dikti_code = Set(val.into());
    }
    if let Some(val) = payload.latitude {
        active_model.latitude = Set(val.into());
    }
    if let Some(val) = payload.longitude {
        active_model.longitude = Set(val.into());
    }
    if let Some(val) = payload.zoom {
        active_model.zoom = Set(val.into());
    }
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(villages_to_response(item)))
}

#[endpoint(tags("Location - Village"), status_codes(200, 400, 404, 500))]
pub async fn delete_village(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = villages_mod::Entity::find_by_id(id)
        .filter(villages_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Village not found"))?;

    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now().naive_utc()));
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Village deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn villages_to_response(item: villages_mod::Model) -> VillageResponse {
    VillageResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        sub_district_id: item.sub_district_id,
        slug: item.slug,
        alt_slug: item.alt_slug,
        state_ministry_code: item.state_ministry_code,
        state_post_department_code: item.state_post_department_code,
        state_ministry_name: item.state_ministry_name,
        dikti_name: item.dikti_name,
        dikti_code: item.dikti_code,
        latitude: item.latitude,
        longitude: item.longitude,
        zoom: item.zoom,
        created_at: item.created_at,
        updated_at: item.updated_at,
        sync_at: item.sync_at,
        deleted_at: item.deleted_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }
}
