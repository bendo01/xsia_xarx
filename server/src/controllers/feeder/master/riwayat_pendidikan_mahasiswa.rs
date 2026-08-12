use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::riwayat_pendidikan_mahasiswa::{
    CreateRiwayatPendidikanMahasiswaRequest, RiwayatPendidikanMahasiswaQuery, RiwayatPendidikanMahasiswaResponse, PaginatedRiwayatPendidikanMahasiswaResponse,
    UpdateRiwayatPendidikanMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::riwayat_pendidikan_mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - RiwayatPendidikanMahasiswa"), status_codes(200, 500))]
pub async fn list_riwayat_pendidikan_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRiwayatPendidikanMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RiwayatPendidikanMahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RiwayatPendidikanMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_jenis_daftar: item.id_jenis_daftar,
            nama_jenis_daftar: item.nama_jenis_daftar,
            id_jalur_daftar: item.id_jalur_daftar,
            id_periode_masuk: item.id_periode_masuk,
            nama_periode_masuk: item.nama_periode_masuk,
            id_jenis_keluar: item.id_jenis_keluar,
            keterangan_keluar: item.keterangan_keluar,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            sks_diakui: item.sks_diakui,
            id_perguruan_tinggi_asal: item.id_perguruan_tinggi_asal,
            nama_perguruan_tinggi_asal: item.nama_perguruan_tinggi_asal,
            id_prodi_asal: item.id_prodi_asal,
            nama_program_studi_asal: item.nama_program_studi_asal,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_daftar: item.tanggal_daftar,
            nama_ibu_kandung: item.nama_ibu_kandung,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk: item.biaya_masuk,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            nama_pembiayaan_awal: item.nama_pembiayaan_awal,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedRiwayatPendidikanMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - RiwayatPendidikanMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_riwayat_pendidikan_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatPendidikanMahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("RiwayatPendidikanMahasiswa not found"))?;

    Ok(Json(RiwayatPendidikanMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_jenis_daftar: item.id_jenis_daftar,
            nama_jenis_daftar: item.nama_jenis_daftar,
            id_jalur_daftar: item.id_jalur_daftar,
            id_periode_masuk: item.id_periode_masuk,
            nama_periode_masuk: item.nama_periode_masuk,
            id_jenis_keluar: item.id_jenis_keluar,
            keterangan_keluar: item.keterangan_keluar,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            sks_diakui: item.sks_diakui,
            id_perguruan_tinggi_asal: item.id_perguruan_tinggi_asal,
            nama_perguruan_tinggi_asal: item.nama_perguruan_tinggi_asal,
            id_prodi_asal: item.id_prodi_asal,
            nama_program_studi_asal: item.nama_program_studi_asal,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_daftar: item.tanggal_daftar,
            nama_ibu_kandung: item.nama_ibu_kandung,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk: item.biaya_masuk,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            nama_pembiayaan_awal: item.nama_pembiayaan_awal,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - RiwayatPendidikanMahasiswa"), status_codes(200, 400, 500))]
pub async fn create_riwayat_pendidikan_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatPendidikanMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRiwayatPendidikanMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        id_mahasiswa: Set(payload.id_mahasiswa),
        nim: Set(payload.nim),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        id_jenis_daftar: Set(payload.id_jenis_daftar),
        nama_jenis_daftar: Set(payload.nama_jenis_daftar),
        id_jalur_daftar: Set(payload.id_jalur_daftar),
        id_periode_masuk: Set(payload.id_periode_masuk),
        nama_periode_masuk: Set(payload.nama_periode_masuk),
        id_jenis_keluar: Set(payload.id_jenis_keluar),
        keterangan_keluar: Set(payload.keterangan_keluar),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        nama_perguruan_tinggi: Set(payload.nama_perguruan_tinggi),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        sks_diakui: Set(payload.sks_diakui),
        id_perguruan_tinggi_asal: Set(payload.id_perguruan_tinggi_asal),
        nama_perguruan_tinggi_asal: Set(payload.nama_perguruan_tinggi_asal),
        id_prodi_asal: Set(payload.id_prodi_asal),
        nama_program_studi_asal: Set(payload.nama_program_studi_asal),
        jenis_kelamin: Set(payload.jenis_kelamin),
        tanggal_daftar: Set(payload.tanggal_daftar),
        nama_ibu_kandung: Set(payload.nama_ibu_kandung),
        id_pembiayaan: Set(payload.id_pembiayaan),
        biaya_masuk: Set(payload.biaya_masuk),
        id_bidang_minat: Set(payload.id_bidang_minat),
        nm_bidang_minat: Set(payload.nm_bidang_minat),
        id_periode_keluar: Set(payload.id_periode_keluar),
        tanggal_keluar: Set(payload.tanggal_keluar),
        last_update: Set(payload.last_update),
        tgl_create: Set(payload.tgl_create),
        status_sync: Set(payload.status_sync),
        nama_pembiayaan_awal: Set(payload.nama_pembiayaan_awal),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatPendidikanMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_jenis_daftar: item.id_jenis_daftar,
            nama_jenis_daftar: item.nama_jenis_daftar,
            id_jalur_daftar: item.id_jalur_daftar,
            id_periode_masuk: item.id_periode_masuk,
            nama_periode_masuk: item.nama_periode_masuk,
            id_jenis_keluar: item.id_jenis_keluar,
            keterangan_keluar: item.keterangan_keluar,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            sks_diakui: item.sks_diakui,
            id_perguruan_tinggi_asal: item.id_perguruan_tinggi_asal,
            nama_perguruan_tinggi_asal: item.nama_perguruan_tinggi_asal,
            id_prodi_asal: item.id_prodi_asal,
            nama_program_studi_asal: item.nama_program_studi_asal,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_daftar: item.tanggal_daftar,
            nama_ibu_kandung: item.nama_ibu_kandung,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk: item.biaya_masuk,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            nama_pembiayaan_awal: item.nama_pembiayaan_awal,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - RiwayatPendidikanMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_riwayat_pendidikan_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatPendidikanMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRiwayatPendidikanMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("RiwayatPendidikanMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
        }
    if let Some(id_mahasiswa) = payload.id_mahasiswa {
            active_model.id_mahasiswa = Set(Some(id_mahasiswa));
        }
    if let Some(nim) = payload.nim {
            active_model.nim = Set(Some(nim));
        }
    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(id_jenis_daftar) = payload.id_jenis_daftar {
            active_model.id_jenis_daftar = Set(Some(id_jenis_daftar));
        }
    if let Some(nama_jenis_daftar) = payload.nama_jenis_daftar {
            active_model.nama_jenis_daftar = Set(Some(nama_jenis_daftar));
        }
    if let Some(id_jalur_daftar) = payload.id_jalur_daftar {
            active_model.id_jalur_daftar = Set(Some(id_jalur_daftar));
        }
    if let Some(id_periode_masuk) = payload.id_periode_masuk {
            active_model.id_periode_masuk = Set(Some(id_periode_masuk));
        }
    if let Some(nama_periode_masuk) = payload.nama_periode_masuk {
            active_model.nama_periode_masuk = Set(Some(nama_periode_masuk));
        }
    if let Some(id_jenis_keluar) = payload.id_jenis_keluar {
            active_model.id_jenis_keluar = Set(Some(id_jenis_keluar));
        }
    if let Some(keterangan_keluar) = payload.keterangan_keluar {
            active_model.keterangan_keluar = Set(Some(keterangan_keluar));
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
    if let Some(sks_diakui) = payload.sks_diakui {
            active_model.sks_diakui = Set(Some(sks_diakui));
        }
    if let Some(id_perguruan_tinggi_asal) = payload.id_perguruan_tinggi_asal {
            active_model.id_perguruan_tinggi_asal = Set(Some(id_perguruan_tinggi_asal));
        }
    if let Some(nama_perguruan_tinggi_asal) = payload.nama_perguruan_tinggi_asal {
            active_model.nama_perguruan_tinggi_asal = Set(Some(nama_perguruan_tinggi_asal));
        }
    if let Some(id_prodi_asal) = payload.id_prodi_asal {
            active_model.id_prodi_asal = Set(Some(id_prodi_asal));
        }
    if let Some(nama_program_studi_asal) = payload.nama_program_studi_asal {
            active_model.nama_program_studi_asal = Set(Some(nama_program_studi_asal));
        }
    if let Some(jenis_kelamin) = payload.jenis_kelamin {
            active_model.jenis_kelamin = Set(Some(jenis_kelamin));
        }
    if let Some(tanggal_daftar) = payload.tanggal_daftar {
            active_model.tanggal_daftar = Set(Some(tanggal_daftar));
        }
    if let Some(nama_ibu_kandung) = payload.nama_ibu_kandung {
            active_model.nama_ibu_kandung = Set(Some(nama_ibu_kandung));
        }
    if let Some(id_pembiayaan) = payload.id_pembiayaan {
            active_model.id_pembiayaan = Set(Some(id_pembiayaan));
        }
    if let Some(biaya_masuk) = payload.biaya_masuk {
            active_model.biaya_masuk = Set(Some(biaya_masuk));
        }
    if let Some(id_bidang_minat) = payload.id_bidang_minat {
            active_model.id_bidang_minat = Set(Some(id_bidang_minat));
        }
    if let Some(nm_bidang_minat) = payload.nm_bidang_minat {
            active_model.nm_bidang_minat = Set(Some(nm_bidang_minat));
        }
    if let Some(id_periode_keluar) = payload.id_periode_keluar {
            active_model.id_periode_keluar = Set(Some(id_periode_keluar));
        }
    if let Some(tanggal_keluar) = payload.tanggal_keluar {
            active_model.tanggal_keluar = Set(Some(tanggal_keluar));
        }
    if let Some(last_update) = payload.last_update {
            active_model.last_update = Set(Some(last_update));
        }
    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    if let Some(nama_pembiayaan_awal) = payload.nama_pembiayaan_awal {
            active_model.nama_pembiayaan_awal = Set(Some(nama_pembiayaan_awal));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatPendidikanMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_mahasiswa: item.id_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_jenis_daftar: item.id_jenis_daftar,
            nama_jenis_daftar: item.nama_jenis_daftar,
            id_jalur_daftar: item.id_jalur_daftar,
            id_periode_masuk: item.id_periode_masuk,
            nama_periode_masuk: item.nama_periode_masuk,
            id_jenis_keluar: item.id_jenis_keluar,
            keterangan_keluar: item.keterangan_keluar,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            sks_diakui: item.sks_diakui,
            id_perguruan_tinggi_asal: item.id_perguruan_tinggi_asal,
            nama_perguruan_tinggi_asal: item.nama_perguruan_tinggi_asal,
            id_prodi_asal: item.id_prodi_asal,
            nama_program_studi_asal: item.nama_program_studi_asal,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_daftar: item.tanggal_daftar,
            nama_ibu_kandung: item.nama_ibu_kandung,
            id_pembiayaan: item.id_pembiayaan,
            biaya_masuk: item.biaya_masuk,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            nama_pembiayaan_awal: item.nama_pembiayaan_awal,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - RiwayatPendidikanMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_riwayat_pendidikan_mahasiswa(
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
            .ok_or_else(|| StatusError::not_found().brief("RiwayatPendidikanMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "RiwayatPendidikanMahasiswa deleted successfully".to_string(),
        }))
}
