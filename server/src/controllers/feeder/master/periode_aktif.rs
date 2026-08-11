use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::periode_aktif::{
    CreatePeriodeAktifRequest, PeriodeAktifQuery, PeriodeAktifResponse, PaginatedPeriodeAktifResponse,
    UpdatePeriodeAktifRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::periode_aktif as entity_mod;

#[endpoint(tags("Feeder - Master - PeriodeAktif"), status_codes(200, 500))]
pub async fn list_periode_aktif(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPeriodeAktifResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PeriodeAktifQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PeriodeAktifResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            kode_prodi: item.kode_prodi,
            nama_program_studi: item.nama_program_studi,
            status_prodi: item.status_prodi,
            jenjang_pendidikan: item.jenjang_pendidikan,
            periode_pelaporan: item.periode_pelaporan,
            tipe_periode: item.tipe_periode,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedPeriodeAktifResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - PeriodeAktif"), status_codes(200, 400, 404, 500))]
pub async fn get_periode_aktif(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PeriodeAktifResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PeriodeAktif not found"))?;

    Ok(Json(PeriodeAktifResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            kode_prodi: item.kode_prodi,
            nama_program_studi: item.nama_program_studi,
            status_prodi: item.status_prodi,
            jenjang_pendidikan: item.jenjang_pendidikan,
            periode_pelaporan: item.periode_pelaporan,
            tipe_periode: item.tipe_periode,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - PeriodeAktif"), status_codes(200, 400, 500))]
pub async fn create_periode_aktif(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PeriodeAktifResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreatePeriodeAktifRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_prodi: Set(payload.id_prodi),
        kode_prodi: Set(payload.kode_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        status_prodi: Set(payload.status_prodi),
        jenjang_pendidikan: Set(payload.jenjang_pendidikan),
        periode_pelaporan: Set(payload.periode_pelaporan),
        tipe_periode: Set(payload.tipe_periode),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PeriodeAktifResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            kode_prodi: item.kode_prodi,
            nama_program_studi: item.nama_program_studi,
            status_prodi: item.status_prodi,
            jenjang_pendidikan: item.jenjang_pendidikan,
            periode_pelaporan: item.periode_pelaporan,
            tipe_periode: item.tipe_periode,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - PeriodeAktif"), status_codes(200, 400, 404, 500))]
pub async fn update_periode_aktif(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PeriodeAktifResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdatePeriodeAktifRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("PeriodeAktif not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_prodi) = payload.id_prodi {
        active_model.id_prodi = Set(Some(id_prodi));
    }
    if let Some(kode_prodi) = payload.kode_prodi {
        active_model.kode_prodi = Set(Some(kode_prodi));
    }
    if let Some(nama_program_studi) = payload.nama_program_studi {
        active_model.nama_program_studi = Set(Some(nama_program_studi));
    }
    if let Some(status_prodi) = payload.status_prodi {
        active_model.status_prodi = Set(Some(status_prodi));
    }
    if let Some(jenjang_pendidikan) = payload.jenjang_pendidikan {
        active_model.jenjang_pendidikan = Set(Some(jenjang_pendidikan));
    }
    if let Some(periode_pelaporan) = payload.periode_pelaporan {
        active_model.periode_pelaporan = Set(Some(periode_pelaporan));
    }
    if let Some(tipe_periode) = payload.tipe_periode {
        active_model.tipe_periode = Set(Some(tipe_periode));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(PeriodeAktifResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            kode_prodi: item.kode_prodi,
            nama_program_studi: item.nama_program_studi,
            status_prodi: item.status_prodi,
            jenjang_pendidikan: item.jenjang_pendidikan,
            periode_pelaporan: item.periode_pelaporan,
            tipe_periode: item.tipe_periode,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - PeriodeAktif"), status_codes(200, 400, 404, 500))]
pub async fn delete_periode_aktif(
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
        .ok_or_else(|| StatusError::not_found().brief("PeriodeAktif not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "PeriodeAktif deleted successfully".to_string(),
    }))
}
