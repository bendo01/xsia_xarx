use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::uji_mahasiswa::{
    CreateUjiMahasiswaRequest, UjiMahasiswaQuery, UjiMahasiswaResponse, PaginatedUjiMahasiswaResponse,
    UpdateUjiMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::uji_mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - UjiMahasiswa"), status_codes(200, 500))]
pub async fn list_uji_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedUjiMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: UjiMahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| UjiMahasiswaResponse {
            id: item.id,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_uji: item.id_uji,
            id_kategori_kegiatan: item.id_kategori_kegiatan,
            nama_kategori_kegiatan: item.nama_kategori_kegiatan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            penguji_ke: item.penguji_ke,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedUjiMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - UjiMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_uji_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UjiMahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("UjiMahasiswa not found"))?;

    Ok(Json(UjiMahasiswaResponse {
            id: item.id,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_uji: item.id_uji,
            id_kategori_kegiatan: item.id_kategori_kegiatan,
            nama_kategori_kegiatan: item.nama_kategori_kegiatan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            penguji_ke: item.penguji_ke,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - UjiMahasiswa"), status_codes(200, 400, 500))]
pub async fn create_uji_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UjiMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateUjiMahasiswaRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_aktivitas: Set(payload.id_aktivitas),
        judul: Set(payload.judul),
        id_uji: Set(payload.id_uji),
        id_kategori_kegiatan: Set(payload.id_kategori_kegiatan),
        nama_kategori_kegiatan: Set(payload.nama_kategori_kegiatan),
        id_dosen: Set(payload.id_dosen),
        nidn: Set(payload.nidn),
        nama_dosen: Set(payload.nama_dosen),
        penguji_ke: Set(payload.penguji_ke),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(UjiMahasiswaResponse {
            id: item.id,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_uji: item.id_uji,
            id_kategori_kegiatan: item.id_kategori_kegiatan,
            nama_kategori_kegiatan: item.nama_kategori_kegiatan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            penguji_ke: item.penguji_ke,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - UjiMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_uji_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UjiMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateUjiMahasiswaRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("UjiMahasiswa not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_aktivitas) = payload.id_aktivitas {
        active_model.id_aktivitas = Set(Some(id_aktivitas));
    }
    if let Some(judul) = payload.judul {
        active_model.judul = Set(Some(judul));
    }
    if let Some(id_uji) = payload.id_uji {
        active_model.id_uji = Set(Some(id_uji));
    }
    if let Some(id_kategori_kegiatan) = payload.id_kategori_kegiatan {
        active_model.id_kategori_kegiatan = Set(Some(id_kategori_kegiatan));
    }
    if let Some(nama_kategori_kegiatan) = payload.nama_kategori_kegiatan {
        active_model.nama_kategori_kegiatan = Set(Some(nama_kategori_kegiatan));
    }
    if let Some(id_dosen) = payload.id_dosen {
        active_model.id_dosen = Set(Some(id_dosen));
    }
    if let Some(nidn) = payload.nidn {
        active_model.nidn = Set(Some(nidn));
    }
    if let Some(nama_dosen) = payload.nama_dosen {
        active_model.nama_dosen = Set(Some(nama_dosen));
    }
    if let Some(penguji_ke) = payload.penguji_ke {
        active_model.penguji_ke = Set(Some(penguji_ke));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(UjiMahasiswaResponse {
            id: item.id,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_uji: item.id_uji,
            id_kategori_kegiatan: item.id_kategori_kegiatan,
            nama_kategori_kegiatan: item.nama_kategori_kegiatan,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            penguji_ke: item.penguji_ke,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

    deleted_at_opt = "Option" in dict(fields).get("deleted_at", "Option<DateTime>")
    deleted_at_tz = "TimeZone" in dict(fields).get("deleted_at", "Option<DateTime>")
    val = "Utc::now().into()" if deleted_at_tz else "now"

#[endpoint(tags("Feeder - Master - UjiMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_uji_mahasiswa(
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
        .ok_or_else(|| StatusError::not_found().brief("UjiMahasiswa not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    active_model.deleted_at = Set(Some(Some(penguji_ke)));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "UjiMahasiswa deleted successfully".to_string(),
    }))
}
