use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::location::sub_districts::{
    CreateSubDistrictRequest, SubDistrictQuery, SubDistrictResponse, PaginatedSubDistrictResponse,
    UpdateSubDistrictRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::location::sub_districts as sub_districts_mod;

#[endpoint(tags("Location - SubDistrict"), status_codes(200, 500))]
pub async fn list_sub_districts(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedSubDistrictResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: SubDistrictQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        sub_districts_mod::Entity::find().filter(sub_districts_mod::Column::DeletedAt.is_null());

    if let Some(val) = query.code {
        select = select.filter(sub_districts_mod::Column::Code.eq(val));
    }
    if let Some(ref val) = query.name {
        select = select.filter(sub_districts_mod::Column::Name.contains(val));
    }
    if let Some(val) = query.regency_id {
        select = select.filter(sub_districts_mod::Column::RegencyId.eq(val));
    }
    if let Some(val) = query.validation_code {
        select = select.filter(sub_districts_mod::Column::ValidationCode.eq(val));
    }

    let paginator = select
        .order_by_asc(sub_districts_mod::Column::Code)
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

    let data = items.into_iter().map(sub_districts_to_response).collect();

    Ok(Json(PaginatedSubDistrictResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Location - SubDistrict"), status_codes(200, 400, 404, 500))]
pub async fn get_subdistrict(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubDistrictResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = sub_districts_mod::Entity::find_by_id(id)
        .filter(sub_districts_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("SubDistrict not found"))?;

    Ok(Json(sub_districts_to_response(item)))
}

#[endpoint(tags("Location - SubDistrict"), status_codes(200, 400, 500))]
pub async fn create_subdistrict(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubDistrictResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateSubDistrictRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let new_id = Uuid::new_v4();

    let active_model = sub_districts_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        dikti_code: Set(payload.dikti_code),
        regency_id: Set(payload.regency_id),
        slug: Set(payload.slug),
        alt_slug: Set(payload.alt_slug),
        state_ministry_code: Set(payload.state_ministry_code),
        state_ministry_full_code: Set(payload.state_ministry_full_code),
        state_post_department_code: Set(payload.state_post_department_code),
        state_ministry_name: Set(payload.state_ministry_name),
        dikti_name: Set(payload.dikti_name),
        validation_code: Set(payload.validation_code),
        agriculture_department_name: Set(payload.agriculture_department_name),
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

    Ok(Json(sub_districts_to_response(item)))
}

#[endpoint(tags("Location - SubDistrict"), status_codes(200, 400, 404, 500))]
pub async fn update_subdistrict(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubDistrictResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateSubDistrictRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = sub_districts_mod::Entity::find_by_id(id)
        .filter(sub_districts_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("SubDistrict not found"))?;

    let mut active_model = existing.into_active_model();

    if let Some(val) = payload.code {
        active_model.code = Set(val.into());
    }
    if let Some(val) = payload.name {
        active_model.name = Set(val.into());
    }
    if let Some(val) = payload.dikti_code {
        active_model.dikti_code = Set(val.into());
    }
    if let Some(val) = payload.regency_id {
        active_model.regency_id = Set(val.into());
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
    if let Some(val) = payload.state_ministry_full_code {
        active_model.state_ministry_full_code = Set(val.into());
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
    if let Some(val) = payload.validation_code {
        active_model.validation_code = Set(val.into());
    }
    if let Some(val) = payload.agriculture_department_name {
        active_model.agriculture_department_name = Set(val.into());
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

    Ok(Json(sub_districts_to_response(item)))
}

#[endpoint(tags("Location - SubDistrict"), status_codes(200, 400, 404, 500))]
pub async fn delete_subdistrict(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = sub_districts_mod::Entity::find_by_id(id)
        .filter(sub_districts_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("SubDistrict not found"))?;

    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now().naive_utc()));
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "SubDistrict deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn sub_districts_to_response(item: sub_districts_mod::Model) -> SubDistrictResponse {
    SubDistrictResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        dikti_code: item.dikti_code,
        regency_id: item.regency_id,
        slug: item.slug,
        alt_slug: item.alt_slug,
        state_ministry_code: item.state_ministry_code,
        state_ministry_full_code: item.state_ministry_full_code,
        state_post_department_code: item.state_post_department_code,
        state_ministry_name: item.state_ministry_name,
        dikti_name: item.dikti_name,
        validation_code: item.validation_code,
        agriculture_department_name: item.agriculture_department_name,
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
