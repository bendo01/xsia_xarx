use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::substansi_matakuliah::{
    CreateSubstansiMatakuliahRequest, SubstansiMatakuliahQuery, SubstansiMatakuliahResponse, PaginatedSubstansiMatakuliahResponse,
    UpdateSubstansiMatakuliahRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::substansi_matakuliah as entity_mod;

#[endpoint(tags("Feeder - Master - SubstansiMatakuliah"), status_codes(200, 500))]
pub async fn list_substansi_matakuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedSubstansiMatakuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: SubstansiMatakuliahQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| SubstansiMatakuliahResponse {
            id: item.id,
            id_substansi: item.id_substansi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_substansi: item.nama_substansi,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            id_jenis_substansi: item.id_jenis_substansi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedSubstansiMatakuliahResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - SubstansiMatakuliah"), status_codes(200, 400, 404, 500))]
pub async fn get_substansi_matakuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubstansiMatakuliahResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("SubstansiMatakuliah not found"))?;

    Ok(Json(SubstansiMatakuliahResponse {
            id: item.id,
            id_substansi: item.id_substansi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_substansi: item.nama_substansi,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            id_jenis_substansi: item.id_jenis_substansi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - SubstansiMatakuliah"), status_codes(200, 400, 500))]
pub async fn create_substansi_matakuliah(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<SubstansiMatakuliahResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateSubstansiMatakuliahRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_substansi: Set(payload.id_substansi),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        nama_substansi: Set(payload.nama_substansi),
        sks_mata_kuliah: Set(payload.sks_mata_kuliah),
        sks_tatap_muka: Set(payload.sks_tatap_muka),
        sks_praktek: Set(payload.sks_praktek),
        sks_praktek_lapangan: Set(payload.sks_praktek_lapangan),
        sks_simulasi: Set(payload.sks_simulasi),
        id_jenis_substansi: Set(payload.id_jenis_substansi),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(SubstansiMatakuliahResponse {
            id: item.id,
            id_substansi: item.id_substansi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_substansi: item.nama_substansi,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            id_jenis_substansi: item.id_jenis_substansi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - SubstansiMatakuliah"), status_codes(200, 400, 404, 500))]
pub async fn update_substansi_matakuliah(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<SubstansiMatakuliahResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateSubstansiMatakuliahRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("SubstansiMatakuliah not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_substansi) = payload.id_substansi {
            active_model.id_substansi = Set(Some(id_substansi));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(nama_substansi) = payload.nama_substansi {
            active_model.nama_substansi = Set(Some(nama_substansi));
        }
    if let Some(sks_mata_kuliah) = payload.sks_mata_kuliah {
            active_model.sks_mata_kuliah = Set(Some(sks_mata_kuliah));
        }
    if let Some(sks_tatap_muka) = payload.sks_tatap_muka {
            active_model.sks_tatap_muka = Set(Some(sks_tatap_muka));
        }
    if let Some(sks_praktek) = payload.sks_praktek {
            active_model.sks_praktek = Set(Some(sks_praktek));
        }
    if let Some(sks_praktek_lapangan) = payload.sks_praktek_lapangan {
            active_model.sks_praktek_lapangan = Set(Some(sks_praktek_lapangan));
        }
    if let Some(sks_simulasi) = payload.sks_simulasi {
            active_model.sks_simulasi = Set(Some(sks_simulasi));
        }
    if let Some(id_jenis_substansi) = payload.id_jenis_substansi {
            active_model.id_jenis_substansi = Set(Some(id_jenis_substansi));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(SubstansiMatakuliahResponse {
            id: item.id,
            id_substansi: item.id_substansi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_substansi: item.nama_substansi,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            id_jenis_substansi: item.id_jenis_substansi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - SubstansiMatakuliah"), status_codes(200, 400, 404, 500))]
pub async fn delete_substansi_matakuliah(
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
            .ok_or_else(|| StatusError::not_found().brief("SubstansiMatakuliah not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "SubstansiMatakuliah deleted successfully".to_string(),
        }))
}
