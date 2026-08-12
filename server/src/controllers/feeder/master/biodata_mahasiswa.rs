use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::biodata_mahasiswa::{
    CreateBiodataMahasiswaRequest, BiodataMahasiswaQuery, BiodataMahasiswaResponse, PaginatedBiodataMahasiswaResponse,
    UpdateBiodataMahasiswaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::biodata_mahasiswa as entity_mod;

#[endpoint(tags("Feeder - Master - BiodataMahasiswa"), status_codes(200, 500))]
pub async fn list_biodata_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBiodataMahasiswaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BiodataMahasiswaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| BiodataMahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nik: item.nik,
            nisn: item.nisn,
            npwp: item.npwp,
            id_negara: item.id_negara,
            kewarganegaraan: item.kewarganegaraan,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            id_jenis_tinggal: item.id_jenis_tinggal,
            nama_jenis_tinggal: item.nama_jenis_tinggal,
            id_alat_transportasi: item.id_alat_transportasi,
            nama_alat_transportasi: item.nama_alat_transportasi,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            penerima_kps: item.penerima_kps,
            nomor_kps: item.nomor_kps,
            nik_ayah: item.nik_ayah,
            nama_ayah: item.nama_ayah,
            tanggal_lahir_ayah: item.tanggal_lahir_ayah,
            id_pendidikan_ayah: item.id_pendidikan_ayah,
            nama_pendidikan_ayah: item.nama_pendidikan_ayah,
            id_pekerjaan_ayah: item.id_pekerjaan_ayah,
            nama_pekerjaan_ayah: item.nama_pekerjaan_ayah,
            id_penghasilan_ayah: item.id_penghasilan_ayah,
            nama_penghasilan_ayah: item.nama_penghasilan_ayah,
            nik_ibu: item.nik_ibu,
            nama_ibu_kandung: item.nama_ibu_kandung,
            tanggal_lahir_ibu: item.tanggal_lahir_ibu,
            id_pendidikan_ibu: item.id_pendidikan_ibu,
            nama_pendidikan_ibu: item.nama_pendidikan_ibu,
            id_pekerjaan_ibu: item.id_pekerjaan_ibu,
            nama_pekerjaan_ibu: item.nama_pekerjaan_ibu,
            id_penghasilan_ibu: item.id_penghasilan_ibu,
            nama_penghasilan_ibu: item.nama_penghasilan_ibu,
            nama_wali: item.nama_wali,
            tanggal_lahir_wali: item.tanggal_lahir_wali,
            id_pendidikan_wali: item.id_pendidikan_wali,
            nama_pendidikan_wali: item.nama_pendidikan_wali,
            id_pekerjaan_wali: item.id_pekerjaan_wali,
            nama_pekerjaan_wali: item.nama_pekerjaan_wali,
            id_penghasilan_wali: item.id_penghasilan_wali,
            nama_penghasilan_wali: item.nama_penghasilan_wali,
            id_kebutuhan_khusus_mahasiswa: item.id_kebutuhan_khusus_mahasiswa,
            nama_kebutuhan_khusus_mahasiswa: item.nama_kebutuhan_khusus_mahasiswa,
            id_kebutuhan_khusus_ayah: item.id_kebutuhan_khusus_ayah,
            nama_kebutuhan_khusus_ayah: item.nama_kebutuhan_khusus_ayah,
            id_kebutuhan_khusus_ibu: item.id_kebutuhan_khusus_ibu,
            nama_kebutuhan_khusus_ibu: item.nama_kebutuhan_khusus_ibu,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedBiodataMahasiswaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - BiodataMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn get_biodata_mahasiswa(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataMahasiswaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("BiodataMahasiswa not found"))?;

    Ok(Json(BiodataMahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nik: item.nik,
            nisn: item.nisn,
            npwp: item.npwp,
            id_negara: item.id_negara,
            kewarganegaraan: item.kewarganegaraan,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            id_jenis_tinggal: item.id_jenis_tinggal,
            nama_jenis_tinggal: item.nama_jenis_tinggal,
            id_alat_transportasi: item.id_alat_transportasi,
            nama_alat_transportasi: item.nama_alat_transportasi,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            penerima_kps: item.penerima_kps,
            nomor_kps: item.nomor_kps,
            nik_ayah: item.nik_ayah,
            nama_ayah: item.nama_ayah,
            tanggal_lahir_ayah: item.tanggal_lahir_ayah,
            id_pendidikan_ayah: item.id_pendidikan_ayah,
            nama_pendidikan_ayah: item.nama_pendidikan_ayah,
            id_pekerjaan_ayah: item.id_pekerjaan_ayah,
            nama_pekerjaan_ayah: item.nama_pekerjaan_ayah,
            id_penghasilan_ayah: item.id_penghasilan_ayah,
            nama_penghasilan_ayah: item.nama_penghasilan_ayah,
            nik_ibu: item.nik_ibu,
            nama_ibu_kandung: item.nama_ibu_kandung,
            tanggal_lahir_ibu: item.tanggal_lahir_ibu,
            id_pendidikan_ibu: item.id_pendidikan_ibu,
            nama_pendidikan_ibu: item.nama_pendidikan_ibu,
            id_pekerjaan_ibu: item.id_pekerjaan_ibu,
            nama_pekerjaan_ibu: item.nama_pekerjaan_ibu,
            id_penghasilan_ibu: item.id_penghasilan_ibu,
            nama_penghasilan_ibu: item.nama_penghasilan_ibu,
            nama_wali: item.nama_wali,
            tanggal_lahir_wali: item.tanggal_lahir_wali,
            id_pendidikan_wali: item.id_pendidikan_wali,
            nama_pendidikan_wali: item.nama_pendidikan_wali,
            id_pekerjaan_wali: item.id_pekerjaan_wali,
            nama_pekerjaan_wali: item.nama_pekerjaan_wali,
            id_penghasilan_wali: item.id_penghasilan_wali,
            nama_penghasilan_wali: item.nama_penghasilan_wali,
            id_kebutuhan_khusus_mahasiswa: item.id_kebutuhan_khusus_mahasiswa,
            nama_kebutuhan_khusus_mahasiswa: item.nama_kebutuhan_khusus_mahasiswa,
            id_kebutuhan_khusus_ayah: item.id_kebutuhan_khusus_ayah,
            nama_kebutuhan_khusus_ayah: item.nama_kebutuhan_khusus_ayah,
            id_kebutuhan_khusus_ibu: item.id_kebutuhan_khusus_ibu,
            nama_kebutuhan_khusus_ibu: item.nama_kebutuhan_khusus_ibu,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - BiodataMahasiswa"), status_codes(200, 400, 500))]
pub async fn create_biodata_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BiodataMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateBiodataMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        nama_mahasiswa: Set(payload.nama_mahasiswa),
        jenis_kelamin: Set(payload.jenis_kelamin),
        tempat_lahir: Set(payload.tempat_lahir),
        tanggal_lahir: Set(payload.tanggal_lahir),
        id_mahasiswa: Set(payload.id_mahasiswa),
        id_agama: Set(payload.id_agama),
        nama_agama: Set(payload.nama_agama),
        nik: Set(payload.nik),
        nisn: Set(payload.nisn),
        npwp: Set(payload.npwp),
        id_negara: Set(payload.id_negara),
        kewarganegaraan: Set(payload.kewarganegaraan),
        jalan: Set(payload.jalan),
        dusun: Set(payload.dusun),
        rt: Set(payload.rt),
        rw: Set(payload.rw),
        kelurahan: Set(payload.kelurahan),
        kode_pos: Set(payload.kode_pos),
        id_wilayah: Set(payload.id_wilayah),
        nama_wilayah: Set(payload.nama_wilayah),
        id_jenis_tinggal: Set(payload.id_jenis_tinggal),
        nama_jenis_tinggal: Set(payload.nama_jenis_tinggal),
        id_alat_transportasi: Set(payload.id_alat_transportasi),
        nama_alat_transportasi: Set(payload.nama_alat_transportasi),
        telepon: Set(payload.telepon),
        handphone: Set(payload.handphone),
        email: Set(payload.email),
        penerima_kps: Set(payload.penerima_kps),
        nomor_kps: Set(payload.nomor_kps),
        nik_ayah: Set(payload.nik_ayah),
        nama_ayah: Set(payload.nama_ayah),
        tanggal_lahir_ayah: Set(payload.tanggal_lahir_ayah),
        id_pendidikan_ayah: Set(payload.id_pendidikan_ayah),
        nama_pendidikan_ayah: Set(payload.nama_pendidikan_ayah),
        id_pekerjaan_ayah: Set(payload.id_pekerjaan_ayah),
        nama_pekerjaan_ayah: Set(payload.nama_pekerjaan_ayah),
        id_penghasilan_ayah: Set(payload.id_penghasilan_ayah),
        nama_penghasilan_ayah: Set(payload.nama_penghasilan_ayah),
        nik_ibu: Set(payload.nik_ibu),
        nama_ibu_kandung: Set(payload.nama_ibu_kandung),
        tanggal_lahir_ibu: Set(payload.tanggal_lahir_ibu),
        id_pendidikan_ibu: Set(payload.id_pendidikan_ibu),
        nama_pendidikan_ibu: Set(payload.nama_pendidikan_ibu),
        id_pekerjaan_ibu: Set(payload.id_pekerjaan_ibu),
        nama_pekerjaan_ibu: Set(payload.nama_pekerjaan_ibu),
        id_penghasilan_ibu: Set(payload.id_penghasilan_ibu),
        nama_penghasilan_ibu: Set(payload.nama_penghasilan_ibu),
        nama_wali: Set(payload.nama_wali),
        tanggal_lahir_wali: Set(payload.tanggal_lahir_wali),
        id_pendidikan_wali: Set(payload.id_pendidikan_wali),
        nama_pendidikan_wali: Set(payload.nama_pendidikan_wali),
        id_pekerjaan_wali: Set(payload.id_pekerjaan_wali),
        nama_pekerjaan_wali: Set(payload.nama_pekerjaan_wali),
        id_penghasilan_wali: Set(payload.id_penghasilan_wali),
        nama_penghasilan_wali: Set(payload.nama_penghasilan_wali),
        id_kebutuhan_khusus_mahasiswa: Set(payload.id_kebutuhan_khusus_mahasiswa),
        nama_kebutuhan_khusus_mahasiswa: Set(payload.nama_kebutuhan_khusus_mahasiswa),
        id_kebutuhan_khusus_ayah: Set(payload.id_kebutuhan_khusus_ayah),
        nama_kebutuhan_khusus_ayah: Set(payload.nama_kebutuhan_khusus_ayah),
        id_kebutuhan_khusus_ibu: Set(payload.id_kebutuhan_khusus_ibu),
        nama_kebutuhan_khusus_ibu: Set(payload.nama_kebutuhan_khusus_ibu),
        status_sync: Set(payload.status_sync),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BiodataMahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nik: item.nik,
            nisn: item.nisn,
            npwp: item.npwp,
            id_negara: item.id_negara,
            kewarganegaraan: item.kewarganegaraan,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            id_jenis_tinggal: item.id_jenis_tinggal,
            nama_jenis_tinggal: item.nama_jenis_tinggal,
            id_alat_transportasi: item.id_alat_transportasi,
            nama_alat_transportasi: item.nama_alat_transportasi,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            penerima_kps: item.penerima_kps,
            nomor_kps: item.nomor_kps,
            nik_ayah: item.nik_ayah,
            nama_ayah: item.nama_ayah,
            tanggal_lahir_ayah: item.tanggal_lahir_ayah,
            id_pendidikan_ayah: item.id_pendidikan_ayah,
            nama_pendidikan_ayah: item.nama_pendidikan_ayah,
            id_pekerjaan_ayah: item.id_pekerjaan_ayah,
            nama_pekerjaan_ayah: item.nama_pekerjaan_ayah,
            id_penghasilan_ayah: item.id_penghasilan_ayah,
            nama_penghasilan_ayah: item.nama_penghasilan_ayah,
            nik_ibu: item.nik_ibu,
            nama_ibu_kandung: item.nama_ibu_kandung,
            tanggal_lahir_ibu: item.tanggal_lahir_ibu,
            id_pendidikan_ibu: item.id_pendidikan_ibu,
            nama_pendidikan_ibu: item.nama_pendidikan_ibu,
            id_pekerjaan_ibu: item.id_pekerjaan_ibu,
            nama_pekerjaan_ibu: item.nama_pekerjaan_ibu,
            id_penghasilan_ibu: item.id_penghasilan_ibu,
            nama_penghasilan_ibu: item.nama_penghasilan_ibu,
            nama_wali: item.nama_wali,
            tanggal_lahir_wali: item.tanggal_lahir_wali,
            id_pendidikan_wali: item.id_pendidikan_wali,
            nama_pendidikan_wali: item.nama_pendidikan_wali,
            id_pekerjaan_wali: item.id_pekerjaan_wali,
            nama_pekerjaan_wali: item.nama_pekerjaan_wali,
            id_penghasilan_wali: item.id_penghasilan_wali,
            nama_penghasilan_wali: item.nama_penghasilan_wali,
            id_kebutuhan_khusus_mahasiswa: item.id_kebutuhan_khusus_mahasiswa,
            nama_kebutuhan_khusus_mahasiswa: item.nama_kebutuhan_khusus_mahasiswa,
            id_kebutuhan_khusus_ayah: item.id_kebutuhan_khusus_ayah,
            nama_kebutuhan_khusus_ayah: item.nama_kebutuhan_khusus_ayah,
            id_kebutuhan_khusus_ibu: item.id_kebutuhan_khusus_ibu,
            nama_kebutuhan_khusus_ibu: item.nama_kebutuhan_khusus_ibu,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - BiodataMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn update_biodata_mahasiswa(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BiodataMahasiswaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateBiodataMahasiswaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("BiodataMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(nama_mahasiswa) = payload.nama_mahasiswa {
            active_model.nama_mahasiswa = Set(Some(nama_mahasiswa));
        }
    if let Some(jenis_kelamin) = payload.jenis_kelamin {
            active_model.jenis_kelamin = Set(Some(jenis_kelamin));
        }
    if let Some(tempat_lahir) = payload.tempat_lahir {
            active_model.tempat_lahir = Set(Some(tempat_lahir));
        }
    if let Some(tanggal_lahir) = payload.tanggal_lahir {
            active_model.tanggal_lahir = Set(Some(tanggal_lahir));
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
    if let Some(nik) = payload.nik {
            active_model.nik = Set(Some(nik));
        }
    if let Some(nisn) = payload.nisn {
            active_model.nisn = Set(Some(nisn));
        }
    if let Some(npwp) = payload.npwp {
            active_model.npwp = Set(Some(npwp));
        }
    if let Some(id_negara) = payload.id_negara {
            active_model.id_negara = Set(Some(id_negara));
        }
    if let Some(kewarganegaraan) = payload.kewarganegaraan {
            active_model.kewarganegaraan = Set(Some(kewarganegaraan));
        }
    if let Some(jalan) = payload.jalan {
            active_model.jalan = Set(Some(jalan));
        }
    if let Some(dusun) = payload.dusun {
            active_model.dusun = Set(Some(dusun));
        }
    if let Some(rt) = payload.rt {
            active_model.rt = Set(Some(rt));
        }
    if let Some(rw) = payload.rw {
            active_model.rw = Set(Some(rw));
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
    if let Some(id_jenis_tinggal) = payload.id_jenis_tinggal {
            active_model.id_jenis_tinggal = Set(Some(id_jenis_tinggal));
        }
    if let Some(nama_jenis_tinggal) = payload.nama_jenis_tinggal {
            active_model.nama_jenis_tinggal = Set(Some(nama_jenis_tinggal));
        }
    if let Some(id_alat_transportasi) = payload.id_alat_transportasi {
            active_model.id_alat_transportasi = Set(Some(id_alat_transportasi));
        }
    if let Some(nama_alat_transportasi) = payload.nama_alat_transportasi {
            active_model.nama_alat_transportasi = Set(Some(nama_alat_transportasi));
        }
    if let Some(telepon) = payload.telepon {
            active_model.telepon = Set(Some(telepon));
        }
    if let Some(handphone) = payload.handphone {
            active_model.handphone = Set(Some(handphone));
        }
    if let Some(email) = payload.email {
            active_model.email = Set(Some(email));
        }
    if let Some(penerima_kps) = payload.penerima_kps {
            active_model.penerima_kps = Set(Some(penerima_kps));
        }
    if let Some(nomor_kps) = payload.nomor_kps {
            active_model.nomor_kps = Set(Some(nomor_kps));
        }
    if let Some(nik_ayah) = payload.nik_ayah {
            active_model.nik_ayah = Set(Some(nik_ayah));
        }
    if let Some(nama_ayah) = payload.nama_ayah {
            active_model.nama_ayah = Set(Some(nama_ayah));
        }
    if let Some(tanggal_lahir_ayah) = payload.tanggal_lahir_ayah {
            active_model.tanggal_lahir_ayah = Set(Some(tanggal_lahir_ayah));
        }
    if let Some(id_pendidikan_ayah) = payload.id_pendidikan_ayah {
            active_model.id_pendidikan_ayah = Set(Some(id_pendidikan_ayah));
        }
    if let Some(nama_pendidikan_ayah) = payload.nama_pendidikan_ayah {
            active_model.nama_pendidikan_ayah = Set(Some(nama_pendidikan_ayah));
        }
    if let Some(id_pekerjaan_ayah) = payload.id_pekerjaan_ayah {
            active_model.id_pekerjaan_ayah = Set(Some(id_pekerjaan_ayah));
        }
    if let Some(nama_pekerjaan_ayah) = payload.nama_pekerjaan_ayah {
            active_model.nama_pekerjaan_ayah = Set(Some(nama_pekerjaan_ayah));
        }
    if let Some(id_penghasilan_ayah) = payload.id_penghasilan_ayah {
            active_model.id_penghasilan_ayah = Set(Some(id_penghasilan_ayah));
        }
    if let Some(nama_penghasilan_ayah) = payload.nama_penghasilan_ayah {
            active_model.nama_penghasilan_ayah = Set(Some(nama_penghasilan_ayah));
        }
    if let Some(nik_ibu) = payload.nik_ibu {
            active_model.nik_ibu = Set(Some(nik_ibu));
        }
    if let Some(nama_ibu_kandung) = payload.nama_ibu_kandung {
            active_model.nama_ibu_kandung = Set(Some(nama_ibu_kandung));
        }
    if let Some(tanggal_lahir_ibu) = payload.tanggal_lahir_ibu {
            active_model.tanggal_lahir_ibu = Set(Some(tanggal_lahir_ibu));
        }
    if let Some(id_pendidikan_ibu) = payload.id_pendidikan_ibu {
            active_model.id_pendidikan_ibu = Set(Some(id_pendidikan_ibu));
        }
    if let Some(nama_pendidikan_ibu) = payload.nama_pendidikan_ibu {
            active_model.nama_pendidikan_ibu = Set(Some(nama_pendidikan_ibu));
        }
    if let Some(id_pekerjaan_ibu) = payload.id_pekerjaan_ibu {
            active_model.id_pekerjaan_ibu = Set(Some(id_pekerjaan_ibu));
        }
    if let Some(nama_pekerjaan_ibu) = payload.nama_pekerjaan_ibu {
            active_model.nama_pekerjaan_ibu = Set(Some(nama_pekerjaan_ibu));
        }
    if let Some(id_penghasilan_ibu) = payload.id_penghasilan_ibu {
            active_model.id_penghasilan_ibu = Set(Some(id_penghasilan_ibu));
        }
    if let Some(nama_penghasilan_ibu) = payload.nama_penghasilan_ibu {
            active_model.nama_penghasilan_ibu = Set(Some(nama_penghasilan_ibu));
        }
    if let Some(nama_wali) = payload.nama_wali {
            active_model.nama_wali = Set(Some(nama_wali));
        }
    if let Some(tanggal_lahir_wali) = payload.tanggal_lahir_wali {
            active_model.tanggal_lahir_wali = Set(Some(tanggal_lahir_wali));
        }
    if let Some(id_pendidikan_wali) = payload.id_pendidikan_wali {
            active_model.id_pendidikan_wali = Set(Some(id_pendidikan_wali));
        }
    if let Some(nama_pendidikan_wali) = payload.nama_pendidikan_wali {
            active_model.nama_pendidikan_wali = Set(Some(nama_pendidikan_wali));
        }
    if let Some(id_pekerjaan_wali) = payload.id_pekerjaan_wali {
            active_model.id_pekerjaan_wali = Set(Some(id_pekerjaan_wali));
        }
    if let Some(nama_pekerjaan_wali) = payload.nama_pekerjaan_wali {
            active_model.nama_pekerjaan_wali = Set(Some(nama_pekerjaan_wali));
        }
    if let Some(id_penghasilan_wali) = payload.id_penghasilan_wali {
            active_model.id_penghasilan_wali = Set(Some(id_penghasilan_wali));
        }
    if let Some(nama_penghasilan_wali) = payload.nama_penghasilan_wali {
            active_model.nama_penghasilan_wali = Set(Some(nama_penghasilan_wali));
        }
    if let Some(id_kebutuhan_khusus_mahasiswa) = payload.id_kebutuhan_khusus_mahasiswa {
            active_model.id_kebutuhan_khusus_mahasiswa = Set(Some(id_kebutuhan_khusus_mahasiswa));
        }
    if let Some(nama_kebutuhan_khusus_mahasiswa) = payload.nama_kebutuhan_khusus_mahasiswa {
            active_model.nama_kebutuhan_khusus_mahasiswa = Set(Some(nama_kebutuhan_khusus_mahasiswa));
        }
    if let Some(id_kebutuhan_khusus_ayah) = payload.id_kebutuhan_khusus_ayah {
            active_model.id_kebutuhan_khusus_ayah = Set(Some(id_kebutuhan_khusus_ayah));
        }
    if let Some(nama_kebutuhan_khusus_ayah) = payload.nama_kebutuhan_khusus_ayah {
            active_model.nama_kebutuhan_khusus_ayah = Set(Some(nama_kebutuhan_khusus_ayah));
        }
    if let Some(id_kebutuhan_khusus_ibu) = payload.id_kebutuhan_khusus_ibu {
            active_model.id_kebutuhan_khusus_ibu = Set(Some(id_kebutuhan_khusus_ibu));
        }
    if let Some(nama_kebutuhan_khusus_ibu) = payload.nama_kebutuhan_khusus_ibu {
            active_model.nama_kebutuhan_khusus_ibu = Set(Some(nama_kebutuhan_khusus_ibu));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BiodataMahasiswaResponse {
            id: item.id,
            nama_mahasiswa: item.nama_mahasiswa,
            jenis_kelamin: item.jenis_kelamin,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            id_mahasiswa: item.id_mahasiswa,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            nik: item.nik,
            nisn: item.nisn,
            npwp: item.npwp,
            id_negara: item.id_negara,
            kewarganegaraan: item.kewarganegaraan,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            kelurahan: item.kelurahan,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            id_jenis_tinggal: item.id_jenis_tinggal,
            nama_jenis_tinggal: item.nama_jenis_tinggal,
            id_alat_transportasi: item.id_alat_transportasi,
            nama_alat_transportasi: item.nama_alat_transportasi,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            penerima_kps: item.penerima_kps,
            nomor_kps: item.nomor_kps,
            nik_ayah: item.nik_ayah,
            nama_ayah: item.nama_ayah,
            tanggal_lahir_ayah: item.tanggal_lahir_ayah,
            id_pendidikan_ayah: item.id_pendidikan_ayah,
            nama_pendidikan_ayah: item.nama_pendidikan_ayah,
            id_pekerjaan_ayah: item.id_pekerjaan_ayah,
            nama_pekerjaan_ayah: item.nama_pekerjaan_ayah,
            id_penghasilan_ayah: item.id_penghasilan_ayah,
            nama_penghasilan_ayah: item.nama_penghasilan_ayah,
            nik_ibu: item.nik_ibu,
            nama_ibu_kandung: item.nama_ibu_kandung,
            tanggal_lahir_ibu: item.tanggal_lahir_ibu,
            id_pendidikan_ibu: item.id_pendidikan_ibu,
            nama_pendidikan_ibu: item.nama_pendidikan_ibu,
            id_pekerjaan_ibu: item.id_pekerjaan_ibu,
            nama_pekerjaan_ibu: item.nama_pekerjaan_ibu,
            id_penghasilan_ibu: item.id_penghasilan_ibu,
            nama_penghasilan_ibu: item.nama_penghasilan_ibu,
            nama_wali: item.nama_wali,
            tanggal_lahir_wali: item.tanggal_lahir_wali,
            id_pendidikan_wali: item.id_pendidikan_wali,
            nama_pendidikan_wali: item.nama_pendidikan_wali,
            id_pekerjaan_wali: item.id_pekerjaan_wali,
            nama_pekerjaan_wali: item.nama_pekerjaan_wali,
            id_penghasilan_wali: item.id_penghasilan_wali,
            nama_penghasilan_wali: item.nama_penghasilan_wali,
            id_kebutuhan_khusus_mahasiswa: item.id_kebutuhan_khusus_mahasiswa,
            nama_kebutuhan_khusus_mahasiswa: item.nama_kebutuhan_khusus_mahasiswa,
            id_kebutuhan_khusus_ayah: item.id_kebutuhan_khusus_ayah,
            nama_kebutuhan_khusus_ayah: item.nama_kebutuhan_khusus_ayah,
            id_kebutuhan_khusus_ibu: item.id_kebutuhan_khusus_ibu,
            nama_kebutuhan_khusus_ibu: item.nama_kebutuhan_khusus_ibu,
            status_sync: item.status_sync,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - BiodataMahasiswa"), status_codes(200, 400, 404, 500))]
pub async fn delete_biodata_mahasiswa(
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
            .ok_or_else(|| StatusError::not_found().brief("BiodataMahasiswa not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "BiodataMahasiswa deleted successfully".to_string(),
        }))
}
