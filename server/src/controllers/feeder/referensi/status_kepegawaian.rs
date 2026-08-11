use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::referensi::status_kepegawaian::{
    CreateStatusKepegawaianRequest, StatusKepegawaianQuery, StatusKepegawaianResponse, PaginatedStatusKepegawaianResponse,
    UpdateStatusKepegawaianRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::referensi::status_kepegawaian as entity_mod;

#[endpoint(tags("Feeder - Referensi - StatusKepegawaian"), status_codes(200, 500))]
pub async fn list_status_kepegawaian(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStatusKepegawaianResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: StatusKepegawaianQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| StatusKepegawaianResponse {
            id: item.id,
            nama_status_pegawai: item.nama_status_pegawai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_status_pegawai: item.id_status_pegawai,

    }).collect();

    Ok(Json(PaginatedStatusKepegawaianResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Referensi - StatusKepegawaian"), status_codes(200, 400, 404, 500))]
pub async fn get_status_kepegawaian(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StatusKepegawaianResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("StatusKepegawaian not found"))?;

    Ok(Json(StatusKepegawaianResponse {
            id: item.id,
            nama_status_pegawai: item.nama_status_pegawai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_status_pegawai: item.id_status_pegawai,

    }))
}

#[endpoint(tags("Feeder - Referensi - StatusKepegawaian"), status_codes(200, 400, 500))]
pub async fn create_status_kepegawaian(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StatusKepegawaianResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateStatusKepegawaianRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        nama_status_pegawai: Set(payload.nama_status_pegawai),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_status_pegawai: Set(payload.id_status_pegawai),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(StatusKepegawaianResponse {
            id: item.id,
            nama_status_pegawai: item.nama_status_pegawai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_status_pegawai: item.id_status_pegawai,

    }))
}

#[endpoint(tags("Feeder - Referensi - StatusKepegawaian"), status_codes(200, 400, 404, 500))]
pub async fn update_status_kepegawaian(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StatusKepegawaianResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateStatusKepegawaianRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("StatusKepegawaian not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(nama_status_pegawai) = payload.nama_status_pegawai {
        active_model.nama_status_pegawai = Set(Some(nama_status_pegawai));
    }
    if let Some(id_status_pegawai) = payload.id_status_pegawai {
        active_model.id_status_pegawai = Set(Some(id_status_pegawai));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(StatusKepegawaianResponse {
            id: item.id,
            nama_status_pegawai: item.nama_status_pegawai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_status_pegawai: item.id_status_pegawai,

    }))
}

#[endpoint(tags("Feeder - Referensi - StatusKepegawaian"), status_codes(200, 400, 404, 500))]
pub async fn delete_status_kepegawaian(
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
        .ok_or_else(|| StatusError::not_found().brief("StatusKepegawaian not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "StatusKepegawaian deleted successfully".to_string(),
    }))
}
