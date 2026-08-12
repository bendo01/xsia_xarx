use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::skala_nilai_program_studi::{
    CreateSkalaNilaiProgramStudiRequest, SkalaNilaiProgramStudiQuery, SkalaNilaiProgramStudiResponse, PaginatedSkalaNilaiProgramStudiResponse,
    UpdateSkalaNilaiProgramStudiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::skala_nilai_program_studi as entity_mod;

#[endpoint(tags("Feeder - Master - SkalaNilaiProgramStudi"), status_codes(200, 500))]
pub async fn list_skala_nilai_program_studi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedSkalaNilaiProgramStudiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: SkalaNilaiProgramStudiQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| SkalaNilaiProgramStudiResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_bobot_nilai: item.id_bobot_nilai,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            bobot_minimum: item.bobot_minimum,
            bobot_maksimum: item.bobot_maksimum,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedSkalaNilaiProgramStudiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - SkalaNilaiProgramStudi"), status_codes(200, 400, 404, 500))]
pub async fn get_skala_nilai_program_studi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SkalaNilaiProgramStudiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("SkalaNilaiProgramStudi not found"))?;

    Ok(Json(SkalaNilaiProgramStudiResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_bobot_nilai: item.id_bobot_nilai,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            bobot_minimum: item.bobot_minimum,
            bobot_maksimum: item.bobot_maksimum,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - SkalaNilaiProgramStudi"), status_codes(200, 400, 500))]
pub async fn create_skala_nilai_program_studi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<SkalaNilaiProgramStudiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateSkalaNilaiProgramStudiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        tgl_create: Set(payload.tgl_create),
        id_bobot_nilai: Set(payload.id_bobot_nilai),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        nilai_huruf: Set(payload.nilai_huruf),
        nilai_indeks: Set(payload.nilai_indeks),
        bobot_minimum: Set(payload.bobot_minimum),
        bobot_maksimum: Set(payload.bobot_maksimum),
        tanggal_mulai_efektif: Set(payload.tanggal_mulai_efektif),
        tanggal_akhir_efektif: Set(payload.tanggal_akhir_efektif),
        status_sync: Set(payload.status_sync),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(SkalaNilaiProgramStudiResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_bobot_nilai: item.id_bobot_nilai,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            bobot_minimum: item.bobot_minimum,
            bobot_maksimum: item.bobot_maksimum,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - SkalaNilaiProgramStudi"), status_codes(200, 400, 404, 500))]
pub async fn update_skala_nilai_program_studi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<SkalaNilaiProgramStudiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateSkalaNilaiProgramStudiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("SkalaNilaiProgramStudi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    if let Some(id_bobot_nilai) = payload.id_bobot_nilai {
            active_model.id_bobot_nilai = Set(Some(id_bobot_nilai));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(nilai_huruf) = payload.nilai_huruf {
            active_model.nilai_huruf = Set(Some(nilai_huruf));
        }
    if let Some(nilai_indeks) = payload.nilai_indeks {
            active_model.nilai_indeks = Set(Some(nilai_indeks));
        }
    if let Some(bobot_minimum) = payload.bobot_minimum {
            active_model.bobot_minimum = Set(Some(bobot_minimum));
        }
    if let Some(bobot_maksimum) = payload.bobot_maksimum {
            active_model.bobot_maksimum = Set(Some(bobot_maksimum));
        }
    if let Some(tanggal_mulai_efektif) = payload.tanggal_mulai_efektif {
            active_model.tanggal_mulai_efektif = Set(Some(tanggal_mulai_efektif));
        }
    if let Some(tanggal_akhir_efektif) = payload.tanggal_akhir_efektif {
            active_model.tanggal_akhir_efektif = Set(Some(tanggal_akhir_efektif));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(SkalaNilaiProgramStudiResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_bobot_nilai: item.id_bobot_nilai,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            bobot_minimum: item.bobot_minimum,
            bobot_maksimum: item.bobot_maksimum,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - SkalaNilaiProgramStudi"), status_codes(200, 400, 404, 500))]
pub async fn delete_skala_nilai_program_studi(
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
            .ok_or_else(|| StatusError::not_found().brief("SkalaNilaiProgramStudi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "SkalaNilaiProgramStudi deleted successfully".to_string(),
        }))
}
