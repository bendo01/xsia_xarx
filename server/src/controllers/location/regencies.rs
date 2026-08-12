use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::location::regencies::{
    CreateRegenciRequest, RegenciQuery, RegenciResponse, PaginatedRegenciResponse,
    UpdateRegenciRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::location::regencies as entity_mod;

#[endpoint(tags("Location -  - Regenci"), status_codes(200, 500))]
pub async fn list_regencies(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRegenciResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RegenciQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RegenciResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            dikti_code: item.dikti_code,
            epsbed_code: item.epsbed_code,
            province_id: item.province_id,
            regency_type_id: item.regency_type_id,
            slug: item.slug,
            description: item.description,
            alt_slug: item.alt_slug,
            state_ministry_code: item.state_ministry_code,
            state_ministry_full_code: item.state_ministry_full_code,
            state_post_department_code: item.state_post_department_code,
            state_ministry_name: item.state_ministry_name,
            dikti_name: item.dikti_name,
            validation_code: item.validation_code,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedRegenciResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Location -  - Regenci"), status_codes(200, 400, 404, 500))]
pub async fn get_regencie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RegenciResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Regenci not found"))?;

    Ok(Json(RegenciResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            dikti_code: item.dikti_code,
            epsbed_code: item.epsbed_code,
            province_id: item.province_id,
            regency_type_id: item.regency_type_id,
            slug: item.slug,
            description: item.description,
            alt_slug: item.alt_slug,
            state_ministry_code: item.state_ministry_code,
            state_ministry_full_code: item.state_ministry_full_code,
            state_post_department_code: item.state_post_department_code,
            state_ministry_name: item.state_ministry_name,
            dikti_name: item.dikti_name,
            validation_code: item.validation_code,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Location -  - Regenci"), status_codes(200, 400, 500))]
pub async fn create_regencie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RegenciResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRegenciRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        dikti_code: Set(payload.dikti_code),
        epsbed_code: Set(payload.epsbed_code),
        province_id: Set(payload.province_id),
        regency_type_id: Set(payload.regency_type_id),
        slug: Set(payload.slug),
        description: Set(payload.description),
        alt_slug: Set(payload.alt_slug),
        state_ministry_code: Set(payload.state_ministry_code),
        state_ministry_full_code: Set(payload.state_ministry_full_code),
        state_post_department_code: Set(payload.state_post_department_code),
        state_ministry_name: Set(payload.state_ministry_name),
        dikti_name: Set(payload.dikti_name),
        validation_code: Set(payload.validation_code),
        latitude: Set(payload.latitude),
        longitude: Set(payload.longitude),
        zoom: Set(payload.zoom),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RegenciResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            dikti_code: item.dikti_code,
            epsbed_code: item.epsbed_code,
            province_id: item.province_id,
            regency_type_id: item.regency_type_id,
            slug: item.slug,
            description: item.description,
            alt_slug: item.alt_slug,
            state_ministry_code: item.state_ministry_code,
            state_ministry_full_code: item.state_ministry_full_code,
            state_post_department_code: item.state_post_department_code,
            state_ministry_name: item.state_ministry_name,
            dikti_name: item.dikti_name,
            validation_code: item.validation_code,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Location -  - Regenci"), status_codes(200, 400, 404, 500))]
pub async fn update_regencie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RegenciResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRegenciRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Regenci not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(dikti_code) = payload.dikti_code {
            active_model.dikti_code = Set(Some(dikti_code));
        }
    if let Some(epsbed_code) = payload.epsbed_code {
            active_model.epsbed_code = Set(Some(epsbed_code));
        }
    if let Some(province_id) = payload.province_id {
            active_model.province_id = Set(province_id);
        }
    if let Some(regency_type_id) = payload.regency_type_id {
            active_model.regency_type_id = Set(regency_type_id);
        }
    if let Some(slug) = payload.slug {
            active_model.slug = Set(Some(slug));
        }
    if let Some(description) = payload.description {
            active_model.description = Set(Some(description));
        }
    if let Some(alt_slug) = payload.alt_slug {
            active_model.alt_slug = Set(Some(alt_slug));
        }
    if let Some(state_ministry_code) = payload.state_ministry_code {
            active_model.state_ministry_code = Set(Some(state_ministry_code));
        }
    if let Some(state_ministry_full_code) = payload.state_ministry_full_code {
            active_model.state_ministry_full_code = Set(Some(state_ministry_full_code));
        }
    if let Some(state_post_department_code) = payload.state_post_department_code {
            active_model.state_post_department_code = Set(Some(state_post_department_code));
        }
    if let Some(state_ministry_name) = payload.state_ministry_name {
            active_model.state_ministry_name = Set(Some(state_ministry_name));
        }
    if let Some(dikti_name) = payload.dikti_name {
            active_model.dikti_name = Set(Some(dikti_name));
        }
    if let Some(validation_code) = payload.validation_code {
            active_model.validation_code = Set(Some(validation_code));
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

        Ok(Json(RegenciResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            dikti_code: item.dikti_code,
            epsbed_code: item.epsbed_code,
            province_id: item.province_id,
            regency_type_id: item.regency_type_id,
            slug: item.slug,
            description: item.description,
            alt_slug: item.alt_slug,
            state_ministry_code: item.state_ministry_code,
            state_ministry_full_code: item.state_ministry_full_code,
            state_post_department_code: item.state_post_department_code,
            state_ministry_name: item.state_ministry_name,
            dikti_name: item.dikti_name,
            validation_code: item.validation_code,
            latitude: item.latitude,
            longitude: item.longitude,
            zoom: item.zoom,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Location -  - Regenci"), status_codes(200, 400, 404, 500))]
pub async fn delete_regencie(
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
            .ok_or_else(|| StatusError::not_found().brief("Regenci not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Regenci deleted successfully".to_string(),
        }))
}
