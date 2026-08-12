use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::aktifitas_mahasiswa::{
    CreateAktifitasMahasiswaRequest, AktifitasMahasiswaQuery, AktifitasMahasiswaResponse, PaginatedAktifitasMahasiswaResponse,
    UpdateAktifitasMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::aktifitas_mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - AktifitasMahasiswa"), status_codes(200, 500))]
pub async fn list_aktifitas_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedAktifitasMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: AktifitasMahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| AktifitasMahasiswaResponse {
            id: item.id,
            asal_data: item.asal_data,
            nm_asaldata: item.nm_asaldata,
            id_aktivitas: item.id_aktivitas,
            jenis_anggota: item.jenis_anggota,
            nama_jenis_anggota: item.nama_jenis_anggota,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_prodi: item.id_prodi,
            nama_prodi: item.nama_prodi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            judul: item.judul,
            keterangan: item.keterangan,
            lokasi: item.lokasi,
            sk_tugas: item.sk_tugas,
            tanggal_sk_tugas: item.tanggal_sk_tugas,
            untuk_kampus_merdeka: item.untuk_kampus_merdeka,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedAktifitasMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - AktifitasMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_aktifitas_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AktifitasMahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("AktifitasMahasiswa not found"))?;

    Ok(Json(AktifitasMahasiswaResponse {
            id: item.id,
            asal_data: item.asal_data,
            nm_asaldata: item.nm_asaldata,
            id_aktivitas: item.id_aktivitas,
            jenis_anggota: item.jenis_anggota,
            nama_jenis_anggota: item.nama_jenis_anggota,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_prodi: item.id_prodi,
            nama_prodi: item.nama_prodi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            judul: item.judul,
            keterangan: item.keterangan,
            lokasi: item.lokasi,
            sk_tugas: item.sk_tugas,
            tanggal_sk_tugas: item.tanggal_sk_tugas,
            untuk_kampus_merdeka: item.untuk_kampus_merdeka,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - AktifitasMahasiswa"), status_codes(200, 400, 500))]
pub async fn create_aktifitas_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AktifitasMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateAktifitasMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        asal_data: Set(payload.asal_data),
        nm_asaldata: Set(payload.nm_asaldata),
        id_aktivitas: Set(payload.id_aktivitas),
        jenis_anggota: Set(payload.jenis_anggota),
        nama_jenis_anggota: Set(payload.nama_jenis_anggota),
        id_jenis_aktivitas: Set(payload.id_jenis_aktivitas),
        nama_jenis_aktivitas: Set(payload.nama_jenis_aktivitas),
        id_prodi: Set(payload.id_prodi),
        nama_prodi: Set(payload.nama_prodi),
        id_semester: Set(payload.id_semester),
        nama_semester: Set(payload.nama_semester),
        judul: Set(payload.judul),
        keterangan: Set(payload.keterangan),
        lokasi: Set(payload.lokasi),
        sk_tugas: Set(payload.sk_tugas),
        tanggal_sk_tugas: Set(payload.tanggal_sk_tugas),
        untuk_kampus_merdeka: Set(payload.untuk_kampus_merdeka),
        tanggal_mulai: Set(payload.tanggal_mulai),
        tanggal_selesai: Set(payload.tanggal_selesai),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AktifitasMahasiswaResponse {
            id: item.id,
            asal_data: item.asal_data,
            nm_asaldata: item.nm_asaldata,
            id_aktivitas: item.id_aktivitas,
            jenis_anggota: item.jenis_anggota,
            nama_jenis_anggota: item.nama_jenis_anggota,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_prodi: item.id_prodi,
            nama_prodi: item.nama_prodi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            judul: item.judul,
            keterangan: item.keterangan,
            lokasi: item.lokasi,
            sk_tugas: item.sk_tugas,
            tanggal_sk_tugas: item.tanggal_sk_tugas,
            untuk_kampus_merdeka: item.untuk_kampus_merdeka,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - AktifitasMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_aktifitas_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AktifitasMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateAktifitasMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("AktifitasMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(asal_data) = payload.asal_data {
            active_model.asal_data = Set(Some(asal_data));
        }
    if let Some(nm_asaldata) = payload.nm_asaldata {
            active_model.nm_asaldata = Set(Some(nm_asaldata));
        }
    if let Some(id_aktivitas) = payload.id_aktivitas {
            active_model.id_aktivitas = Set(Some(id_aktivitas));
        }
    if let Some(jenis_anggota) = payload.jenis_anggota {
            active_model.jenis_anggota = Set(Some(jenis_anggota));
        }
    if let Some(nama_jenis_anggota) = payload.nama_jenis_anggota {
            active_model.nama_jenis_anggota = Set(Some(nama_jenis_anggota));
        }
    if let Some(id_jenis_aktivitas) = payload.id_jenis_aktivitas {
            active_model.id_jenis_aktivitas = Set(Some(id_jenis_aktivitas));
        }
    if let Some(nama_jenis_aktivitas) = payload.nama_jenis_aktivitas {
            active_model.nama_jenis_aktivitas = Set(Some(nama_jenis_aktivitas));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_prodi) = payload.nama_prodi {
            active_model.nama_prodi = Set(Some(nama_prodi));
        }
    if let Some(id_semester) = payload.id_semester {
            active_model.id_semester = Set(Some(id_semester));
        }
    if let Some(nama_semester) = payload.nama_semester {
            active_model.nama_semester = Set(Some(nama_semester));
        }
    if let Some(judul) = payload.judul {
            active_model.judul = Set(Some(judul));
        }
    if let Some(keterangan) = payload.keterangan {
            active_model.keterangan = Set(Some(keterangan));
        }
    if let Some(lokasi) = payload.lokasi {
            active_model.lokasi = Set(Some(lokasi));
        }
    if let Some(sk_tugas) = payload.sk_tugas {
            active_model.sk_tugas = Set(Some(sk_tugas));
        }
    if let Some(tanggal_sk_tugas) = payload.tanggal_sk_tugas {
            active_model.tanggal_sk_tugas = Set(Some(tanggal_sk_tugas));
        }
    if let Some(untuk_kampus_merdeka) = payload.untuk_kampus_merdeka {
            active_model.untuk_kampus_merdeka = Set(Some(untuk_kampus_merdeka));
        }
    if let Some(tanggal_mulai) = payload.tanggal_mulai {
            active_model.tanggal_mulai = Set(Some(tanggal_mulai));
        }
    if let Some(tanggal_selesai) = payload.tanggal_selesai {
            active_model.tanggal_selesai = Set(Some(tanggal_selesai));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AktifitasMahasiswaResponse {
            id: item.id,
            asal_data: item.asal_data,
            nm_asaldata: item.nm_asaldata,
            id_aktivitas: item.id_aktivitas,
            jenis_anggota: item.jenis_anggota,
            nama_jenis_anggota: item.nama_jenis_anggota,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_prodi: item.id_prodi,
            nama_prodi: item.nama_prodi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            judul: item.judul,
            keterangan: item.keterangan,
            lokasi: item.lokasi,
            sk_tugas: item.sk_tugas,
            tanggal_sk_tugas: item.tanggal_sk_tugas,
            untuk_kampus_merdeka: item.untuk_kampus_merdeka,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - AktifitasMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_aktifitas_mahasiswa(
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
            .ok_or_else(|| StatusError::not_found().brief("AktifitasMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "AktifitasMahasiswa deleted successfully".to_string(),
        }))
}
