use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::referensi::wilayah::{
    CreateWilayahRequest, WilayahQuery, WilayahResponse, PaginatedWilayahResponse,
    UpdateWilayahRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::referensi::wilayah as entity_mod;

#[endpoint(tags("Feeder - Referensi - Wilayah"), status_codes(200, 500))]
pub async fn list_wilayah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedWilayahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: WilayahQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| WilayahResponse {
            id: item.id,
            id_level_wilayah: item.id_level_wilayah,
            id_wilayah: item.id_wilayah,
            id_negara: item.id_negara,
            nama_wilayah: item.nama_wilayah,
            id_induk_wilayah: item.id_induk_wilayah,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedWilayahResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Referensi - Wilayah"), status_codes(200, 400, 404, 500))]
pub async fn get_wilayah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<WilayahResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Wilayah not found"))?;

    Ok(Json(WilayahResponse {
            id: item.id,
            id_level_wilayah: item.id_level_wilayah,
            id_wilayah: item.id_wilayah,
            id_negara: item.id_negara,
            nama_wilayah: item.nama_wilayah,
            id_induk_wilayah: item.id_induk_wilayah,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Referensi - Wilayah"), status_codes(200, 400, 500))]
pub async fn create_wilayah(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<WilayahResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateWilayahRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_level_wilayah: Set(payload.id_level_wilayah),
        id_wilayah: Set(payload.id_wilayah),
        id_negara: Set(payload.id_negara),
        nama_wilayah: Set(payload.nama_wilayah),
        id_induk_wilayah: Set(payload.id_induk_wilayah),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(WilayahResponse {
            id: item.id,
            id_level_wilayah: item.id_level_wilayah,
            id_wilayah: item.id_wilayah,
            id_negara: item.id_negara,
            nama_wilayah: item.nama_wilayah,
            id_induk_wilayah: item.id_induk_wilayah,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Referensi - Wilayah"), status_codes(200, 400, 404, 500))]
pub async fn update_wilayah(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<WilayahResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateWilayahRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Wilayah not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_level_wilayah) = payload.id_level_wilayah {
            active_model.id_level_wilayah = Set(Some(id_level_wilayah));
        }
    if let Some(id_wilayah) = payload.id_wilayah {
            active_model.id_wilayah = Set(Some(id_wilayah));
        }
    if let Some(id_negara) = payload.id_negara {
            active_model.id_negara = Set(Some(id_negara));
        }
    if let Some(nama_wilayah) = payload.nama_wilayah {
            active_model.nama_wilayah = Set(Some(nama_wilayah));
        }
    if let Some(id_induk_wilayah) = payload.id_induk_wilayah {
            active_model.id_induk_wilayah = Set(Some(id_induk_wilayah));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(WilayahResponse {
            id: item.id,
            id_level_wilayah: item.id_level_wilayah,
            id_wilayah: item.id_wilayah,
            id_negara: item.id_negara,
            nama_wilayah: item.nama_wilayah,
            id_induk_wilayah: item.id_induk_wilayah,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Referensi - Wilayah"), status_codes(200, 400, 404, 500))]
pub async fn delete_wilayah(
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
            .ok_or_else(|| StatusError::not_found().brief("Wilayah not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Wilayah deleted successfully".to_string(),
        }))
}
