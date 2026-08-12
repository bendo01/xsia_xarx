use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::akumulasi::estimasi::{
    CreateEstimasiRequest, EstimasiQuery, EstimasiResponse, PaginatedEstimasiResponse,
    UpdateEstimasiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::akumulasi::estimasi as entity_mod;

#[endpoint(tags("Feeder - Akumulasi - Estimasi"), status_codes(200, 500))]
pub async fn list_estimasi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEstimasiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: EstimasiQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| EstimasiResponse {
            id: item.id,
            name: item.name.clone(),
            institution_id: item.institution_id,
            total_data_per_request: item.total_data_per_request,
            last_offset: item.last_offset,
            total_data: item.total_data,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedEstimasiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Akumulasi - Estimasi"), status_codes(200, 400, 404, 500))]
pub async fn get_estimasi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EstimasiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Estimasi not found"))?;

    Ok(Json(EstimasiResponse {
            id: item.id,
            name: item.name.clone(),
            institution_id: item.institution_id,
            total_data_per_request: item.total_data_per_request,
            last_offset: item.last_offset,
            total_data: item.total_data,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Akumulasi - Estimasi"), status_codes(200, 400, 500))]
pub async fn create_estimasi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EstimasiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateEstimasiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        institution_id: Set(payload.institution_id),
        total_data_per_request: Set(payload.total_data_per_request),
        last_offset: Set(payload.last_offset),
        total_data: Set(payload.total_data),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EstimasiResponse {
            id: item.id,
            name: item.name.clone(),
            institution_id: item.institution_id,
            total_data_per_request: item.total_data_per_request,
            last_offset: item.last_offset,
            total_data: item.total_data,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Akumulasi - Estimasi"), status_codes(200, 400, 404, 500))]
pub async fn update_estimasi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EstimasiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateEstimasiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Estimasi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(institution_id) = payload.institution_id {
            active_model.institution_id = Set(institution_id);
        }
    if let Some(total_data_per_request) = payload.total_data_per_request {
            active_model.total_data_per_request = Set(Some(total_data_per_request));
        }
    if let Some(last_offset) = payload.last_offset {
            active_model.last_offset = Set(Some(last_offset));
        }
    if let Some(total_data) = payload.total_data {
            active_model.total_data = Set(Some(total_data));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EstimasiResponse {
            id: item.id,
            name: item.name.clone(),
            institution_id: item.institution_id,
            total_data_per_request: item.total_data_per_request,
            last_offset: item.last_offset,
            total_data: item.total_data,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Akumulasi - Estimasi"), status_codes(200, 400, 404, 500))]
pub async fn delete_estimasi(
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
            .ok_or_else(|| StatusError::not_found().brief("Estimasi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Estimasi deleted successfully".to_string(),
        }))
}
