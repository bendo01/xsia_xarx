use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::contact::master::residences::{
    CreateResidenceRequest, ResidenceQuery, ResidenceResponse, PaginatedResidenceResponse,
    UpdateResidenceRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::contact::master::residences as entity_mod;

#[endpoint(tags("Contact - Master - Residence"), status_codes(200, 500))]
pub async fn list_residences(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedResidenceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ResidenceQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| ResidenceResponse {
            id: item.id,
            street: item.street.clone(),
            citizens_association: item.citizens_association,
            neighborhood_association: item.neighborhood_association,
            province_id: item.province_id,
            regency_id: item.regency_id,
            sub_district_id: item.sub_district_id,
            village_id: item.village_id,
            residence_type_id: item.residence_type_id,
            residenceable_type: item.residenceable_type,
            residenceable_id: item.residenceable_id,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedResidenceResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Contact - Master - Residence"), status_codes(200, 400, 404, 500))]
pub async fn get_residence(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ResidenceResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Residence not found"))?;

    Ok(Json(ResidenceResponse {
            id: item.id,
            street: item.street.clone(),
            citizens_association: item.citizens_association,
            neighborhood_association: item.neighborhood_association,
            province_id: item.province_id,
            regency_id: item.regency_id,
            sub_district_id: item.sub_district_id,
            village_id: item.village_id,
            residence_type_id: item.residence_type_id,
            residenceable_type: item.residenceable_type,
            residenceable_id: item.residenceable_id,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Contact - Master - Residence"), status_codes(200, 400, 500))]
pub async fn create_residence(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ResidenceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateResidenceRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        street: Set(payload.street),
        citizens_association: Set(payload.citizens_association),
        neighborhood_association: Set(payload.neighborhood_association),
        province_id: Set(payload.province_id),
        regency_id: Set(payload.regency_id),
        sub_district_id: Set(payload.sub_district_id),
        village_id: Set(payload.village_id),
        residence_type_id: Set(payload.residence_type_id),
        residenceable_type: Set(payload.residenceable_type),
        residenceable_id: Set(payload.residenceable_id),
        latitude: Set(payload.latitude),
        longitude: Set(payload.longitude),
        zoom: Set(payload.zoom),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ResidenceResponse {
            id: item.id,
            street: item.street.clone(),
            citizens_association: item.citizens_association,
            neighborhood_association: item.neighborhood_association,
            province_id: item.province_id,
            regency_id: item.regency_id,
            sub_district_id: item.sub_district_id,
            village_id: item.village_id,
            residence_type_id: item.residence_type_id,
            residenceable_type: item.residenceable_type,
            residenceable_id: item.residenceable_id,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Contact - Master - Residence"), status_codes(200, 400, 404, 500))]
pub async fn update_residence(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ResidenceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateResidenceRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Residence not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(street) = payload.street {
        active_model.street = Set(street);
    }
    if let Some(citizens_association) = payload.citizens_association {
        active_model.citizens_association = Set(citizens_association);
    }
    if let Some(neighborhood_association) = payload.neighborhood_association {
        active_model.neighborhood_association = Set(neighborhood_association);
    }
    if let Some(province_id) = payload.province_id {
        active_model.province_id = Set(Some(province_id));
    }
    if let Some(regency_id) = payload.regency_id {
        active_model.regency_id = Set(Some(regency_id));
    }
    if let Some(sub_district_id) = payload.sub_district_id {
        active_model.sub_district_id = Set(Some(sub_district_id));
    }
    if let Some(village_id) = payload.village_id {
        active_model.village_id = Set(Some(village_id));
    }
    if let Some(residence_type_id) = payload.residence_type_id {
        active_model.residence_type_id = Set(Some(residence_type_id));
    }
    if let Some(residenceable_type) = payload.residenceable_type {
        active_model.residenceable_type = Set(Some(residenceable_type));
    }
    if let Some(residenceable_id) = payload.residenceable_id {
        active_model.residenceable_id = Set(Some(residenceable_id));
    }
    if let Some(latitude) = payload.latitude {
        active_model.latitude = Set(Some(latitude));
    }
    if let Some(longitude) = payload.longitude {
        active_model.longitude = Set(Some(longitude));
    }
    if let Some(zoom) = payload.zoom {
        active_model.zoom = Set(Some(zoom));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ResidenceResponse {
            id: item.id,
            street: item.street.clone(),
            citizens_association: item.citizens_association,
            neighborhood_association: item.neighborhood_association,
            province_id: item.province_id,
            regency_id: item.regency_id,
            sub_district_id: item.sub_district_id,
            village_id: item.village_id,
            residence_type_id: item.residence_type_id,
            residenceable_type: item.residenceable_type,
            residenceable_id: item.residenceable_id,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at.map(|dt| dt),
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Contact - Master - Residence"), status_codes(200, 400, 404, 500))]
pub async fn delete_residence(
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
        .ok_or_else(|| StatusError::not_found().brief("Residence not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Residence deleted successfully".to_string(),
    }))
}
