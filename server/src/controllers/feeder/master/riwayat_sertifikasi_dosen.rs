use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::riwayat_sertifikasi_dosen::{
    CreateRiwayatSertifikasiDosenRequest, RiwayatSertifikasiDosenQuery, RiwayatSertifikasiDosenResponse, PaginatedRiwayatSertifikasiDosenResponse,
    UpdateRiwayatSertifikasiDosenRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::riwayat_sertifikasi_dosen as entity_mod;

#[endpoint(tags("Feeder - Master - RiwayatSertifikasiDosen"), status_codes(200, 500))]
pub async fn list_riwayat_sertifikasi_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRiwayatSertifikasiDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RiwayatSertifikasiDosenQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RiwayatSertifikasiDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            nomor_peserta: item.nomor_peserta,
            id_bidang_studi: item.id_bidang_studi,
            nama_bidang_studi: item.nama_bidang_studi,
            id_jenis_sertifikasi: item.id_jenis_sertifikasi,
            nama_jenis_sertifikasi: item.nama_jenis_sertifikasi,
            tahun_sertifikasi: item.tahun_sertifikasi,
            sk_sertifikasi: item.sk_sertifikasi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }).collect();

    Ok(Json(PaginatedRiwayatSertifikasiDosenResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - RiwayatSertifikasiDosen"), status_codes(200, 400, 404, 500))]
pub async fn get_riwayat_sertifikasi_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatSertifikasiDosenResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("RiwayatSertifikasiDosen not found"))?;

    Ok(Json(RiwayatSertifikasiDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            nomor_peserta: item.nomor_peserta,
            id_bidang_studi: item.id_bidang_studi,
            nama_bidang_studi: item.nama_bidang_studi,
            id_jenis_sertifikasi: item.id_jenis_sertifikasi,
            nama_jenis_sertifikasi: item.nama_jenis_sertifikasi,
            tahun_sertifikasi: item.tahun_sertifikasi,
            sk_sertifikasi: item.sk_sertifikasi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }))
}#[endpoint(tags("Feeder - Master - RiwayatSertifikasiDosen"), status_codes(200, 400, 500))]
pub async fn create_riwayat_sertifikasi_dosen(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatSertifikasiDosenResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRiwayatSertifikasiDosenRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_dosen: Set(payload.id_dosen),
        nidn: Set(payload.nidn),
        nama_dosen: Set(payload.nama_dosen),
        nomor_peserta: Set(payload.nomor_peserta),
        id_bidang_studi: Set(payload.id_bidang_studi),
        nama_bidang_studi: Set(payload.nama_bidang_studi),
        id_jenis_sertifikasi: Set(payload.id_jenis_sertifikasi),
        nama_jenis_sertifikasi: Set(payload.nama_jenis_sertifikasi),
        tahun_sertifikasi: Set(payload.tahun_sertifikasi),
        sk_sertifikasi: Set(payload.sk_sertifikasi),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        nuptk: Set(payload.nuptk),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatSertifikasiDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            nomor_peserta: item.nomor_peserta,
            id_bidang_studi: item.id_bidang_studi,
            nama_bidang_studi: item.nama_bidang_studi,
            id_jenis_sertifikasi: item.id_jenis_sertifikasi,
            nama_jenis_sertifikasi: item.nama_jenis_sertifikasi,
            tahun_sertifikasi: item.tahun_sertifikasi,
            sk_sertifikasi: item.sk_sertifikasi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

        }))
}

#[endpoint(tags("Feeder - Master - RiwayatSertifikasiDosen"), status_codes(200, 400, 404, 500))]
pub async fn update_riwayat_sertifikasi_dosen(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatSertifikasiDosenResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRiwayatSertifikasiDosenRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("RiwayatSertifikasiDosen not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_dosen) = payload.id_dosen {
            active_model.id_dosen = Set(Some(id_dosen));
        }
    if let Some(nidn) = payload.nidn {
            active_model.nidn = Set(Some(nidn));
        }
    if let Some(nama_dosen) = payload.nama_dosen {
            active_model.nama_dosen = Set(Some(nama_dosen));
        }
    if let Some(nomor_peserta) = payload.nomor_peserta {
            active_model.nomor_peserta = Set(Some(nomor_peserta));
        }
    if let Some(id_bidang_studi) = payload.id_bidang_studi {
            active_model.id_bidang_studi = Set(Some(id_bidang_studi));
        }
    if let Some(nama_bidang_studi) = payload.nama_bidang_studi {
            active_model.nama_bidang_studi = Set(Some(nama_bidang_studi));
        }
    if let Some(id_jenis_sertifikasi) = payload.id_jenis_sertifikasi {
            active_model.id_jenis_sertifikasi = Set(Some(id_jenis_sertifikasi));
        }
    if let Some(nama_jenis_sertifikasi) = payload.nama_jenis_sertifikasi {
            active_model.nama_jenis_sertifikasi = Set(Some(nama_jenis_sertifikasi));
        }
    if let Some(tahun_sertifikasi) = payload.tahun_sertifikasi {
            active_model.tahun_sertifikasi = Set(Some(tahun_sertifikasi));
        }
    if let Some(sk_sertifikasi) = payload.sk_sertifikasi {
            active_model.sk_sertifikasi = Set(Some(sk_sertifikasi));
        }
    if let Some(nuptk) = payload.nuptk {
            active_model.nuptk = Set(Some(nuptk));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatSertifikasiDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            nomor_peserta: item.nomor_peserta,
            id_bidang_studi: item.id_bidang_studi,
            nama_bidang_studi: item.nama_bidang_studi,
            id_jenis_sertifikasi: item.id_jenis_sertifikasi,
            nama_jenis_sertifikasi: item.nama_jenis_sertifikasi,
            tahun_sertifikasi: item.tahun_sertifikasi,
            sk_sertifikasi: item.sk_sertifikasi,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

        }))
}
#[endpoint(tags("Feeder - Master - RiwayatSertifikasiDosen"), status_codes(200, 400, 404, 500))]
pub async fn delete_riwayat_sertifikasi_dosen(
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
            .ok_or_else(|| StatusError::not_found().brief("RiwayatSertifikasiDosen not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "RiwayatSertifikasiDosen deleted successfully".to_string(),
        }))
}
