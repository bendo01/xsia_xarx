use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::referensi::jenis_keluar::{
    CreateJenisKeluarRequest, JenisKeluarQuery, JenisKeluarResponse, PaginatedJenisKeluarResponse,
    UpdateJenisKeluarRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::referensi::jenis_keluar as entity_mod;

#[endpoint(tags("Feeder - Referensi - JenisKeluar"), status_codes(200, 500))]
pub async fn list_jenis_keluar(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedJenisKeluarResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: JenisKeluarQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| JenisKeluarResponse {
            id: item.id,
            id_jenis_keluar: item.id_jenis_keluar,
            jenis_keluar: item.jenis_keluar,
            apa_mahasiswa: item.apa_mahasiswa,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedJenisKeluarResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Referensi - JenisKeluar"), status_codes(200, 400, 404, 500))]
pub async fn get_jenis_keluar(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<JenisKeluarResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("JenisKeluar not found"))?;

    Ok(Json(JenisKeluarResponse {
            id: item.id,
            id_jenis_keluar: item.id_jenis_keluar,
            jenis_keluar: item.jenis_keluar,
            apa_mahasiswa: item.apa_mahasiswa,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Referensi - JenisKeluar"), status_codes(200, 400, 500))]
pub async fn create_jenis_keluar(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<JenisKeluarResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateJenisKeluarRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_jenis_keluar: Set(payload.id_jenis_keluar),
        jenis_keluar: Set(payload.jenis_keluar),
        apa_mahasiswa: Set(payload.apa_mahasiswa),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(JenisKeluarResponse {
            id: item.id,
            id_jenis_keluar: item.id_jenis_keluar,
            jenis_keluar: item.jenis_keluar,
            apa_mahasiswa: item.apa_mahasiswa,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Referensi - JenisKeluar"), status_codes(200, 400, 404, 500))]
pub async fn update_jenis_keluar(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<JenisKeluarResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateJenisKeluarRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("JenisKeluar not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_jenis_keluar) = payload.id_jenis_keluar {
            active_model.id_jenis_keluar = Set(Some(id_jenis_keluar));
        }
    if let Some(jenis_keluar) = payload.jenis_keluar {
            active_model.jenis_keluar = Set(Some(jenis_keluar));
        }
    if let Some(apa_mahasiswa) = payload.apa_mahasiswa {
            active_model.apa_mahasiswa = Set(Some(apa_mahasiswa));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(JenisKeluarResponse {
            id: item.id,
            id_jenis_keluar: item.id_jenis_keluar,
            jenis_keluar: item.jenis_keluar,
            apa_mahasiswa: item.apa_mahasiswa,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Referensi - JenisKeluar"), status_codes(200, 400, 404, 500))]
pub async fn delete_jenis_keluar(
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
            .ok_or_else(|| StatusError::not_found().brief("JenisKeluar not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "JenisKeluar deleted successfully".to_string(),
        }))
}
