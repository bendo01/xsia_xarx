use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::matakuliah::{
    CreateMatakuliahRequest, MatakuliahQuery, MatakuliahResponse, PaginatedMatakuliahResponse,
    UpdateMatakuliahRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::matakuliah as entity_mod;

#[endpoint(tags("Feeder - Master - Matakuliah"), status_codes(200, 500))]
pub async fn list_matakuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedMatakuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: MatakuliahQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| MatakuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenis_mata_kuliah: item.id_jenis_mata_kuliah,
            nama_jenis_mata_kuliah: item.nama_jenis_mata_kuliah,
            id_kelompok_mata_kuliah: item.id_kelompok_mata_kuliah,
            nama_kelompok_mata_kuliah: item.nama_kelompok_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            metode_kuliah: item.metode_kuliah,
            ada_sap: item.ada_sap,
            ada_silabus: item.ada_silabus,
            ada_bahan_ajar: item.ada_bahan_ajar,
            ada_acara_praktek: item.ada_acara_praktek,
            ada_diktat: item.ada_diktat,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_selesai_efektif: item.tanggal_selesai_efektif,
            id_jenj_didik: item.id_jenj_didik,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,

    }).collect();

    Ok(Json(PaginatedMatakuliahResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - Matakuliah"), status_codes(200, 400, 404, 500))]
pub async fn get_matakuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MatakuliahResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Matakuliah not found"))?;

    Ok(Json(MatakuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenis_mata_kuliah: item.id_jenis_mata_kuliah,
            nama_jenis_mata_kuliah: item.nama_jenis_mata_kuliah,
            id_kelompok_mata_kuliah: item.id_kelompok_mata_kuliah,
            nama_kelompok_mata_kuliah: item.nama_kelompok_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            metode_kuliah: item.metode_kuliah,
            ada_sap: item.ada_sap,
            ada_silabus: item.ada_silabus,
            ada_bahan_ajar: item.ada_bahan_ajar,
            ada_acara_praktek: item.ada_acara_praktek,
            ada_diktat: item.ada_diktat,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_selesai_efektif: item.tanggal_selesai_efektif,
            id_jenj_didik: item.id_jenj_didik,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,

    }))
}

#[endpoint(tags("Feeder - Master - Matakuliah"), status_codes(200, 400, 500))]
pub async fn create_matakuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MatakuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateMatakuliahRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_matkul: Set(payload.id_matkul),
        kode_mata_kuliah: Set(payload.kode_mata_kuliah),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_jenis_mata_kuliah: Set(payload.id_jenis_mata_kuliah),
        nama_jenis_mata_kuliah: Set(payload.nama_jenis_mata_kuliah),
        id_kelompok_mata_kuliah: Set(payload.id_kelompok_mata_kuliah),
        nama_kelompok_mata_kuliah: Set(payload.nama_kelompok_mata_kuliah),
        sks_mata_kuliah: Set(payload.sks_mata_kuliah),
        sks_tatap_muka: Set(payload.sks_tatap_muka),
        sks_praktek: Set(payload.sks_praktek),
        sks_praktek_lapangan: Set(payload.sks_praktek_lapangan),
        sks_simulasi: Set(payload.sks_simulasi),
        metode_kuliah: Set(payload.metode_kuliah),
        ada_sap: Set(payload.ada_sap),
        ada_silabus: Set(payload.ada_silabus),
        ada_bahan_ajar: Set(payload.ada_bahan_ajar),
        ada_acara_praktek: Set(payload.ada_acara_praktek),
        ada_diktat: Set(payload.ada_diktat),
        tanggal_mulai_efektif: Set(payload.tanggal_mulai_efektif),
        tanggal_selesai_efektif: Set(payload.tanggal_selesai_efektif),
        id_jenj_didik: Set(payload.id_jenj_didik),
        tgl_create: Set(payload.tgl_create),
        status_sync: Set(payload.status_sync),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MatakuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenis_mata_kuliah: item.id_jenis_mata_kuliah,
            nama_jenis_mata_kuliah: item.nama_jenis_mata_kuliah,
            id_kelompok_mata_kuliah: item.id_kelompok_mata_kuliah,
            nama_kelompok_mata_kuliah: item.nama_kelompok_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            metode_kuliah: item.metode_kuliah,
            ada_sap: item.ada_sap,
            ada_silabus: item.ada_silabus,
            ada_bahan_ajar: item.ada_bahan_ajar,
            ada_acara_praktek: item.ada_acara_praktek,
            ada_diktat: item.ada_diktat,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_selesai_efektif: item.tanggal_selesai_efektif,
            id_jenj_didik: item.id_jenj_didik,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,

    }))
}

