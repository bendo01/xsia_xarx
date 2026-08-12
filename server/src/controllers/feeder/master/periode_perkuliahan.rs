use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::periode_perkuliahan::{
    CreatePeriodePerkuliahanRequest, PeriodePerkuliahanQuery, PeriodePerkuliahanResponse, PaginatedPeriodePerkuliahanResponse,
    UpdatePeriodePerkuliahanRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::periode_perkuliahan as entity_mod;

#[endpoint(tags("Feeder - Master - PeriodePerkuliahan"), status_codes(200, 500))]
pub async fn list_periode_perkuliahan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPeriodePerkuliahanResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PeriodePerkuliahanQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PeriodePerkuliahanResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            jumlah_pendaftar_ikut_seleksi: item.jumlah_pendaftar_ikut_seleksi,
            jumlah_pendaftar_lulus_seleksi: item.jumlah_pendaftar_lulus_seleksi,
            jumlah_daftar_ulang: item.jumlah_daftar_ulang,
            jumlah_mengundurkan_diri: item.jumlah_mengundurkan_diri,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            jumlah_minggu_pertemuan: item.jumlah_minggu_pertemuan,
            metode_kul: item.metode_kul,
            metode_kul_eks: item.metode_kul_eks,
            tgl_create: item.tgl_create,
            last_update: item.last_update,
            status_sync: item.status_sync,

    }).collect();

    Ok(Json(PaginatedPeriodePerkuliahanResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - PeriodePerkuliahan"), status_codes(200, 400, 404, 500))]
pub async fn get_periode_perkuliahan(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PeriodePerkuliahanResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PeriodePerkuliahan not found"))?;

    Ok(Json(PeriodePerkuliahanResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            jumlah_pendaftar_ikut_seleksi: item.jumlah_pendaftar_ikut_seleksi,
            jumlah_pendaftar_lulus_seleksi: item.jumlah_pendaftar_lulus_seleksi,
            jumlah_daftar_ulang: item.jumlah_daftar_ulang,
            jumlah_mengundurkan_diri: item.jumlah_mengundurkan_diri,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            jumlah_minggu_pertemuan: item.jumlah_minggu_pertemuan,
            metode_kul: item.metode_kul,
            metode_kul_eks: item.metode_kul_eks,
            tgl_create: item.tgl_create,
            last_update: item.last_update,
            status_sync: item.status_sync,

    }))
}#[endpoint(tags("Feeder - Master - PeriodePerkuliahan"), status_codes(200, 400, 500))]
pub async fn create_periode_perkuliahan(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PeriodePerkuliahanResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreatePeriodePerkuliahanRequest = req.parse_json().await.map_err(|e| {
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
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_semester: Set(payload.id_semester),
        nama_semester: Set(payload.nama_semester),
        jumlah_target_mahasiswa_baru: Set(payload.jumlah_target_mahasiswa_baru),
        jumlah_pendaftar_ikut_seleksi: Set(payload.jumlah_pendaftar_ikut_seleksi),
        jumlah_pendaftar_lulus_seleksi: Set(payload.jumlah_pendaftar_lulus_seleksi),
        jumlah_daftar_ulang: Set(payload.jumlah_daftar_ulang),
        jumlah_mengundurkan_diri: Set(payload.jumlah_mengundurkan_diri),
        tanggal_awal_perkuliahan: Set(payload.tanggal_awal_perkuliahan),
        tanggal_akhir_perkuliahan: Set(payload.tanggal_akhir_perkuliahan),
        jumlah_minggu_pertemuan: Set(payload.jumlah_minggu_pertemuan),
        metode_kul: Set(payload.metode_kul),
        metode_kul_eks: Set(payload.metode_kul_eks),
        tgl_create: Set(payload.tgl_create),
        last_update: Set(payload.last_update),
        status_sync: Set(payload.status_sync),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PeriodePerkuliahanResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            jumlah_pendaftar_ikut_seleksi: item.jumlah_pendaftar_ikut_seleksi,
            jumlah_pendaftar_lulus_seleksi: item.jumlah_pendaftar_lulus_seleksi,
            jumlah_daftar_ulang: item.jumlah_daftar_ulang,
            jumlah_mengundurkan_diri: item.jumlah_mengundurkan_diri,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            jumlah_minggu_pertemuan: item.jumlah_minggu_pertemuan,
            metode_kul: item.metode_kul,
            metode_kul_eks: item.metode_kul_eks,
            tgl_create: item.tgl_create,
            last_update: item.last_update,
            status_sync: item.status_sync,

        }))
}

