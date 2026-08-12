use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::institution::master::units::{
    CreateUnitRequest, UnitQuery, UnitResponse, PaginatedUnitResponse,
    UpdateUnitRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::institution::master::units as entity_mod;

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 500))]
pub async fn list_units(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedUnitResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: UnitQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedUnitResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_unit(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

    Ok(Json(UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 500))]
pub async fn create_unit(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UnitResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateUnitRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        is_active: Set(payload.is_active),
        unit_type_id: Set(payload.unit_type_id),
        institution_id: Set(payload.institution_id),
        parent_id: Set(payload.parent_id),
        education_id: Set(payload.education_id),
        feeder_id: Set(payload.feeder_id),
        lft: Set(payload.lft),
        rght: Set(payload.rght),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn update_unit(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UnitResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateUnitRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    if let Some(unit_type_id) = payload.unit_type_id {
            active_model.unit_type_id = Set(unit_type_id);
        }
    if let Some(institution_id) = payload.institution_id {
            active_model.institution_id = Set(institution_id);
        }
    if let Some(parent_id) = payload.parent_id {
            active_model.parent_id = Set(Some(parent_id));
        }
    if let Some(education_id) = payload.education_id {
            active_model.education_id = Set(education_id);
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(lft) = payload.lft {
            active_model.lft = Set(Some(lft));
        }
    if let Some(rght) = payload.rght {
            active_model.rght = Set(Some(rght));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn delete_unit(
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
            .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Unit deleted successfully".to_string(),
        }))
}
