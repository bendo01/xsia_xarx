use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::dosen_pengajar_kelas_kuliah::{
    CreateDosenPengajarKelasKuliahRequest, DosenPengajarKelasKuliahQuery, DosenPengajarKelasKuliahResponse, PaginatedDosenPengajarKelasKuliahResponse,
    UpdateDosenPengajarKelasKuliahRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::dosen_pengajar_kelas_kuliah as entity_mod;

#[endpoint(tags("Feeder - Master - DosenPengajarKelasKuliah"), status_codes(200, 500))]
pub async fn list_dosen_pengajar_kelas_kuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedDosenPengajarKelasKuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DosenPengajarKelasKuliahQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| DosenPengajarKelasKuliahResponse {
            id: item.id,
            id_aktivitas_mengajar: item.id_aktivitas_mengajar,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            id_substansi: item.id_substansi,
            sks_substansi_total: item.sks_substansi_total,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama_jenis_evaluasi: item.nama_jenis_evaluasi,
            id_prodi: item.id_prodi,
            id_semester: item.id_semester,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedDosenPengajarKelasKuliahResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - DosenPengajarKelasKuliah"), status_codes(200, 400, 404, 500))]
pub async fn get_dosen_pengajar_kelas_kuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DosenPengajarKelasKuliahResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("DosenPengajarKelasKuliah not found"))?;

    Ok(Json(DosenPengajarKelasKuliahResponse {
            id: item.id,
            id_aktivitas_mengajar: item.id_aktivitas_mengajar,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            id_substansi: item.id_substansi,
            sks_substansi_total: item.sks_substansi_total,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama_jenis_evaluasi: item.nama_jenis_evaluasi,
            id_prodi: item.id_prodi,
            id_semester: item.id_semester,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - DosenPengajarKelasKuliah"), status_codes(200, 400, 500))]
pub async fn create_dosen_pengajar_kelas_kuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DosenPengajarKelasKuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateDosenPengajarKelasKuliahRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_aktivitas_mengajar: Set(payload.id_aktivitas_mengajar),
        id_registrasi_dosen: Set(payload.id_registrasi_dosen),
        id_dosen: Set(payload.id_dosen),
        nidn: Set(payload.nidn),
        nuptk: Set(payload.nuptk),
        nama_dosen: Set(payload.nama_dosen),
        id_kelas_kuliah: Set(payload.id_kelas_kuliah),
        nama_kelas_kuliah: Set(payload.nama_kelas_kuliah),
        id_substansi: Set(payload.id_substansi),
        sks_substansi_total: Set(payload.sks_substansi_total),
        rencana_minggu_pertemuan: Set(payload.rencana_minggu_pertemuan),
        realisasi_minggu_pertemuan: Set(payload.realisasi_minggu_pertemuan),
        id_jenis_evaluasi: Set(payload.id_jenis_evaluasi),
        nama_jenis_evaluasi: Set(payload.nama_jenis_evaluasi),
        id_prodi: Set(payload.id_prodi),
        id_semester: Set(payload.id_semester),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(DosenPengajarKelasKuliahResponse {
            id: item.id,
            id_aktivitas_mengajar: item.id_aktivitas_mengajar,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            id_substansi: item.id_substansi,
            sks_substansi_total: item.sks_substansi_total,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama_jenis_evaluasi: item.nama_jenis_evaluasi,
            id_prodi: item.id_prodi,
            id_semester: item.id_semester,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - DosenPengajarKelasKuliah"), status_codes(200, 400, 404, 500))]
pub async fn update_dosen_pengajar_kelas_kuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DosenPengajarKelasKuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateDosenPengajarKelasKuliahRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("DosenPengajarKelasKuliah not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_aktivitas_mengajar) = payload.id_aktivitas_mengajar {
        active_model.id_aktivitas_mengajar = Set(Some(id_aktivitas_mengajar));
    }
    if let Some(id_registrasi_dosen) = payload.id_registrasi_dosen {
        active_model.id_registrasi_dosen = Set(Some(id_registrasi_dosen));
    }
    if let Some(id_dosen) = payload.id_dosen {
        active_model.id_dosen = Set(Some(id_dosen));
    }
    if let Some(nidn) = payload.nidn {
        active_model.nidn = Set(Some(nidn));
    }
    if let Some(nuptk) = payload.nuptk {
        active_model.nuptk = Set(Some(nuptk));
    }
    if let Some(nama_dosen) = payload.nama_dosen {
        active_model.nama_dosen = Set(Some(nama_dosen));
    }
    if let Some(id_kelas_kuliah) = payload.id_kelas_kuliah {
        active_model.id_kelas_kuliah = Set(Some(id_kelas_kuliah));
    }
    if let Some(nama_kelas_kuliah) = payload.nama_kelas_kuliah {
        active_model.nama_kelas_kuliah = Set(Some(nama_kelas_kuliah));
    }
    if let Some(id_substansi) = payload.id_substansi {
        active_model.id_substansi = Set(Some(id_substansi));
    }
    if let Some(sks_substansi_total) = payload.sks_substansi_total {
        active_model.sks_substansi_total = Set(Some(sks_substansi_total));
    }
    if let Some(rencana_minggu_pertemuan) = payload.rencana_minggu_pertemuan {
        active_model.rencana_minggu_pertemuan = Set(Some(rencana_minggu_pertemuan));
    }
    if let Some(realisasi_minggu_pertemuan) = payload.realisasi_minggu_pertemuan {
        active_model.realisasi_minggu_pertemuan = Set(Some(realisasi_minggu_pertemuan));
    }
    if let Some(id_jenis_evaluasi) = payload.id_jenis_evaluasi {
        active_model.id_jenis_evaluasi = Set(Some(id_jenis_evaluasi));
    }
    if let Some(nama_jenis_evaluasi) = payload.nama_jenis_evaluasi {
        active_model.nama_jenis_evaluasi = Set(Some(nama_jenis_evaluasi));
    }
    if let Some(id_prodi) = payload.id_prodi {
        active_model.id_prodi = Set(Some(id_prodi));
    }
    if let Some(id_semester) = payload.id_semester {
        active_model.id_semester = Set(Some(id_semester));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(DosenPengajarKelasKuliahResponse {
            id: item.id,
            id_aktivitas_mengajar: item.id_aktivitas_mengajar,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nuptk: item.nuptk,
            nama_dosen: item.nama_dosen,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            id_substansi: item.id_substansi,
            sks_substansi_total: item.sks_substansi_total,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            id_jenis_evaluasi: item.id_jenis_evaluasi,
            nama_jenis_evaluasi: item.nama_jenis_evaluasi,
            id_prodi: item.id_prodi,
            id_semester: item.id_semester,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - DosenPengajarKelasKuliah"), status_codes(200, 400, 404, 500))]
pub async fn delete_dosen_pengajar_kelas_kuliah(
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
        .ok_or_else(|| StatusError::not_found().brief("DosenPengajarKelasKuliah not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "DosenPengajarKelasKuliah deleted successfully".to_string(),
    }))
}
