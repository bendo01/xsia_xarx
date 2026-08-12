use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::riwayat_nilai_mahasiswa::{
    CreateRiwayatNilaiMahasiswaRequest, RiwayatNilaiMahasiswaQuery, RiwayatNilaiMahasiswaResponse, PaginatedRiwayatNilaiMahasiswaResponse,
    UpdateRiwayatNilaiMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::riwayat_nilai_mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - RiwayatNilaiMahasiswa"), status_codes(200, 500))]
pub async fn list_riwayat_nilai_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedRiwayatNilaiMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: RiwayatNilaiMahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| RiwayatNilaiMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode: item.id_periode,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            nilai_angka: item.nilai_angka,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedRiwayatNilaiMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - RiwayatNilaiMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_riwayat_nilai_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<RiwayatNilaiMahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("RiwayatNilaiMahasiswa not found"))?;

    Ok(Json(RiwayatNilaiMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode: item.id_periode,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            nilai_angka: item.nilai_angka,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - RiwayatNilaiMahasiswa"), status_codes(200, 400, 500))]
pub async fn create_riwayat_nilai_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatNilaiMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateRiwayatNilaiMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_periode: Set(payload.id_periode),
        id_matkul: Set(payload.id_matkul),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        id_kelas: Set(payload.id_kelas),
        nama_kelas_kuliah: Set(payload.nama_kelas_kuliah),
        sks_mata_kuliah: Set(payload.sks_mata_kuliah),
        nilai_angka: Set(payload.nilai_angka),
        nilai_huruf: Set(payload.nilai_huruf),
        nilai_indeks: Set(payload.nilai_indeks),
        nim: Set(payload.nim),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        angkatan: Set(payload.angkatan),
        status_sync: Set(payload.status_sync),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatNilaiMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode: item.id_periode,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            nilai_angka: item.nilai_angka,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - RiwayatNilaiMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_riwayat_nilai_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<RiwayatNilaiMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateRiwayatNilaiMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("RiwayatNilaiMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(id_periode) = payload.id_periode {
            active_model.id_periode = Set(Some(id_periode));
        }
    if let Some(id_matkul) = payload.id_matkul {
            active_model.id_matkul = Set(Some(id_matkul));
        }
    if let Some(nama_mata_kuliah) = payload.nama_mata_kuliah {
            active_model.nama_mata_kuliah = Set(Some(nama_mata_kuliah));
        }
    if let Some(id_kelas) = payload.id_kelas {
            active_model.id_kelas = Set(Some(id_kelas));
        }
    if let Some(nama_kelas_kuliah) = payload.nama_kelas_kuliah {
            active_model.nama_kelas_kuliah = Set(Some(nama_kelas_kuliah));
        }
    if let Some(sks_mata_kuliah) = payload.sks_mata_kuliah {
            active_model.sks_mata_kuliah = Set(Some(sks_mata_kuliah));
        }
    if let Some(nilai_angka) = payload.nilai_angka {
            active_model.nilai_angka = Set(Some(nilai_angka));
        }
    if let Some(nilai_huruf) = payload.nilai_huruf {
            active_model.nilai_huruf = Set(Some(nilai_huruf));
        }
    if let Some(nilai_indeks) = payload.nilai_indeks {
            active_model.nilai_indeks = Set(Some(nilai_indeks));
        }
    if let Some(nim) = payload.nim {
            active_model.nim = Set(Some(nim));
        }
    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(angkatan) = payload.angkatan {
            active_model.angkatan = Set(Some(angkatan));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(RiwayatNilaiMahasiswaResponse {
            id: item.id,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode: item.id_periode,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            nilai_angka: item.nilai_angka,
            nilai_huruf: item.nilai_huruf,
            nilai_indeks: item.nilai_indeks,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            angkatan: item.angkatan,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - RiwayatNilaiMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_riwayat_nilai_mahasiswa(
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
            .ok_or_else(|| StatusError::not_found().brief("RiwayatNilaiMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "RiwayatNilaiMahasiswa deleted successfully".to_string(),
        }))
}
