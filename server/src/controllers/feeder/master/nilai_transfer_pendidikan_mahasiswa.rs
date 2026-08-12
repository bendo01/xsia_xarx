use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::nilai_transfer_pendidikan_mahasiswa::{
    CreateNilaiTransferPendidikanMahasiswaRequest, NilaiTransferPendidikanMahasiswaQuery, NilaiTransferPendidikanMahasiswaResponse, PaginatedNilaiTransferPendidikanMahasiswaResponse,
    UpdateNilaiTransferPendidikanMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::nilai_transfer_pendidikan_mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - NilaiTransferPendidikanMahasiswa"), status_codes(200, 500))]
pub async fn list_nilai_transfer_pendidikan_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedNilaiTransferPendidikanMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: NilaiTransferPendidikanMahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| NilaiTransferPendidikanMahasiswaResponse {
            id: item.id,
            id_transfer: item.id_transfer,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode_masuk: item.id_periode_masuk,
            kode_mata_kuliah_asal: item.kode_mata_kuliah_asal,
            nama_mata_kuliah_asal: item.nama_mata_kuliah_asal,
            sks_mata_kuliah_asal: item.sks_mata_kuliah_asal,
            nilai_huruf_asal: item.nilai_huruf_asal,
            id_matkul: item.id_matkul,
            kode_matkul_diakui: item.kode_matkul_diakui,
            nama_mata_kuliah_diakui: item.nama_mata_kuliah_diakui,
            sks_mata_kuliah_diakui: item.sks_mata_kuliah_diakui,
            nilai_huruf_diakui: item.nilai_huruf_diakui,
            nilai_angka_diakui: item.nilai_angka_diakui,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedNilaiTransferPendidikanMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - NilaiTransferPendidikanMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_nilai_transfer_pendidikan_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<NilaiTransferPendidikanMahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("NilaiTransferPendidikanMahasiswa not found"))?;

    Ok(Json(NilaiTransferPendidikanMahasiswaResponse {
            id: item.id,
            id_transfer: item.id_transfer,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode_masuk: item.id_periode_masuk,
            kode_mata_kuliah_asal: item.kode_mata_kuliah_asal,
            nama_mata_kuliah_asal: item.nama_mata_kuliah_asal,
            sks_mata_kuliah_asal: item.sks_mata_kuliah_asal,
            nilai_huruf_asal: item.nilai_huruf_asal,
            id_matkul: item.id_matkul,
            kode_matkul_diakui: item.kode_matkul_diakui,
            nama_mata_kuliah_diakui: item.nama_mata_kuliah_diakui,
            sks_mata_kuliah_diakui: item.sks_mata_kuliah_diakui,
            nilai_huruf_diakui: item.nilai_huruf_diakui,
            nilai_angka_diakui: item.nilai_angka_diakui,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - NilaiTransferPendidikanMahasiswa"), status_codes(200, 400, 500))]
pub async fn create_nilai_transfer_pendidikan_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<NilaiTransferPendidikanMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateNilaiTransferPendidikanMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_transfer: Set(payload.id_transfer),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        nim: Set(payload.nim),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_periode_masuk: Set(payload.id_periode_masuk),
        kode_mata_kuliah_asal: Set(payload.kode_mata_kuliah_asal),
        nama_mata_kuliah_asal: Set(payload.nama_mata_kuliah_asal),
        sks_mata_kuliah_asal: Set(payload.sks_mata_kuliah_asal),
        nilai_huruf_asal: Set(payload.nilai_huruf_asal),
        id_matkul: Set(payload.id_matkul),
        kode_matkul_diakui: Set(payload.kode_matkul_diakui),
        nama_mata_kuliah_diakui: Set(payload.nama_mata_kuliah_diakui),
        sks_mata_kuliah_diakui: Set(payload.sks_mata_kuliah_diakui),
        nilai_huruf_diakui: Set(payload.nilai_huruf_diakui),
        nilai_angka_diakui: Set(payload.nilai_angka_diakui),
        id_perguruan_tinggi: Set(payload.id_perguruan_tinggi),
        id_aktivitas: Set(payload.id_aktivitas),
        judul: Set(payload.judul),
        id_jenis_aktivitas: Set(payload.id_jenis_aktivitas),
        nama_jenis_aktivitas: Set(payload.nama_jenis_aktivitas),
        id_semester: Set(payload.id_semester),
        nama_semester: Set(payload.nama_semester),
        status_sync: Set(payload.status_sync),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(NilaiTransferPendidikanMahasiswaResponse {
            id: item.id,
            id_transfer: item.id_transfer,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode_masuk: item.id_periode_masuk,
            kode_mata_kuliah_asal: item.kode_mata_kuliah_asal,
            nama_mata_kuliah_asal: item.nama_mata_kuliah_asal,
            sks_mata_kuliah_asal: item.sks_mata_kuliah_asal,
            nilai_huruf_asal: item.nilai_huruf_asal,
            id_matkul: item.id_matkul,
            kode_matkul_diakui: item.kode_matkul_diakui,
            nama_mata_kuliah_diakui: item.nama_mata_kuliah_diakui,
            sks_mata_kuliah_diakui: item.sks_mata_kuliah_diakui,
            nilai_huruf_diakui: item.nilai_huruf_diakui,
            nilai_angka_diakui: item.nilai_angka_diakui,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - NilaiTransferPendidikanMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_nilai_transfer_pendidikan_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<NilaiTransferPendidikanMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateNilaiTransferPendidikanMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("NilaiTransferPendidikanMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_transfer) = payload.id_transfer {
            active_model.id_transfer = Set(Some(id_transfer));
        }
    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
        }
    if let Some(nim) = payload.nim {
            active_model.nim = Set(Some(nim));
        }
    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(id_periode_masuk) = payload.id_periode_masuk {
            active_model.id_periode_masuk = Set(Some(id_periode_masuk));
        }
    if let Some(kode_mata_kuliah_asal) = payload.kode_mata_kuliah_asal {
            active_model.kode_mata_kuliah_asal = Set(Some(kode_mata_kuliah_asal));
        }
    if let Some(nama_mata_kuliah_asal) = payload.nama_mata_kuliah_asal {
            active_model.nama_mata_kuliah_asal = Set(Some(nama_mata_kuliah_asal));
        }
    if let Some(sks_mata_kuliah_asal) = payload.sks_mata_kuliah_asal {
            active_model.sks_mata_kuliah_asal = Set(Some(sks_mata_kuliah_asal));
        }
    if let Some(nilai_huruf_asal) = payload.nilai_huruf_asal {
            active_model.nilai_huruf_asal = Set(Some(nilai_huruf_asal));
        }
    if let Some(id_matkul) = payload.id_matkul {
            active_model.id_matkul = Set(Some(id_matkul));
        }
    if let Some(kode_matkul_diakui) = payload.kode_matkul_diakui {
            active_model.kode_matkul_diakui = Set(Some(kode_matkul_diakui));
        }
    if let Some(nama_mata_kuliah_diakui) = payload.nama_mata_kuliah_diakui {
            active_model.nama_mata_kuliah_diakui = Set(Some(nama_mata_kuliah_diakui));
        }
    if let Some(sks_mata_kuliah_diakui) = payload.sks_mata_kuliah_diakui {
            active_model.sks_mata_kuliah_diakui = Set(Some(sks_mata_kuliah_diakui));
        }
    if let Some(nilai_huruf_diakui) = payload.nilai_huruf_diakui {
            active_model.nilai_huruf_diakui = Set(Some(nilai_huruf_diakui));
        }
    if let Some(nilai_angka_diakui) = payload.nilai_angka_diakui {
            active_model.nilai_angka_diakui = Set(Some(nilai_angka_diakui));
        }
    if let Some(id_perguruan_tinggi) = payload.id_perguruan_tinggi {
            active_model.id_perguruan_tinggi = Set(Some(id_perguruan_tinggi));
        }
    if let Some(id_aktivitas) = payload.id_aktivitas {
            active_model.id_aktivitas = Set(Some(id_aktivitas));
        }
    if let Some(judul) = payload.judul {
            active_model.judul = Set(Some(judul));
        }
    if let Some(id_jenis_aktivitas) = payload.id_jenis_aktivitas {
            active_model.id_jenis_aktivitas = Set(Some(id_jenis_aktivitas));
        }
    if let Some(nama_jenis_aktivitas) = payload.nama_jenis_aktivitas {
            active_model.nama_jenis_aktivitas = Set(Some(nama_jenis_aktivitas));
        }
    if let Some(id_semester) = payload.id_semester {
            active_model.id_semester = Set(Some(id_semester));
        }
    if let Some(nama_semester) = payload.nama_semester {
            active_model.nama_semester = Set(Some(nama_semester));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(NilaiTransferPendidikanMahasiswaResponse {
            id: item.id,
            id_transfer: item.id_transfer,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            nim: item.nim,
            nama_mahasiswa: item.nama_mahasiswa,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_periode_masuk: item.id_periode_masuk,
            kode_mata_kuliah_asal: item.kode_mata_kuliah_asal,
            nama_mata_kuliah_asal: item.nama_mata_kuliah_asal,
            sks_mata_kuliah_asal: item.sks_mata_kuliah_asal,
            nilai_huruf_asal: item.nilai_huruf_asal,
            id_matkul: item.id_matkul,
            kode_matkul_diakui: item.kode_matkul_diakui,
            nama_mata_kuliah_diakui: item.nama_mata_kuliah_diakui,
            sks_mata_kuliah_diakui: item.sks_mata_kuliah_diakui,
            nilai_huruf_diakui: item.nilai_huruf_diakui,
            nilai_angka_diakui: item.nilai_angka_diakui,
            id_perguruan_tinggi: item.id_perguruan_tinggi,
            id_aktivitas: item.id_aktivitas,
            judul: item.judul,
            id_jenis_aktivitas: item.id_jenis_aktivitas,
            nama_jenis_aktivitas: item.nama_jenis_aktivitas,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - NilaiTransferPendidikanMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_nilai_transfer_pendidikan_mahasiswa(
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
            .ok_or_else(|| StatusError::not_found().brief("NilaiTransferPendidikanMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "NilaiTransferPendidikanMahasiswa deleted successfully".to_string(),
        }))
}
