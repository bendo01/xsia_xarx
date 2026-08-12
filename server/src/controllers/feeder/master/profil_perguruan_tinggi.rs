use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::profil_perguruan_tinggi::{
    CreateProfilPerguruanTinggiRequest, ProfilPerguruanTinggiQuery, ProfilPerguruanTinggiResponse, PaginatedProfilPerguruanTinggiResponse,
    UpdateProfilPerguruanTinggiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::profil_perguruan_tinggi as entity_mod;

#[endpoint(tags("Feeder - Master - ProfilPerguruanTinggi"), status_codes(200, 500))]
pub async fn list_profil_perguruan_tinggi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedProfilPerguruanTinggiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ProfilPerguruanTinggiQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| ProfilPerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            telepon: item.telepon,
            faximile: item.faximile,
            email: item.email,
            website: item.website,
            jalan: item.jalan,
            dusun: item.dusun,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            lintang_bujur: item.lintang_bujur,
            bank: item.bank,
            unit_cabang: item.unit_cabang,
            nomor_rekening: item.nomor_rekening,
            mbs: item.mbs,
            luas_tanah_milik: item.luas_tanah_milik,
            luas_tanah_bukan_milik: item.luas_tanah_bukan_milik,
            sk_pendirian: item.sk_pendirian,
            id_status_milik: item.id_status_milik,
            nama_status_milik: item.nama_status_milik,
            status_perguruan_tinggi: item.status_perguruan_tinggi,
            sk_izin_operasional: item.sk_izin_operasional,
            tanggal_izin_operasional: item.tanggal_izin_operasional,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nama_singkat: item.nama_singkat,
            rt_rw: item.rt_rw,
            tanggal_sk_pendirian: item.tanggal_sk_pendirian,

    }).collect();

    Ok(Json(PaginatedProfilPerguruanTinggiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - ProfilPerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn get_profil_perguruan_tinggi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ProfilPerguruanTinggiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("ProfilPerguruanTinggi not found"))?;

    Ok(Json(ProfilPerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            telepon: item.telepon,
            faximile: item.faximile,
            email: item.email,
            website: item.website,
            jalan: item.jalan,
            dusun: item.dusun,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            lintang_bujur: item.lintang_bujur,
            bank: item.bank,
            unit_cabang: item.unit_cabang,
            nomor_rekening: item.nomor_rekening,
            mbs: item.mbs,
            luas_tanah_milik: item.luas_tanah_milik,
            luas_tanah_bukan_milik: item.luas_tanah_bukan_milik,
            sk_pendirian: item.sk_pendirian,
            id_status_milik: item.id_status_milik,
            nama_status_milik: item.nama_status_milik,
            status_perguruan_tinggi: item.status_perguruan_tinggi,
            sk_izin_operasional: item.sk_izin_operasional,
            tanggal_izin_operasional: item.tanggal_izin_operasional,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nama_singkat: item.nama_singkat,
            rt_rw: item.rt_rw,
            tanggal_sk_pendirian: item.tanggal_sk_pendirian,

    }))
}#[endpoint(tags("Feeder - Master - ProfilPerguruanTinggi"), status_codes(200, 400, 500))]
pub async fn create_profil_perguruan_tinggi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ProfilPerguruanTinggiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateProfilPerguruanTinggiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        kode_perguruan_tinggi: Set(payload.kode_perguruan_tinggi),
        nama_perguruan_tinggi: Set(payload.nama_perguruan_tinggi),
        telepon: Set(payload.telepon),
        faximile: Set(payload.faximile),
        email: Set(payload.email),
        website: Set(payload.website),
        jalan: Set(payload.jalan),
        dusun: Set(payload.dusun),
        kelurahan: Set(payload.kelurahan),
        kode_pos: Set(payload.kode_pos),
        id_wilayah: Set(payload.id_wilayah),
        nama_wilayah: Set(payload.nama_wilayah),
        lintang_bujur: Set(payload.lintang_bujur),
        bank: Set(payload.bank),
        unit_cabang: Set(payload.unit_cabang),
        nomor_rekening: Set(payload.nomor_rekening),
        mbs: Set(payload.mbs),
        luas_tanah_milik: Set(payload.luas_tanah_milik),
        luas_tanah_bukan_milik: Set(payload.luas_tanah_bukan_milik),
        sk_pendirian: Set(payload.sk_pendirian),
        id_status_milik: Set(payload.id_status_milik),
        nama_status_milik: Set(payload.nama_status_milik),
        status_perguruan_tinggi: Set(payload.status_perguruan_tinggi),
        sk_izin_operasional: Set(payload.sk_izin_operasional),
        tanggal_izin_operasional: Set(payload.tanggal_izin_operasional),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        nama_singkat: Set(payload.nama_singkat),
        rt_rw: Set(payload.rt_rw),
        tanggal_sk_pendirian: Set(payload.tanggal_sk_pendirian),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ProfilPerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            telepon: item.telepon,
            faximile: item.faximile,
            email: item.email,
            website: item.website,
            jalan: item.jalan,
            dusun: item.dusun,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            lintang_bujur: item.lintang_bujur,
            bank: item.bank,
            unit_cabang: item.unit_cabang,
            nomor_rekening: item.nomor_rekening,
            mbs: item.mbs,
            luas_tanah_milik: item.luas_tanah_milik,
            luas_tanah_bukan_milik: item.luas_tanah_bukan_milik,
            sk_pendirian: item.sk_pendirian,
            id_status_milik: item.id_status_milik,
            nama_status_milik: item.nama_status_milik,
            status_perguruan_tinggi: item.status_perguruan_tinggi,
            sk_izin_operasional: item.sk_izin_operasional,
            tanggal_izin_operasional: item.tanggal_izin_operasional,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nama_singkat: item.nama_singkat,
            rt_rw: item.rt_rw,
            tanggal_sk_pendirian: item.tanggal_sk_pendirian,

        }))
}

