use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::penugasan_dosen::{
    CreatePenugasanDosenRequest, PenugasanDosenQuery, PenugasanDosenResponse, PaginatedPenugasanDosenResponse,
    UpdatePenugasanDosenRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::penugasan_dosen as entity_mod;

#[endpoint(tags("Feeder - Master - PenugasanDosen"), status_codes(200, 500))]
pub async fn list_penugasan_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPenugasanDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PenugasanDosenQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PenugasanDosenResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jenis_kelamin: item.jenis_kelamin,
            nidn: item.nidn,
            nuptk: item.nuptk,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_tahun_ajaran: item.nama_tahun_ajaran,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nomor_surat_tugas: item.nomor_surat_tugas,
            tanggal_surat_tugas: item.tanggal_surat_tugas,
            mulai_surat_tugas: item.mulai_surat_tugas,
            tgl_create: item.tgl_create,
            tgl_ptk_keluar: item.tgl_ptk_keluar,
            id_stat_pegawai: item.id_stat_pegawai,
            id_jns_keluar: item.id_jns_keluar,
            id_ikatan_kerja: item.id_ikatan_kerja,
            apakah_homebase: item.apakah_homebase,

    }).collect();

    Ok(Json(PaginatedPenugasanDosenResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - PenugasanDosen"), status_codes(200, 400, 404, 500))]
pub async fn get_penugasan_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PenugasanDosenResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PenugasanDosen not found"))?;

    Ok(Json(PenugasanDosenResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jenis_kelamin: item.jenis_kelamin,
            nidn: item.nidn,
            nuptk: item.nuptk,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_tahun_ajaran: item.nama_tahun_ajaran,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nomor_surat_tugas: item.nomor_surat_tugas,
            tanggal_surat_tugas: item.tanggal_surat_tugas,
            mulai_surat_tugas: item.mulai_surat_tugas,
            tgl_create: item.tgl_create,
            tgl_ptk_keluar: item.tgl_ptk_keluar,
            id_stat_pegawai: item.id_stat_pegawai,
            id_jns_keluar: item.id_jns_keluar,
            id_ikatan_kerja: item.id_ikatan_kerja,
            apakah_homebase: item.apakah_homebase,

    }))
}#[endpoint(tags("Feeder - Master - PenugasanDosen"), status_codes(200, 400, 500))]
pub async fn create_penugasan_dosen(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PenugasanDosenResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreatePenugasanDosenRequest = req.parse_json().await.map_err(|e| {
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
        id_registrasi_dosen: Set(payload.id_registrasi_dosen),
        id_dosen: Set(payload.id_dosen),
        nama_dosen: Set(payload.nama_dosen),
        jenis_kelamin: Set(payload.jenis_kelamin),
        nidn: Set(payload.nidn),
        nuptk: Set(payload.nuptk),
        id_tahun_ajaran: Set(payload.id_tahun_ajaran),
        nama_tahun_ajaran: Set(payload.nama_tahun_ajaran),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        nama_perguruan_tinggi: Set(payload.nama_perguruan_tinggi),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        nomor_surat_tugas: Set(payload.nomor_surat_tugas),
        tanggal_surat_tugas: Set(payload.tanggal_surat_tugas),
        mulai_surat_tugas: Set(payload.mulai_surat_tugas),
        tgl_create: Set(payload.tgl_create),
        tgl_ptk_keluar: Set(payload.tgl_ptk_keluar),
        id_stat_pegawai: Set(payload.id_stat_pegawai),
        id_jns_keluar: Set(payload.id_jns_keluar),
        id_ikatan_kerja: Set(payload.id_ikatan_kerja),
        apakah_homebase: Set(payload.apakah_homebase),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PenugasanDosenResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jenis_kelamin: item.jenis_kelamin,
            nidn: item.nidn,
            nuptk: item.nuptk,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_tahun_ajaran: item.nama_tahun_ajaran,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nomor_surat_tugas: item.nomor_surat_tugas,
            tanggal_surat_tugas: item.tanggal_surat_tugas,
            mulai_surat_tugas: item.mulai_surat_tugas,
            tgl_create: item.tgl_create,
            tgl_ptk_keluar: item.tgl_ptk_keluar,
            id_stat_pegawai: item.id_stat_pegawai,
            id_jns_keluar: item.id_jns_keluar,
            id_ikatan_kerja: item.id_ikatan_kerja,
            apakah_homebase: item.apakah_homebase,

        }))
}

