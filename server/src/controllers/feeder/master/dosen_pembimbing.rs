use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::dosen_pembimbing::{
    CreateDosenPembimbingRequest, DosenPembimbingQuery, DosenPembimbingResponse, PaginatedDosenPembimbingResponse,
    UpdateDosenPembimbingRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::dosen_pembimbing as entity_mod;

#[endpoint(tags("Feeder - Master - DosenPembimbing"), status_codes(200, 500))]
pub async fn list_dosen_pembimbing(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedDosenPembimbingResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DosenPembimbingQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| DosenPembimbingResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nama_mahasiswa: item.nama_mahasiswa,
            nim: item.nim,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            jenis_aktivitas: item.jenis_aktivitas,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedDosenPembimbingResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - DosenPembimbing"), status_codes(200, 400, 404, 500))]
pub async fn get_dosen_pembimbing(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DosenPembimbingResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("DosenPembimbing not found"))?;

    Ok(Json(DosenPembimbingResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nama_mahasiswa: item.nama_mahasiswa,
            nim: item.nim,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            jenis_aktivitas: item.jenis_aktivitas,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - DosenPembimbing"), status_codes(200, 400, 500))]
pub async fn create_dosen_pembimbing(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DosenPembimbingResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateDosenPembimbingRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        nim: Set(payload.nim),
        id_dosen: Set(payload.id_dosen),
        nidn: Set(payload.nidn),
        nama_dosen: Set(payload.nama_dosen),
        pembimbing_ke: Set(payload.pembimbing_ke),
        jenis_aktivitas: Set(payload.jenis_aktivitas),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(DosenPembimbingResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nama_mahasiswa: item.nama_mahasiswa,
            nim: item.nim,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            jenis_aktivitas: item.jenis_aktivitas,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - DosenPembimbing"), status_codes(200, 400, 404, 500))]
pub async fn update_dosen_pembimbing(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DosenPembimbingResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateDosenPembimbingRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("DosenPembimbing not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
        }
    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(nim) = payload.nim {
            active_model.nim = Set(Some(nim));
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
    if let Some(pembimbing_ke) = payload.pembimbing_ke {
            active_model.pembimbing_ke = Set(Some(pembimbing_ke));
        }
    if let Some(jenis_aktivitas) = payload.jenis_aktivitas {
            active_model.jenis_aktivitas = Set(Some(jenis_aktivitas));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(DosenPembimbingResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nama_mahasiswa: item.nama_mahasiswa,
            nim: item.nim,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            pembimbing_ke: item.pembimbing_ke,
            jenis_aktivitas: item.jenis_aktivitas,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - DosenPembimbing"), status_codes(200, 400, 404, 500))]
pub async fn delete_dosen_pembimbing(
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
            .ok_or_else(|| StatusError::not_found().brief("DosenPembimbing not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "DosenPembimbing deleted successfully".to_string(),
        }))
}
