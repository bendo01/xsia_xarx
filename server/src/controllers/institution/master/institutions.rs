use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::institution::master::institutions::{
    CreateInstitutionRequest, InstitutionQuery, InstitutionResponse, PaginatedInstitutionResponse,
    UpdateInstitutionRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::institution::master::institutions as entity_mod;

#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 500))]
pub async fn list_institutions(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedInstitutionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: InstitutionQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedInstitutionResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 404, 500))]
pub async fn get_institution(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<InstitutionResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Institution not found"))?;

    Ok(Json(InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 500))]
pub async fn create_institution(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<InstitutionResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateInstitutionRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        alphabet_code: Set(payload.alphabet_code),
        is_active: Set(payload.is_active),
        variety_id: Set(payload.variety_id),
        category_id: Set(payload.category_id),
        country_id: Set(payload.country_id),
        parent_id: Set(payload.parent_id),
        feeder_id: Set(payload.feeder_id),
        academic_year_id: Set(payload.academic_year_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 404, 500))]
pub async fn update_institution(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<InstitutionResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateInstitutionRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Institution not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(alphabet_code) = payload.alphabet_code {
            active_model.alphabet_code = Set(Some(alphabet_code));
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    if let Some(variety_id) = payload.variety_id {
            active_model.variety_id = Set(variety_id);
        }
    if let Some(category_id) = payload.category_id {
            active_model.category_id = Set(category_id);
        }
    if let Some(country_id) = payload.country_id {
            active_model.country_id = Set(country_id);
        }
    if let Some(parent_id) = payload.parent_id {
            active_model.parent_id = Set(Some(parent_id));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(academic_year_id) = payload.academic_year_id {
            active_model.academic_year_id = Set(Some(academic_year_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 404, 500))]
pub async fn delete_institution(
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
            .ok_or_else(|| StatusError::not_found().brief("Institution not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Institution deleted successfully".to_string(),
        }))
}