#[endpoint(tags("Feeder - Master - ProfilPerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn update_profil_perguruan_tinggi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ProfilPerguruanTinggiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateProfilPerguruanTinggiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("ProfilPerguruanTinggi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_perguruan_tinggi) = payload.id_perguruan_tinggi {
            active_model.id_perguruan_tinggi = Set(Some(id_perguruan_tinggi));
        }
    if let Some(kode_perguruan_tinggi) = payload.kode_perguruan_tinggi {
            active_model.kode_perguruan_tinggi = Set(Some(kode_perguruan_tinggi));
        }
    if let Some(nama_perguruan_tinggi) = payload.nama_perguruan_tinggi {
            active_model.nama_perguruan_tinggi = Set(Some(nama_perguruan_tinggi));
        }
    if let Some(telepon) = payload.telepon {
            active_model.telepon = Set(Some(telepon));
        }
    if let Some(faximile) = payload.faximile {
            active_model.faximile = Set(Some(faximile));
        }
    if let Some(email) = payload.email {
            active_model.email = Set(Some(email));
        }
    if let Some(website) = payload.website {
            active_model.website = Set(Some(website));
        }
    if let Some(jalan) = payload.jalan {
            active_model.jalan = Set(Some(jalan));
        }
    if let Some(dusun) = payload.dusun {
            active_model.dusun = Set(Some(dusun));
        }
    if let Some(kelurahan) = payload.kelurahan {
            active_model.kelurahan = Set(Some(kelurahan));
        }
    if let Some(kode_pos) = payload.kode_pos {
            active_model.kode_pos = Set(Some(kode_pos));
        }
    if let Some(id_wilayah) = payload.id_wilayah {
            active_model.id_wilayah = Set(Some(id_wilayah));
        }
    if let Some(nama_wilayah) = payload.nama_wilayah {
            active_model.nama_wilayah = Set(Some(nama_wilayah));
        }
    if let Some(lintang_bujur) = payload.lintang_bujur {
            active_model.lintang_bujur = Set(Some(lintang_bujur));
        }
    if let Some(bank) = payload.bank {
            active_model.bank = Set(Some(bank));
        }
    if let Some(unit_cabang) = payload.unit_cabang {
            active_model.unit_cabang = Set(Some(unit_cabang));
        }
    if let Some(nomor_rekening) = payload.nomor_rekening {
            active_model.nomor_rekening = Set(Some(nomor_rekening));
        }
    if let Some(mbs) = payload.mbs {
            active_model.mbs = Set(Some(mbs));
        }
    if let Some(luas_tanah_milik) = payload.luas_tanah_milik {
            active_model.luas_tanah_milik = Set(Some(luas_tanah_milik));
        }
    if let Some(luas_tanah_bukan_milik) = payload.luas_tanah_bukan_milik {
            active_model.luas_tanah_bukan_milik = Set(Some(luas_tanah_bukan_milik));
        }
    if let Some(sk_pendirian) = payload.sk_pendirian {
            active_model.sk_pendirian = Set(Some(sk_pendirian));
        }
    if let Some(id_status_milik) = payload.id_status_milik {
            active_model.id_status_milik = Set(Some(id_status_milik));
        }
    if let Some(nama_status_milik) = payload.nama_status_milik {
            active_model.nama_status_milik = Set(Some(nama_status_milik));
        }
    if let Some(status_perguruan_tinggi) = payload.status_perguruan_tinggi {
            active_model.status_perguruan_tinggi = Set(Some(status_perguruan_tinggi));
        }
    if let Some(sk_izin_operasional) = payload.sk_izin_operasional {
            active_model.sk_izin_operasional = Set(Some(sk_izin_operasional));
        }
    if let Some(tanggal_izin_operasional) = payload.tanggal_izin_operasional {
            active_model.tanggal_izin_operasional = Set(Some(tanggal_izin_operasional));
        }
    if let Some(nama_singkat) = payload.nama_singkat {
            active_model.nama_singkat = Set(Some(nama_singkat));
        }
    if let Some(rt_rw) = payload.rt_rw {
            active_model.rt_rw = Set(Some(rt_rw));
        }
    if let Some(tanggal_sk_pendirian) = payload.tanggal_sk_pendirian {
            active_model.tanggal_sk_pendirian = Set(Some(tanggal_sk_pendirian));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ProfilPerguruanTinggiResponse {
            id: item.id,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            kode_perguruan_tinggi: item.kode_perguruan_tinggi,
            nama_perguruan_tinggi: item.nama_perguruan_tinggi,
            telepon: item.telepon,
            faximile: item.faximile,
            email: item.email,
            website: item.website,
            jalan: item.jalan,
            dusun: item.dusun,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            lintang_bujur: item.lintang_bujur,
            bank: item.bank,
            unit_cabang: item.unit_cabang,
            nomor_rekening: item.nomor_rekening,
            mbs: item.mbs,
            luas_tanah_milik: item.luas_tanah_milik,
            luas_tanah_bukan_milik: item.luas_tanah_bukan_milik,
            sk_pendirian: item.sk_pendirian,
            id_status_milik: item.id_status_milik,
            nama_status_milik: item.nama_status_milik,
            status_perguruan_tinggi: item.status_perguruan_tinggi,
            sk_izin_operasional: item.sk_izin_operasional,
            tanggal_izin_operasional: item.tanggal_izin_operasional,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            nama_singkat: item.nama_singkat,
            rt_rw: item.rt_rw,
            tanggal_sk_pendirian: item.tanggal_sk_pendirian,

        }))
}
#[endpoint(tags("Feeder - Master - ProfilPerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn delete_profil_perguruan_tinggi(
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
            .ok_or_else(|| StatusError::not_found().brief("ProfilPerguruanTinggi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "ProfilPerguruanTinggi deleted successfully".to_string(),
        }))
}
