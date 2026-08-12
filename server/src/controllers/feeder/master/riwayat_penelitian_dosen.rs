use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::riwayat_penelitian_dosen::{
    CreateRiwayatPenelitianDosenRequest, RiwayatPenelitianDosenQuery, RiwayatPenelitianDosenResponse, PaginatedRiwayatPenelitianDosenResponse,
    UpdateRiwayatPenelitianDosenRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::riwayat_penelitian_dosen as entity_mod;

#[endpoint(tags("Feeder - Master - RiwayatPenelitianDosen"), status_codes(200, 500))]
pub async fn list_riwayat_penelitian_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRiwayatPenelitianDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RiwayatPenelitianDosenQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RiwayatPenelitianDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_penelitian: item.id_penelitian,
            judul_penelitian: item.judul_penelitian,
            id_kelompok_bidang: item.id_kelompok_bidang,
            kode_kelompok_bidang: item.kode_kelompok_bidang,
            nama_kelompok_bidang: item.nama_kelompok_bidang,
            id_lembaga_iptek: item.id_lembaga_iptek,
            nama_lembaga_iptek: item.nama_lembaga_iptek,
            tahun_kegiatan: item.tahun_kegiatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }).collect();

    Ok(Json(PaginatedRiwayatPenelitianDosenResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - RiwayatPenelitianDosen"), status_codes(200, 400, 404, 500))]
pub async fn get_riwayat_penelitian_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatPenelitianDosenResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("RiwayatPenelitianDosen not found"))?;

    Ok(Json(RiwayatPenelitianDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_penelitian: item.id_penelitian,
            judul_penelitian: item.judul_penelitian,
            id_kelompok_bidang: item.id_kelompok_bidang,
            kode_kelompok_bidang: item.kode_kelompok_bidang,
            nama_kelompok_bidang: item.nama_kelompok_bidang,
            id_lembaga_iptek: item.id_lembaga_iptek,
            nama_lembaga_iptek: item.nama_lembaga_iptek,
            tahun_kegiatan: item.tahun_kegiatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

    }))
}#[endpoint(tags("Feeder - Master - RiwayatPenelitianDosen"), status_codes(200, 400, 500))]
pub async fn create_riwayat_penelitian_dosen(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatPenelitianDosenResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRiwayatPenelitianDosenRequest = req.parse_json().await.map_err(|e| {
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
        id_penelitian: Set(payload.id_penelitian),
        judul_penelitian: Set(payload.judul_penelitian),
        id_kelompok_bidang: Set(payload.id_kelompok_bidang),
        kode_kelompok_bidang: Set(payload.kode_kelompok_bidang),
        nama_kelompok_bidang: Set(payload.nama_kelompok_bidang),
        id_lembaga_iptek: Set(payload.id_lembaga_iptek),
        nama_lembaga_iptek: Set(payload.nama_lembaga_iptek),
        tahun_kegiatan: Set(payload.tahun_kegiatan),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        nuptk: Set(payload.nuptk),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatPenelitianDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_penelitian: item.id_penelitian,
            judul_penelitian: item.judul_penelitian,
            id_kelompok_bidang: item.id_kelompok_bidang,
            kode_kelompok_bidang: item.kode_kelompok_bidang,
            nama_kelompok_bidang: item.nama_kelompok_bidang,
            id_lembaga_iptek: item.id_lembaga_iptek,
            nama_lembaga_iptek: item.nama_lembaga_iptek,
            tahun_kegiatan: item.tahun_kegiatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

        }))
}

#[endpoint(tags("Feeder - Master - RiwayatPenelitianDosen"), status_codes(200, 400, 404, 500))]
pub async fn update_riwayat_penelitian_dosen(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatPenelitianDosenResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRiwayatPenelitianDosenRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("RiwayatPenelitianDosen not found"))?;

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
    if let Some(id_penelitian) = payload.id_penelitian {
            active_model.id_penelitian = Set(Some(id_penelitian));
        }
    if let Some(judul_penelitian) = payload.judul_penelitian {
            active_model.judul_penelitian = Set(Some(judul_penelitian));
        }
    if let Some(id_kelompok_bidang) = payload.id_kelompok_bidang {
            active_model.id_kelompok_bidang = Set(Some(id_kelompok_bidang));
        }
    if let Some(kode_kelompok_bidang) = payload.kode_kelompok_bidang {
            active_model.kode_kelompok_bidang = Set(Some(kode_kelompok_bidang));
        }
    if let Some(nama_kelompok_bidang) = payload.nama_kelompok_bidang {
            active_model.nama_kelompok_bidang = Set(Some(nama_kelompok_bidang));
        }
    if let Some(id_lembaga_iptek) = payload.id_lembaga_iptek {
            active_model.id_lembaga_iptek = Set(Some(id_lembaga_iptek));
        }
    if let Some(nama_lembaga_iptek) = payload.nama_lembaga_iptek {
            active_model.nama_lembaga_iptek = Set(Some(nama_lembaga_iptek));
        }
    if let Some(tahun_kegiatan) = payload.tahun_kegiatan {
            active_model.tahun_kegiatan = Set(Some(tahun_kegiatan));
        }
    if let Some(nuptk) = payload.nuptk {
            active_model.nuptk = Set(Some(nuptk));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatPenelitianDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nidn: item.nidn,
            nama_dosen: item.nama_dosen,
            id_penelitian: item.id_penelitian,
            judul_penelitian: item.judul_penelitian,
            id_kelompok_bidang: item.id_kelompok_bidang,
            kode_kelompok_bidang: item.kode_kelompok_bidang,
            nama_kelompok_bidang: item.nama_kelompok_bidang,
            id_lembaga_iptek: item.id_lembaga_iptek,
            nama_lembaga_iptek: item.nama_lembaga_iptek,
            tahun_kegiatan: item.tahun_kegiatan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nuptk: item.nuptk,

        }))
}
#[endpoint(tags("Feeder - Master - RiwayatPenelitianDosen"), status_codes(200, 400, 404, 500))]
pub async fn delete_riwayat_penelitian_dosen(
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
            .ok_or_else(|| StatusError::not_found().brief("RiwayatPenelitianDosen not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "RiwayatPenelitianDosen deleted successfully".to_string(),
        }))
}