#[endpoint(tags("Feeder - Master - PenugasanDosen"), status_codes(200, 400, 404, 500))]
pub async fn update_penugasan_dosen(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PenugasanDosenResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdatePenugasanDosenRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("PenugasanDosen not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_registrasi_dosen) = payload.id_registrasi_dosen {
            active_model.id_registrasi_dosen = Set(Some(id_registrasi_dosen));
        }
    if let Some(id_dosen) = payload.id_dosen {
            active_model.id_dosen = Set(Some(id_dosen));
        }
    if let Some(nama_dosen) = payload.nama_dosen {
            active_model.nama_dosen = Set(Some(nama_dosen));
        }
    if let Some(jenis_kelamin) = payload.jenis_kelamin {
            active_model.jenis_kelamin = Set(Some(jenis_kelamin));
        }
    if let Some(nidn) = payload.nidn {
            active_model.nidn = Set(Some(nidn));
        }
    if let Some(nuptk) = payload.nuptk {
            active_model.nuptk = Set(Some(nuptk));
        }
    if let Some(id_tahun_ajaran) = payload.id_tahun_ajaran {
            active_model.id_tahun_ajaran = Set(Some(id_tahun_ajaran));
        }
    if let Some(nama_tahun_ajaran) = payload.nama_tahun_ajaran {
            active_model.nama_tahun_ajaran = Set(Some(nama_tahun_ajaran));
        }
    if let Some(id_perguruan_tinggi) = payload.id_perguruan_tinggi {
            active_model.id_perguruan_tinggi = Set(Some(id_perguruan_tinggi));
        }
    if let Some(nama_perguruan_tinggi) = payload.nama_perguruan_tinggi {
            active_model.nama_perguruan_tinggi = Set(Some(nama_perguruan_tinggi));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(nomor_surat_tugas) = payload.nomor_surat_tugas {
            active_model.nomor_surat_tugas = Set(Some(nomor_surat_tugas));
        }
    if let Some(tanggal_surat_tugas) = payload.tanggal_surat_tugas {
            active_model.tanggal_surat_tugas = Set(Some(tanggal_surat_tugas));
        }
    if let Some(mulai_surat_tugas) = payload.mulai_surat_tugas {
            active_model.mulai_surat_tugas = Set(Some(mulai_surat_tugas));
        }
    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    if let Some(tgl_ptk_keluar) = payload.tgl_ptk_keluar {
            active_model.tgl_ptk_keluar = Set(Some(tgl_ptk_keluar));
        }
    if let Some(id_stat_pegawai) = payload.id_stat_pegawai {
            active_model.id_stat_pegawai = Set(Some(id_stat_pegawai));
        }
    if let Some(id_jns_keluar) = payload.id_jns_keluar {
            active_model.id_jns_keluar = Set(Some(id_jns_keluar));
        }
    if let Some(id_ikatan_kerja) = payload.id_ikatan_kerja {
            active_model.id_ikatan_kerja = Set(Some(id_ikatan_kerja));
        }
    if let Some(apakah_homebase) = payload.apakah_homebase {
            active_model.apakah_homebase = Set(Some(apakah_homebase));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PenugasanDosenResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jenis_kelamin: item.jenis_kelamin,
            nidn: item.nidn,
            nuptk: item.nuptk,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_tahun_ajaran: item.nama_tahun_ajaran,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            nomor_surat_tugas: item.nomor_surat_tugas,
            tanggal_surat_tugas: item.tanggal_surat_tugas,
            mulai_surat_tugas: item.mulai_surat_tugas,
            tgl_create: item.tgl_create,
            tgl_ptk_keluar: item.tgl_ptk_keluar,
            id_stat_pegawai: item.id_stat_pegawai,
            id_jns_keluar: item.id_jns_keluar,
            id_ikatan_kerja: item.id_ikatan_kerja,
            apakah_homebase: item.apakah_homebase,

        }))
}
#[endpoint(tags("Feeder - Master - PenugasanDosen"), status_codes(200, 400, 404, 500))]
pub async fn delete_penugasan_dosen(
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
            .ok_or_else(|| StatusError::not_found().brief("PenugasanDosen not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "PenugasanDosen deleted successfully".to_string(),
        }))
}