#[endpoint(tags("Feeder - Master - Matakuliah"), status_codes(200, 400, 404, 500))]
pub async fn update_matakuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MatakuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateMatakuliahRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Matakuliah not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_matkul) = payload.id_matkul {
        active_model.id_matkul = Set(Some(id_matkul));
    }
    if let Some(kode_mata_kuliah) = payload.kode_mata_kuliah {
        active_model.kode_mata_kuliah = Set(Some(kode_mata_kuliah));
    }
    if let Some(nama_mata_kuliah) = payload.nama_mata_kuliah {
        active_model.nama_mata_kuliah = Set(Some(nama_mata_kuliah));
    }
    if let Some(id_prodi) = payload.id_prodi {
        active_model.id_prodi = Set(Some(id_prodi));
    }
    if let Some(nama_program_studi) = payload.nama_program_studi {
        active_model.nama_program_studi = Set(Some(nama_program_studi));
    }
    if let Some(id_jenis_mata_kuliah) = payload.id_jenis_mata_kuliah {
        active_model.id_jenis_mata_kuliah = Set(Some(id_jenis_mata_kuliah));
    }
    if let Some(nama_jenis_mata_kuliah) = payload.nama_jenis_mata_kuliah {
        active_model.nama_jenis_mata_kuliah = Set(Some(nama_jenis_mata_kuliah));
    }
    if let Some(id_kelompok_mata_kuliah) = payload.id_kelompok_mata_kuliah {
        active_model.id_kelompok_mata_kuliah = Set(Some(id_kelompok_mata_kuliah));
    }
    if let Some(nama_kelompok_mata_kuliah) = payload.nama_kelompok_mata_kuliah {
        active_model.nama_kelompok_mata_kuliah = Set(Some(nama_kelompok_mata_kuliah));
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
    if let Some(metode_kuliah) = payload.metode_kuliah {
        active_model.metode_kuliah = Set(Some(metode_kuliah));
    }
    if let Some(ada_sap) = payload.ada_sap {
        active_model.ada_sap = Set(Some(ada_sap));
    }
    if let Some(ada_silabus) = payload.ada_silabus {
        active_model.ada_silabus = Set(Some(ada_silabus));
    }
    if let Some(ada_bahan_ajar) = payload.ada_bahan_ajar {
        active_model.ada_bahan_ajar = Set(Some(ada_bahan_ajar));
    }
    if let Some(ada_acara_praktek) = payload.ada_acara_praktek {
        active_model.ada_acara_praktek = Set(Some(ada_acara_praktek));
    }
    if let Some(ada_diktat) = payload.ada_diktat {
        active_model.ada_diktat = Set(Some(ada_diktat));
    }
    if let Some(tanggal_mulai_efektif) = payload.tanggal_mulai_efektif {
        active_model.tanggal_mulai_efektif = Set(Some(tanggal_mulai_efektif));
    }
    if let Some(tanggal_selesai_efektif) = payload.tanggal_selesai_efektif {
        active_model.tanggal_selesai_efektif = Set(Some(tanggal_selesai_efektif));
    }
    if let Some(id_jenj_didik) = payload.id_jenj_didik {
        active_model.id_jenj_didik = Set(Some(id_jenj_didik));
    }
    if let Some(tgl_create) = payload.tgl_create {
        active_model.tgl_create = Set(Some(tgl_create));
    }
    if let Some(status_sync) = payload.status_sync {
        active_model.status_sync = Set(Some(status_sync));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MatakuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenis_mata_kuliah: item.id_jenis_mata_kuliah,
            nama_jenis_mata_kuliah: item.nama_jenis_mata_kuliah,
            id_kelompok_mata_kuliah: item.id_kelompok_mata_kuliah,
            nama_kelompok_mata_kuliah: item.nama_kelompok_mata_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            metode_kuliah: item.metode_kuliah,
            ada_sap: item.ada_sap,
            ada_silabus: item.ada_silabus,
            ada_bahan_ajar: item.ada_bahan_ajar,
            ada_acara_praktek: item.ada_acara_praktek,
            ada_diktat: item.ada_diktat,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_selesai_efektif: item.tanggal_selesai_efektif,
            id_jenj_didik: item.id_jenj_didik,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,

    }))
}

#[endpoint(tags("Feeder - Master - Matakuliah"), status_codes(200, 400, 404, 500))]
pub async fn delete_matakuliah(
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
        .ok_or_else(|| StatusError::not_found().brief("Matakuliah not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Matakuliah deleted successfully".to_string(),
    }))
}
