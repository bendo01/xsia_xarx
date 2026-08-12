use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::perguruan_tinggi::{
    CreatePerguruanTinggiRequest, PerguruanTinggiQuery, PerguruanTinggiResponse, PaginatedPerguruanTinggiResponse,
    UpdatePerguruanTinggiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::perguruan_tinggi as entity_mod;

#[endpoint(tags("Feeder - Master - PerguruanTinggi"), status_codes(200, 500))]
pub async fn list_perguruan_tinggi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPerguruanTinggiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PerguruanTinggiQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            nama_singkat: item.nama_singkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedPerguruanTinggiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - PerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn get_perguruan_tinggi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PerguruanTinggiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PerguruanTinggi not found"))?;

    Ok(Json(PerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            nama_singkat: item.nama_singkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - PerguruanTinggi"), status_codes(200, 400, 500))]
pub async fn create_perguruan_tinggi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PerguruanTinggiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreatePerguruanTinggiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        kode_perguruan_tinggi: Set(payload.kode_perguruan_tinggi),
        nama_perguruan_tinggi: Set(payload.nama_perguruan_tinggi),
        nama_singkat: Set(payload.nama_singkat),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            nama_singkat: item.nama_singkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - PerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn update_perguruan_tinggi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PerguruanTinggiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdatePerguruanTinggiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("PerguruanTinggi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_perguruan_tinggi) = payload.id_perguruan_tinggi {
            active_model.id_perguruan_tinggi = Set(Some(id_perguruan_tinggi));
        }
    if let Some(kode_perguruan_tinggi) = payload.kode_perguruan_tinggi {
            active_model.kode_perguruan_tinggi = Set(Some(kode_perguruan_tinggi));
        }
    if let Some(nama_perguruan_tinggi) = payload.nama_perguruan_tinggi {
            active_model.nama_perguruan_tinggi = Set(Some(nama_perguruan_tinggi));
        }
    if let Some(nama_singkat) = payload.nama_singkat {
            active_model.nama_singkat = Set(Some(nama_singkat));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            nama_singkat: item.nama_singkat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - PerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn delete_perguruan_tinggi(
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
            .ok_or_else(|| StatusError::not_found().brief("PerguruanTinggi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "PerguruanTinggi deleted successfully".to_string(),
        }))
}
