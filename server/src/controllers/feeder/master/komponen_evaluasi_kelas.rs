use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::komponen_evaluasi_kelas::{
    CreateKomponenEvaluasiKelasRequest, KomponenEvaluasiKelasQuery, KomponenEvaluasiKelasResponse, PaginatedKomponenEvaluasiKelasResponse,
    UpdateKomponenEvaluasiKelasRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::komponen_evaluasi_kelas as entity_mod;

#[endpoint(tags("Feeder - Master - KomponenEvaluasiKelas"), status_codes(200, 500))]
pub async fn list_komponen_evaluasi_kelas(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedKomponenEvaluasiKelasResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: KomponenEvaluasiKelasQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| KomponenEvaluasiKelasResponse {
            id: item.id,
            id_komponen_evaluasi: item.id_komponen_evaluasi,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama: item.nama,
            nama_inggris: item.nama_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedKomponenEvaluasiKelasResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - KomponenEvaluasiKelas"), status_codes(200, 400, 404, 500))]
pub async fn get_komponen_evaluasi_kela(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<KomponenEvaluasiKelasResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("KomponenEvaluasiKelas not found"))?;

    Ok(Json(KomponenEvaluasiKelasResponse {
            id: item.id,
            id_komponen_evaluasi: item.id_komponen_evaluasi,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama: item.nama,
            nama_inggris: item.nama_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - KomponenEvaluasiKelas"), status_codes(200, 400, 500))]
pub async fn create_komponen_evaluasi_kela(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<KomponenEvaluasiKelasResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateKomponenEvaluasiKelasRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_komponen_evaluasi: Set(payload.id_komponen_evaluasi),
        id_kelas_kuliah: Set(payload.id_kelas_kuliah),
        id_jenis_evaluasi: Set(payload.id_jenis_evaluasi),
        nama: Set(payload.nama),
        nama_inggris: Set(payload.nama_inggris),
        nomor_urut: Set(payload.nomor_urut),
        bobot_evaluasi: Set(payload.bobot_evaluasi),
        last_update: Set(payload.last_update),
        tgl_create: Set(payload.tgl_create),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(KomponenEvaluasiKelasResponse {
            id: item.id,
            id_komponen_evaluasi: item.id_komponen_evaluasi,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama: item.nama,
            nama_inggris: item.nama_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - KomponenEvaluasiKelas"), status_codes(200, 400, 404, 500))]
pub async fn update_komponen_evaluasi_kela(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<KomponenEvaluasiKelasResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateKomponenEvaluasiKelasRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("KomponenEvaluasiKelas not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_komponen_evaluasi) = payload.id_komponen_evaluasi {
            active_model.id_komponen_evaluasi = Set(Some(id_komponen_evaluasi));
        }
    if let Some(id_kelas_kuliah) = payload.id_kelas_kuliah {
            active_model.id_kelas_kuliah = Set(Some(id_kelas_kuliah));
        }
    if let Some(id_jenis_evaluasi) = payload.id_jenis_evaluasi {
            active_model.id_jenis_evaluasi = Set(Some(id_jenis_evaluasi));
        }
    if let Some(nama) = payload.nama {
            active_model.nama = Set(Some(nama));
        }
    if let Some(nama_inggris) = payload.nama_inggris {
            active_model.nama_inggris = Set(Some(nama_inggris));
        }
    if let Some(nomor_urut) = payload.nomor_urut {
            active_model.nomor_urut = Set(Some(nomor_urut));
        }
    if let Some(bobot_evaluasi) = payload.bobot_evaluasi {
            active_model.bobot_evaluasi = Set(Some(bobot_evaluasi));
        }
    if let Some(last_update) = payload.last_update {
            active_model.last_update = Set(Some(last_update));
        }
    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(KomponenEvaluasiKelasResponse {
            id: item.id,
            id_komponen_evaluasi: item.id_komponen_evaluasi,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama: item.nama,
            nama_inggris: item.nama_inggris,
            nomor_urut: item.nomor_urut,
            bobot_evaluasi: item.bobot_evaluasi,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - KomponenEvaluasiKelas"), status_codes(200, 400, 404, 500))]
pub async fn delete_komponen_evaluasi_kela(
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
            .ok_or_else(|| StatusError::not_found().brief("KomponenEvaluasiKelas not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "KomponenEvaluasiKelas deleted successfully".to_string(),
        }))
}
