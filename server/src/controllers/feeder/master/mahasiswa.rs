use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::mahasiswa::{
    CreateMahasiswaRequest, MahasiswaQuery, MahasiswaResponse, PaginatedMahasiswaResponse,
    UpdateMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - Mahasiswa"), status_codes(200, 500))]
pub async fn list_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: MahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| MahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_lahir: item.tanggal_lahir,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nipd: item.nipd,
            ipk: item.ipk,
            total_sks: item.total_sks,
            id_sms: item.id_sms,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nama_program_studi: item.nama_program_studi,
            id_status_mahasiswa: item.id_status_mahasiswa,
            nama_status_mahasiswa: item.nama_status_mahasiswa,
            nim: item.nim,
            id_periode: item.id_periode,
            nama_periode_masuk: item.nama_periode_masuk,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,

    }).collect();

    Ok(Json(PaginatedMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - Mahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Mahasiswa not found"))?;

    Ok(Json(MahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_lahir: item.tanggal_lahir,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nipd: item.nipd,
            ipk: item.ipk,
            total_sks: item.total_sks,
            id_sms: item.id_sms,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nama_program_studi: item.nama_program_studi,
            id_status_mahasiswa: item.id_status_mahasiswa,
            nama_status_mahasiswa: item.nama_status_mahasiswa,
            nim: item.nim,
            id_periode: item.id_periode,
            nama_periode_masuk: item.nama_periode_masuk,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,

    }))
}#[endpoint(tags("Feeder - Master - Mahasiswa"), status_codes(200, 400, 500))]
pub async fn create_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        jenis_kelamin: Set(payload.jenis_kelamin),
        tanggal_lahir: Set(payload.tanggal_lahir),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        nipd: Set(payload.nipd),
        ipk: Set(payload.ipk),
        total_sks: Set(payload.total_sks),
        id_sms: Set(payload.id_sms),
        id_mahasiswa: Set(payload.id_mahasiswa),
        id_agama: Set(payload.id_agama),
        nama_agama: Set(payload.nama_agama),
        nama_program_studi: Set(payload.nama_program_studi),
        id_status_mahasiswa: Set(payload.id_status_mahasiswa),
        nama_status_mahasiswa: Set(payload.nama_status_mahasiswa),
        nim: Set(payload.nim),
        id_periode: Set(payload.id_periode),
        nama_periode_masuk: Set(payload.nama_periode_masuk),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        id_periode_keluar: Set(payload.id_periode_keluar),
        tanggal_keluar: Set(payload.tanggal_keluar),
        last_update: Set(payload.last_update),
        tgl_create: Set(payload.tgl_create),
        status_sync: Set(payload.status_sync),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_prodi: Set(payload.id_prodi),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_lahir: item.tanggal_lahir,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nipd: item.nipd,
            ipk: item.ipk,
            total_sks: item.total_sks,
            id_sms: item.id_sms,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nama_program_studi: item.nama_program_studi,
            id_status_mahasiswa: item.id_status_mahasiswa,
            nama_status_mahasiswa: item.nama_status_mahasiswa,
            nim: item.nim,
            id_periode: item.id_periode,
            nama_periode_masuk: item.nama_periode_masuk,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,

        }))
}

#[endpoint(tags("Feeder - Master - Mahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Mahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(jenis_kelamin) = payload.jenis_kelamin {
            active_model.jenis_kelamin = Set(Some(jenis_kelamin));
        }
    if let Some(tanggal_lahir) = payload.tanggal_lahir {
            active_model.tanggal_lahir = Set(Some(tanggal_lahir));
        }
    if let Some(id_perguruan_tinggi) = payload.id_perguruan_tinggi {
            active_model.id_perguruan_tinggi = Set(Some(id_perguruan_tinggi));
        }
    if let Some(nipd) = payload.nipd {
            active_model.nipd = Set(Some(nipd));
        }
    if let Some(ipk) = payload.ipk {
            active_model.ipk = Set(Some(ipk));
        }
    if let Some(total_sks) = payload.total_sks {
            active_model.total_sks = Set(Some(total_sks));
        }
    if let Some(id_sms) = payload.id_sms {
            active_model.id_sms = Set(Some(id_sms));
        }
    if let Some(id_mahasiswa) = payload.id_mahasiswa {
            active_model.id_mahasiswa = Set(Some(id_mahasiswa));
        }
    if let Some(id_agama) = payload.id_agama {
            active_model.id_agama = Set(Some(id_agama));
        }
    if let Some(nama_agama) = payload.nama_agama {
            active_model.nama_agama = Set(Some(nama_agama));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(id_status_mahasiswa) = payload.id_status_mahasiswa {
            active_model.id_status_mahasiswa = Set(Some(id_status_mahasiswa));
        }
    if let Some(nama_status_mahasiswa) = payload.nama_status_mahasiswa {
            active_model.nama_status_mahasiswa = Set(Some(nama_status_mahasiswa));
        }
    if let Some(nim) = payload.nim {
            active_model.nim = Set(Some(nim));
        }
    if let Some(id_periode) = payload.id_periode {
            active_model.id_periode = Set(Some(id_periode));
        }
    if let Some(nama_periode_masuk) = payload.nama_periode_masuk {
            active_model.nama_periode_masuk = Set(Some(nama_periode_masuk));
        }
    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
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
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tanggal_lahir: item.tanggal_lahir,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            nipd: item.nipd,
            ipk: item.ipk,
            total_sks: item.total_sks,
            id_sms: item.id_sms,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nama_program_studi: item.nama_program_studi,
            id_status_mahasiswa: item.id_status_mahasiswa,
            nama_status_mahasiswa: item.nama_status_mahasiswa,
            nim: item.nim,
            id_periode: item.id_periode,
            nama_periode_masuk: item.nama_periode_masuk,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_periode_keluar: item.id_periode_keluar,
            tanggal_keluar: item.tanggal_keluar,
            last_update: item.last_update,
            tgl_create: item.tgl_create,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_prodi: item.id_prodi,

        }))
}
#[endpoint(tags("Feeder - Master - Mahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_mahasiswa(
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
            .ok_or_else(|| StatusError::not_found().brief("Mahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Mahasiswa deleted successfully".to_string(),
        }))
}
