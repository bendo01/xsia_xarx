use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::rekapitulasi::laporan::{
    CreateLaporanRequest, LaporanQuery, LaporanResponse, PaginatedLaporanResponse,
    UpdateLaporanRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::rekapitulasi::laporan as entity_mod;

#[endpoint(tags("Feeder - Rekapitulasi - Laporan"), status_codes(200, 500))]
pub async fn list_laporan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedLaporanResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: LaporanQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| LaporanResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedLaporanResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Rekapitulasi - Laporan"), status_codes(200, 400, 404, 500))]
pub async fn get_laporan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<LaporanResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Laporan not found"))?;

    Ok(Json(LaporanResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Rekapitulasi - Laporan"), status_codes(200, 400, 500))]
pub async fn create_laporan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<LaporanResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateLaporanRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_semester: Set(payload.id_semester),
        nama_semester: Set(payload.nama_semester),
        jumlah_target_mahasiswa_baru: Set(payload.jumlah_target_mahasiswa_baru),
        tanggal_awal_perkuliahan: Set(payload.tanggal_awal_perkuliahan),
        tanggal_akhir_perkuliahan: Set(payload.tanggal_akhir_perkuliahan),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(LaporanResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Rekapitulasi - Laporan"), status_codes(200, 400, 404, 500))]
pub async fn update_laporan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<LaporanResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateLaporanRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Laporan not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_prodi) = payload.id_prodi {
        active_model.id_prodi = Set(Some(id_prodi));
    }
    if let Some(nama_program_studi) = payload.nama_program_studi {
        active_model.nama_program_studi = Set(Some(nama_program_studi));
    }
    if let Some(id_semester) = payload.id_semester {
        active_model.id_semester = Set(Some(id_semester));
    }
    if let Some(nama_semester) = payload.nama_semester {
        active_model.nama_semester = Set(Some(nama_semester));
    }
    if let Some(jumlah_target_mahasiswa_baru) = payload.jumlah_target_mahasiswa_baru {
        active_model.jumlah_target_mahasiswa_baru = Set(Some(jumlah_target_mahasiswa_baru));
    }
    if let Some(tanggal_awal_perkuliahan) = payload.tanggal_awal_perkuliahan {
        active_model.tanggal_awal_perkuliahan = Set(Some(tanggal_awal_perkuliahan));
    }
    if let Some(tanggal_akhir_perkuliahan) = payload.tanggal_akhir_perkuliahan {
        active_model.tanggal_akhir_perkuliahan = Set(Some(tanggal_akhir_perkuliahan));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(LaporanResponse {
            id: item.id,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
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

#[endpoint(tags("Feeder - Rekapitulasi - Laporan"), status_codes(200, 400, 404, 500))]
pub async fn delete_laporan(
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
        .ok_or_else(|| StatusError::not_found().brief("Laporan not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    active_model.deleted_at = Set(Some(Some(tanggal_akhir_perkuliahan)));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Laporan deleted successfully".to_string(),
    }))
}
