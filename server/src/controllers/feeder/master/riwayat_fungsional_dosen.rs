use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::riwayat_fungsional_dosen::{
    CreateRiwayatFungsionalDosenRequest, RiwayatFungsionalDosenQuery, RiwayatFungsionalDosenResponse, PaginatedRiwayatFungsionalDosenResponse,
    UpdateRiwayatFungsionalDosenRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::riwayat_fungsional_dosen as entity_mod;

#[endpoint(tags("Feeder - Master - RiwayatFungsionalDosen"), status_codes(200, 500))]
pub async fn list_riwayat_fungsional_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRiwayatFungsionalDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RiwayatFungsionalDosenQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RiwayatFungsionalDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_jabatan_fungsional: item.id_jabatan_fungsional,
            nama_jabatan_fungsional: item.nama_jabatan_fungsional,
            sk_jabatan_fungsional: item.sk_jabatan_fungsional,
            mulai_sk_jabatan: item.mulai_sk_jabatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }).collect();

    Ok(Json(PaginatedRiwayatFungsionalDosenResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - RiwayatFungsionalDosen"), status_codes(200, 400, 404, 500))]
pub async fn get_riwayat_fungsional_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatFungsionalDosenResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("RiwayatFungsionalDosen not found"))?;

    Ok(Json(RiwayatFungsionalDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_jabatan_fungsional: item.id_jabatan_fungsional,
            nama_jabatan_fungsional: item.nama_jabatan_fungsional,
            sk_jabatan_fungsional: item.sk_jabatan_fungsional,
            mulai_sk_jabatan: item.mulai_sk_jabatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }))
}

#[endpoint(tags("Feeder - Master - RiwayatFungsionalDosen"), status_codes(200, 400, 500))]
pub async fn create_riwayat_fungsional_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatFungsionalDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateRiwayatFungsionalDosenRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_dosen: Set(payload.id_dosen),
        nidn: Set(payload.nidn),
        nama_dosen: Set(payload.nama_dosen),
        id_jabatan_fungsional: Set(payload.id_jabatan_fungsional),
        nama_jabatan_fungsional: Set(payload.nama_jabatan_fungsional),
        sk_jabatan_fungsional: Set(payload.sk_jabatan_fungsional),
        mulai_sk_jabatan: Set(payload.mulai_sk_jabatan),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        nuptk: Set(payload.nuptk),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(RiwayatFungsionalDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_jabatan_fungsional: item.id_jabatan_fungsional,
            nama_jabatan_fungsional: item.nama_jabatan_fungsional,
            sk_jabatan_fungsional: item.sk_jabatan_fungsional,
            mulai_sk_jabatan: item.mulai_sk_jabatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }))
}

#[endpoint(tags("Feeder - Master - RiwayatFungsionalDosen"), status_codes(200, 400, 404, 500))]
pub async fn update_riwayat_fungsional_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatFungsionalDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateRiwayatFungsionalDosenRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("RiwayatFungsionalDosen not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_dosen) = payload.id_dosen {
        active_model.id_dosen = Set(Some(id_dosen));
    }
    if let Some(nidn) = payload.nidn {
        active_model.nidn = Set(Some(nidn));
    }
    if let Some(nama_dosen) = payload.nama_dosen {
        active_model.nama_dosen = Set(Some(nama_dosen));
    }
    if let Some(id_jabatan_fungsional) = payload.id_jabatan_fungsional {
        active_model.id_jabatan_fungsional = Set(Some(id_jabatan_fungsional));
    }
    if let Some(nama_jabatan_fungsional) = payload.nama_jabatan_fungsional {
        active_model.nama_jabatan_fungsional = Set(Some(nama_jabatan_fungsional));
    }
    if let Some(sk_jabatan_fungsional) = payload.sk_jabatan_fungsional {
        active_model.sk_jabatan_fungsional = Set(Some(sk_jabatan_fungsional));
    }
    if let Some(mulai_sk_jabatan) = payload.mulai_sk_jabatan {
        active_model.mulai_sk_jabatan = Set(Some(mulai_sk_jabatan));
    }
    if let Some(nuptk) = payload.nuptk {
        active_model.nuptk = Set(Some(nuptk));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(RiwayatFungsionalDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_jabatan_fungsional: item.id_jabatan_fungsional,
            nama_jabatan_fungsional: item.nama_jabatan_fungsional,
            sk_jabatan_fungsional: item.sk_jabatan_fungsional,
            mulai_sk_jabatan: item.mulai_sk_jabatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }))
}

#[endpoint(tags("Feeder - Master - RiwayatFungsionalDosen"), status_codes(200, 400, 404, 500))]
pub async fn delete_riwayat_fungsional_dosen(
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
        .ok_or_else(|| StatusError::not_found().brief("RiwayatFungsionalDosen not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "RiwayatFungsionalDosen deleted successfully".to_string(),
    }))
}
