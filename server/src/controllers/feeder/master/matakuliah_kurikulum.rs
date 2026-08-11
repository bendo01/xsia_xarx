use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::matakuliah_kurikulum::{
    CreateMatakuliahKurikulumRequest, MatakuliahKurikulumQuery, MatakuliahKurikulumResponse, PaginatedMatakuliahKurikulumResponse,
    UpdateMatakuliahKurikulumRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::matakuliah_kurikulum as entity_mod;

#[endpoint(tags("Feeder - Master - MatakuliahKurikulum"), status_codes(200, 500))]
pub async fn list_matakuliah_kurikulum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedMatakuliahKurikulumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: MatakuliahKurikulumQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| MatakuliahKurikulumResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            apakah_wajib: item.apakah_wajib,
            status_sync: item.status_sync,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            semester: item.semester,

    }).collect();

    Ok(Json(PaginatedMatakuliahKurikulumResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - MatakuliahKurikulum"), status_codes(200, 400, 404, 500))]
pub async fn get_matakuliah_kurikulum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MatakuliahKurikulumResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("MatakuliahKurikulum not found"))?;

    Ok(Json(MatakuliahKurikulumResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            apakah_wajib: item.apakah_wajib,
            status_sync: item.status_sync,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            semester: item.semester,

    }))
}

#[endpoint(tags("Feeder - Master - MatakuliahKurikulum"), status_codes(200, 400, 500))]
pub async fn create_matakuliah_kurikulum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MatakuliahKurikulumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateMatakuliahKurikulumRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        tgl_create: Set(payload.tgl_create),
        id_kurikulum: Set(payload.id_kurikulum),
        nama_kurikulum: Set(payload.nama_kurikulum),
        id_matkul: Set(payload.id_matkul),
        kode_mata_kuliah: Set(payload.kode_mata_kuliah),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_semester: Set(payload.id_semester),
        semester_mulai_berlaku: Set(payload.semester_mulai_berlaku),
        sks_mata_kuliah: Set(payload.sks_mata_kuliah),
        sks_tatap_muka: Set(payload.sks_tatap_muka),
        sks_praktek: Set(payload.sks_praktek),
        sks_praktek_lapangan: Set(payload.sks_praktek_lapangan),
        sks_simulasi: Set(payload.sks_simulasi),
        apakah_wajib: Set(payload.apakah_wajib),
        status_sync: Set(payload.status_sync),
        sync_at: Set(None),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        semester: Set(payload.semester),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MatakuliahKurikulumResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            apakah_wajib: item.apakah_wajib,
            status_sync: item.status_sync,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            semester: item.semester,

    }))
}

#[endpoint(tags("Feeder - Master - MatakuliahKurikulum"), status_codes(200, 400, 404, 500))]
pub async fn update_matakuliah_kurikulum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MatakuliahKurikulumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateMatakuliahKurikulumRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("MatakuliahKurikulum not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(tgl_create) = payload.tgl_create {
        active_model.tgl_create = Set(Some(tgl_create));
    }
    if let Some(id_kurikulum) = payload.id_kurikulum {
        active_model.id_kurikulum = Set(Some(id_kurikulum));
    }
    if let Some(nama_kurikulum) = payload.nama_kurikulum {
        active_model.nama_kurikulum = Set(Some(nama_kurikulum));
    }
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
    if let Some(id_semester) = payload.id_semester {
        active_model.id_semester = Set(Some(id_semester));
    }
    if let Some(semester_mulai_berlaku) = payload.semester_mulai_berlaku {
        active_model.semester_mulai_berlaku = Set(Some(semester_mulai_berlaku));
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
    if let Some(apakah_wajib) = payload.apakah_wajib {
        active_model.apakah_wajib = Set(Some(apakah_wajib));
    }
    if let Some(status_sync) = payload.status_sync {
        active_model.status_sync = Set(Some(status_sync));
    }
    if let Some(semester) = payload.semester {
        active_model.semester = Set(Some(semester));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MatakuliahKurikulumResponse {
            id: item.id,
            tgl_create: item.tgl_create,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            sks_mata_kuliah: item.sks_mata_kuliah,
            sks_tatap_muka: item.sks_tatap_muka,
            sks_praktek: item.sks_praktek,
            sks_praktek_lapangan: item.sks_praktek_lapangan,
            sks_simulasi: item.sks_simulasi,
            apakah_wajib: item.apakah_wajib,
            status_sync: item.status_sync,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            semester: item.semester,

    }))
}

#[endpoint(tags("Feeder - Master - MatakuliahKurikulum"), status_codes(200, 400, 404, 500))]
pub async fn delete_matakuliah_kurikulum(
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
        .ok_or_else(|| StatusError::not_found().brief("MatakuliahKurikulum not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "MatakuliahKurikulum deleted successfully".to_string(),
    }))
}
