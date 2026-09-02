use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::institution::master::staffes::{
    CreateStaffRequest, StaffQuery, StaffResponse, PaginatedStaffResponse,
    UpdateStaffRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::institution::master::staffes as entity_mod;

#[endpoint(tags("Institution - Master - Staff"), status_codes(200, 500))]
pub async fn list_staffes(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStaffResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: StaffQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    if let Some(unit_id) = query.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| StaffResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            start_date: item.start_date,
            end_date: item.end_date,
            employee_id: item.employee_id,
            unit_id: item.unit_id,
            position_type_id: item.position_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedStaffResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution - Master - Staff"), status_codes(200, 400, 404, 500))]
pub async fn get_staffe(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StaffResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Staff not found"))?;

    Ok(Json(StaffResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            start_date: item.start_date,
            end_date: item.end_date,
            employee_id: item.employee_id,
            unit_id: item.unit_id,
            position_type_id: item.position_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Institution - Master - Staff"), status_codes(200, 400, 500))]
pub async fn create_staffe(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StaffResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateStaffRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        decree_number: Set(payload.decree_number),
        decree_date: Set(payload.decree_date),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        employee_id: Set(payload.employee_id),
        unit_id: Set(payload.unit_id),
        position_type_id: Set(payload.position_type_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(StaffResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            start_date: item.start_date,
            end_date: item.end_date,
            employee_id: item.employee_id,
            unit_id: item.unit_id,
            position_type_id: item.position_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Institution - Master - Staff"), status_codes(200, 400, 404, 500))]
pub async fn update_staffe(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StaffResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateStaffRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Staff not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(decree_number) = payload.decree_number {
            active_model.decree_number = Set(Some(decree_number));
        }
    if let Some(decree_date) = payload.decree_date {
            active_model.decree_date = Set(Some(decree_date));
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    if let Some(employee_id) = payload.employee_id {
            active_model.employee_id = Set(employee_id);
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(unit_id);
        }
    if let Some(position_type_id) = payload.position_type_id {
            active_model.position_type_id = Set(Some(position_type_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(StaffResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            start_date: item.start_date,
            end_date: item.end_date,
            employee_id: item.employee_id,
            unit_id: item.unit_id,
            position_type_id: item.position_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Institution - Master - Staff"), status_codes(200, 400, 404, 500))]
pub async fn delete_staffe(
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
            .ok_or_else(|| StatusError::not_found().brief("Staff not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Staff deleted successfully".to_string(),
        }))
}
