use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::referensi::pangkat_golongan::{
    CreatePangkatGolonganRequest, PangkatGolonganQuery, PangkatGolonganResponse, PaginatedPangkatGolonganResponse,
    UpdatePangkatGolonganRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::referensi::pangkat_golongan as entity_mod;

#[endpoint(tags("Feeder - Referensi - PangkatGolongan"), status_codes(200, 500))]
pub async fn list_pangkat_golongan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPangkatGolonganResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PangkatGolonganQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PangkatGolonganResponse {
            id: item.id,
            id_pangkat_golongan: item.id_pangkat_golongan,
            kode_golongan: item.kode_golongan,
            nama_pangkat: item.nama_pangkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedPangkatGolonganResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Referensi - PangkatGolongan"), status_codes(200, 400, 404, 500))]
pub async fn get_pangkat_golongan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PangkatGolonganResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PangkatGolongan not found"))?;

    Ok(Json(PangkatGolonganResponse {
            id: item.id,
            id_pangkat_golongan: item.id_pangkat_golongan,
            kode_golongan: item.kode_golongan,
            nama_pangkat: item.nama_pangkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Referensi - PangkatGolongan"), status_codes(200, 400, 500))]
pub async fn create_pangkat_golongan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PangkatGolonganResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreatePangkatGolonganRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_pangkat_golongan: Set(payload.id_pangkat_golongan),
        kode_golongan: Set(payload.kode_golongan),
        nama_pangkat: Set(payload.nama_pangkat),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PangkatGolonganResponse {
            id: item.id,
            id_pangkat_golongan: item.id_pangkat_golongan,
            kode_golongan: item.kode_golongan,
            nama_pangkat: item.nama_pangkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Referensi - PangkatGolongan"), status_codes(200, 400, 404, 500))]
pub async fn update_pangkat_golongan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PangkatGolonganResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdatePangkatGolonganRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("PangkatGolongan not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_pangkat_golongan) = payload.id_pangkat_golongan {
        active_model.id_pangkat_golongan = Set(Some(id_pangkat_golongan));
    }
    if let Some(kode_golongan) = payload.kode_golongan {
        active_model.kode_golongan = Set(Some(kode_golongan));
    }
    if let Some(nama_pangkat) = payload.nama_pangkat {
        active_model.nama_pangkat = Set(Some(nama_pangkat));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PangkatGolonganResponse {
            id: item.id,
            id_pangkat_golongan: item.id_pangkat_golongan,
            kode_golongan: item.kode_golongan,
            nama_pangkat: item.nama_pangkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Referensi - PangkatGolongan"), status_codes(200, 400, 404, 500))]
pub async fn delete_pangkat_golongan(
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
        .ok_or_else(|| StatusError::not_found().brief("PangkatGolongan not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "PangkatGolongan deleted successfully".to_string(),
    }))
}
