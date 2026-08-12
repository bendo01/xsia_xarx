use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::rencana_evaluasi::{
    CreateRencanaEvaluasiRequest, RencanaEvaluasiQuery, RencanaEvaluasiResponse, PaginatedRencanaEvaluasiResponse,
    UpdateRencanaEvaluasiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::rencana_evaluasi as entity_mod;

#[endpoint(tags("Feeder - Master - RencanaEvaluasi"), status_codes(200, 500))]
pub async fn list_rencana_evaluasi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRencanaEvaluasiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RencanaEvaluasiQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RencanaEvaluasiResponse {
            id: item.id,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            id_rencana_evaluasi: item.id_rencana_evaluasi,
            jenis_evaluasi: item.jenis_evaluasi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            kode_mata_kuliah: item.kode_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_evaluasi: item.nama_evaluasi,
            deskripsi_indonesia: item.deskripsi_indonesia,
            deskrips_inggris: item.deskrips_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedRencanaEvaluasiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - RencanaEvaluasi"), status_codes(200, 400, 404, 500))]
pub async fn get_rencana_evaluasi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RencanaEvaluasiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("RencanaEvaluasi not found"))?;

    Ok(Json(RencanaEvaluasiResponse {
            id: item.id,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            id_rencana_evaluasi: item.id_rencana_evaluasi,
            jenis_evaluasi: item.jenis_evaluasi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            kode_mata_kuliah: item.kode_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_evaluasi: item.nama_evaluasi,
            deskripsi_indonesia: item.deskripsi_indonesia,
            deskrips_inggris: item.deskrips_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - RencanaEvaluasi"), status_codes(200, 400, 500))]
pub async fn create_rencana_evaluasi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RencanaEvaluasiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRencanaEvaluasiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_jenis_evaluasi: Set(payload.id_jenis_evaluasi),
        id_rencana_evaluasi: Set(payload.id_rencana_evaluasi),
        jenis_evaluasi: Set(payload.jenis_evaluasi),
        id_matkul: Set(payload.id_matkul),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        kode_mata_kuliah: Set(payload.kode_mata_kuliah),
        sks_mata_kuliah: Set(payload.sks_mata_kuliah),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        nama_evaluasi: Set(payload.nama_evaluasi),
        deskripsi_indonesia: Set(payload.deskripsi_indonesia),
        deskrips_inggris: Set(payload.deskrips_inggris),
        nomor_urut: Set(payload.nomor_urut),
        bobot_evaluasi: Set(payload.bobot_evaluasi),
        status_sync: Set(payload.status_sync),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RencanaEvaluasiResponse {
            id: item.id,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            id_rencana_evaluasi: item.id_rencana_evaluasi,
            jenis_evaluasi: item.jenis_evaluasi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            kode_mata_kuliah: item.kode_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_evaluasi: item.nama_evaluasi,
            deskripsi_indonesia: item.deskripsi_indonesia,
            deskrips_inggris: item.deskrips_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - RencanaEvaluasi"), status_codes(200, 400, 404, 500))]
pub async fn update_rencana_evaluasi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RencanaEvaluasiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRencanaEvaluasiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("RencanaEvaluasi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_jenis_evaluasi) = payload.id_jenis_evaluasi {
            active_model.id_jenis_evaluasi = Set(Some(id_jenis_evaluasi));
        }
    if let Some(id_rencana_evaluasi) = payload.id_rencana_evaluasi {
            active_model.id_rencana_evaluasi = Set(Some(id_rencana_evaluasi));
        }
    if let Some(jenis_evaluasi) = payload.jenis_evaluasi {
            active_model.jenis_evaluasi = Set(Some(jenis_evaluasi));
        }
    if let Some(id_matkul) = payload.id_matkul {
            active_model.id_matkul = Set(Some(id_matkul));
        }
    if let Some(nama_mata_kuliah) = payload.nama_mata_kuliah {
            active_model.nama_mata_kuliah = Set(Some(nama_mata_kuliah));
        }
    if let Some(kode_mata_kuliah) = payload.kode_mata_kuliah {
            active_model.kode_mata_kuliah = Set(Some(kode_mata_kuliah));
        }
    if let Some(sks_mata_kuliah) = payload.sks_mata_kuliah {
            active_model.sks_mata_kuliah = Set(Some(sks_mata_kuliah));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(nama_evaluasi) = payload.nama_evaluasi {
            active_model.nama_evaluasi = Set(Some(nama_evaluasi));
        }
    if let Some(deskripsi_indonesia) = payload.deskripsi_indonesia {
            active_model.deskripsi_indonesia = Set(Some(deskripsi_indonesia));
        }
    if let Some(deskrips_inggris) = payload.deskrips_inggris {
            active_model.deskrips_inggris = Set(Some(deskrips_inggris));
        }
    if let Some(nomor_urut) = payload.nomor_urut {
            active_model.nomor_urut = Set(Some(nomor_urut));
        }
    if let Some(bobot_evaluasi) = payload.bobot_evaluasi {
            active_model.bobot_evaluasi = Set(Some(bobot_evaluasi));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RencanaEvaluasiResponse {
            id: item.id,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            id_rencana_evaluasi: item.id_rencana_evaluasi,
            jenis_evaluasi: item.jenis_evaluasi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            kode_mata_kuliah: item.kode_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nama_evaluasi: item.nama_evaluasi,
            deskripsi_indonesia: item.deskripsi_indonesia,
            deskrips_inggris: item.deskrips_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - RencanaEvaluasi"), status_codes(200, 400, 404, 500))]
pub async fn delete_rencana_evaluasi(
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
            .ok_or_else(|| StatusError::not_found().brief("RencanaEvaluasi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "RencanaEvaluasi deleted successfully".to_string(),
        }))
}
