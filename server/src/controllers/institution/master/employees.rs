use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::common::reference::MessageResponse;
use crate::dtos::institution::master::employees::{
    CreateEmployeRequest, EmployeQuery, PaginatedEmployeResponse,
    EmployeResponse, UpdateEmployeRequest,
};
use crate::models::institution::master::employees as entity_mod;

#[endpoint(tags("Institution Master - Employe"), status_codes(200, 500))]
pub async fn list_employees(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEmployeResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: EmployeQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
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

    let data = items.into_iter().map(to_response).collect();

    Ok(Json(PaginatedEmployeResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution Master - Employe"), status_codes(200, 400, 404, 500))]
pub async fn get_employe(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EmployeResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Employe not found"))?;

    Ok(Json(to_response(item)))
}

#[endpoint(tags("Institution Master - Employe"), status_codes(200, 400, 500))]
pub async fn create_employe(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EmployeResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateEmployeRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        institution_id: Set(payload.institution_id),
        individual_id: Set(payload.individual_id),
        decree_number: Set(payload.decree_number),
        decree_date: Set(payload.decree_date),
        is_active: Set(payload.is_active),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(to_response(item)))
}

#[endpoint(tags("Institution Master - Employe"), status_codes(200, 400, 404, 500))]
pub async fn update_employe(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EmployeResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateEmployeRequest = req
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
        .ok_or_else(|| StatusError::not_found().brief("Employe not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(val) = payload.code {
        active_model.code = Set(val);
    }
    if let Some(val) = payload.name {
        active_model.name = Set(val);
    }
    if let Some(val) = payload.institution_id {
        active_model.institution_id = Set(val);
    }
    if let Some(val) = payload.individual_id {
        active_model.individual_id = Set(val);
    }
    if let Some(val) = payload.decree_number {
        active_model.decree_number = Set(Some(val));
    }
    if let Some(val) = payload.decree_date {
        active_model.decree_date = Set(Some(val));
    }
    if let Some(val) = payload.is_active {
        active_model.is_active = Set(val);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(to_response(item)))
}

#[endpoint(tags("Institution Master - Employe"), status_codes(200, 400, 404, 500))]
pub async fn delete_employe(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Employe not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now().naive_utc()));
    active_model.updated_at = Set(Some(now));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Employe deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn to_response(item: entity_mod::Model) -> EmployeResponse {
    EmployeResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        institution_id: item.institution_id,
        individual_id: item.individual_id,
        decree_number: item.decree_number,
        decree_date: item.decree_date,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }
}