#[endpoint(tags("Feeder - Master - PeriodePerkuliahan"), status_codes(200, 400, 404, 500))]
pub async fn update_periode_perkuliahan(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PeriodePerkuliahanResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdatePeriodePerkuliahanRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("PeriodePerkuliahan not found"))?;

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
    if let Some(jumlah_pendaftar_ikut_seleksi) = payload.jumlah_pendaftar_ikut_seleksi {
            active_model.jumlah_pendaftar_ikut_seleksi = Set(Some(jumlah_pendaftar_ikut_seleksi));
        }
    if let Some(jumlah_pendaftar_lulus_seleksi) = payload.jumlah_pendaftar_lulus_seleksi {
            active_model.jumlah_pendaftar_lulus_seleksi = Set(Some(jumlah_pendaftar_lulus_seleksi));
        }
    if let Some(jumlah_daftar_ulang) = payload.jumlah_daftar_ulang {
            active_model.jumlah_daftar_ulang = Set(Some(jumlah_daftar_ulang));
        }
    if let Some(jumlah_mengundurkan_diri) = payload.jumlah_mengundurkan_diri {
            active_model.jumlah_mengundurkan_diri = Set(Some(jumlah_mengundurkan_diri));
        }
    if let Some(tanggal_awal_perkuliahan) = payload.tanggal_awal_perkuliahan {
            active_model.tanggal_awal_perkuliahan = Set(Some(tanggal_awal_perkuliahan));
        }
    if let Some(tanggal_akhir_perkuliahan) = payload.tanggal_akhir_perkuliahan {
            active_model.tanggal_akhir_perkuliahan = Set(Some(tanggal_akhir_perkuliahan));
        }
    if let Some(jumlah_minggu_pertemuan) = payload.jumlah_minggu_pertemuan {
            active_model.jumlah_minggu_pertemuan = Set(Some(jumlah_minggu_pertemuan));
        }
    if let Some(metode_kul) = payload.metode_kul {
            active_model.metode_kul = Set(Some(metode_kul));
        }
    if let Some(metode_kul_eks) = payload.metode_kul_eks {
            active_model.metode_kul_eks = Set(Some(metode_kul_eks));
        }
    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    if let Some(last_update) = payload.last_update {
            active_model.last_update = Set(Some(last_update));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PeriodePerkuliahanResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            jumlah_target_mahasiswa_baru: item.jumlah_target_mahasiswa_baru,
            jumlah_pendaftar_ikut_seleksi: item.jumlah_pendaftar_ikut_seleksi,
            jumlah_pendaftar_lulus_seleksi: item.jumlah_pendaftar_lulus_seleksi,
            jumlah_daftar_ulang: item.jumlah_daftar_ulang,
            jumlah_mengundurkan_diri: item.jumlah_mengundurkan_diri,
            tanggal_awal_perkuliahan: item.tanggal_awal_perkuliahan,
            tanggal_akhir_perkuliahan: item.tanggal_akhir_perkuliahan,
            jumlah_minggu_pertemuan: item.jumlah_minggu_pertemuan,
            metode_kul: item.metode_kul,
            metode_kul_eks: item.metode_kul_eks,
            tgl_create: item.tgl_create,
            last_update: item.last_update,
            status_sync: item.status_sync,

        }))
}
#[endpoint(tags("Feeder - Master - PeriodePerkuliahan"), status_codes(200, 400, 404, 500))]
pub async fn delete_periode_perkuliahan(
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
            .ok_or_else(|| StatusError::not_found().brief("PeriodePerkuliahan not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "PeriodePerkuliahan deleted successfully".to_string(),
        }))
}
