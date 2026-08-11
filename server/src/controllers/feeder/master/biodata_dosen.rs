use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::biodata_dosen::{
    CreateBiodataDosenRequest, BiodataDosenQuery, BiodataDosenResponse, PaginatedBiodataDosenResponse,
    UpdateBiodataDosenRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::biodata_dosen as entity_mod;

#[endpoint(tags("Feeder - Master - BiodataDosen"), status_codes(200, 500))]
pub async fn list_biodata_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBiodataDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BiodataDosenQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| BiodataDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            jenis_kelamin: item.jenis_kelamin,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            id_status_aktif: item.id_status_aktif,
            nama_status_aktif: item.nama_status_aktif,
            nidn: item.nidn,
            nama_ibu_kandung: item.nama_ibu_kandung,
            nik: item.nik,
            nip: item.nip,
            npwp: item.npwp,
            id_jenis_sdm: item.id_jenis_sdm,
            nama_jenis_sdm: item.nama_jenis_sdm,
            no_sk_cpns: item.no_sk_cpns,
            tanggal_sk_cpns: item.tanggal_sk_cpns,
            no_sk_pengangkatan: item.no_sk_pengangkatan,
            mulai_sk_pengangkatan: item.mulai_sk_pengangkatan,
            id_lembaga_pengangkatan: item.id_lembaga_pengangkatan,
            nama_lembaga_pengangkatan: item.nama_lembaga_pengangkatan,
            id_pangkat_golongan: item.id_pangkat_golongan,
            nama_pangkat_golongan: item.nama_pangkat_golongan,
            id_sumber_gaji: item.id_sumber_gaji,
            nama_sumber_gaji: item.nama_sumber_gaji,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            ds_kel: item.ds_kel,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            status_pernikahan: item.status_pernikahan,
            nama_suami_istri: item.nama_suami_istri,
            nip_suami_istri: item.nip_suami_istri,
            tanggal_mulai_pns: item.tanggal_mulai_pns,
            nama_pekerjaan_suami_istri: item.nama_pekerjaan_suami_istri,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_pekerjaan_suami_istri: item.id_pekerjaan_suami_istri,

    }).collect();

    Ok(Json(PaginatedBiodataDosenResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - BiodataDosen"), status_codes(200, 400, 404, 500))]
pub async fn get_biodata_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataDosenResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("BiodataDosen not found"))?;

    Ok(Json(BiodataDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            jenis_kelamin: item.jenis_kelamin,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            id_status_aktif: item.id_status_aktif,
            nama_status_aktif: item.nama_status_aktif,
            nidn: item.nidn,
            nama_ibu_kandung: item.nama_ibu_kandung,
            nik: item.nik,
            nip: item.nip,
            npwp: item.npwp,
            id_jenis_sdm: item.id_jenis_sdm,
            nama_jenis_sdm: item.nama_jenis_sdm,
            no_sk_cpns: item.no_sk_cpns,
            tanggal_sk_cpns: item.tanggal_sk_cpns,
            no_sk_pengangkatan: item.no_sk_pengangkatan,
            mulai_sk_pengangkatan: item.mulai_sk_pengangkatan,
            id_lembaga_pengangkatan: item.id_lembaga_pengangkatan,
            nama_lembaga_pengangkatan: item.nama_lembaga_pengangkatan,
            id_pangkat_golongan: item.id_pangkat_golongan,
            nama_pangkat_golongan: item.nama_pangkat_golongan,
            id_sumber_gaji: item.id_sumber_gaji,
            nama_sumber_gaji: item.nama_sumber_gaji,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            ds_kel: item.ds_kel,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            status_pernikahan: item.status_pernikahan,
            nama_suami_istri: item.nama_suami_istri,
            nip_suami_istri: item.nip_suami_istri,
            tanggal_mulai_pns: item.tanggal_mulai_pns,
            nama_pekerjaan_suami_istri: item.nama_pekerjaan_suami_istri,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_pekerjaan_suami_istri: item.id_pekerjaan_suami_istri,

    }))
}

#[endpoint(tags("Feeder - Master - BiodataDosen"), status_codes(200, 400, 500))]
pub async fn create_biodata_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateBiodataDosenRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_dosen: Set(payload.id_dosen),
        nama_dosen: Set(payload.nama_dosen),
        tempat_lahir: Set(payload.tempat_lahir),
        tanggal_lahir: Set(payload.tanggal_lahir),
        jenis_kelamin: Set(payload.jenis_kelamin),
        id_agama: Set(payload.id_agama),
        nama_agama: Set(payload.nama_agama),
        id_status_aktif: Set(payload.id_status_aktif),
        nama_status_aktif: Set(payload.nama_status_aktif),
        nidn: Set(payload.nidn),
        nama_ibu_kandung: Set(payload.nama_ibu_kandung),
        nik: Set(payload.nik),
        nip: Set(payload.nip),
        npwp: Set(payload.npwp),
        id_jenis_sdm: Set(payload.id_jenis_sdm),
        nama_jenis_sdm: Set(payload.nama_jenis_sdm),
        no_sk_cpns: Set(payload.no_sk_cpns),
        tanggal_sk_cpns: Set(payload.tanggal_sk_cpns),
        no_sk_pengangkatan: Set(payload.no_sk_pengangkatan),
        mulai_sk_pengangkatan: Set(payload.mulai_sk_pengangkatan),
        id_lembaga_pengangkatan: Set(payload.id_lembaga_pengangkatan),
        nama_lembaga_pengangkatan: Set(payload.nama_lembaga_pengangkatan),
        id_pangkat_golongan: Set(payload.id_pangkat_golongan),
        nama_pangkat_golongan: Set(payload.nama_pangkat_golongan),
        id_sumber_gaji: Set(payload.id_sumber_gaji),
        nama_sumber_gaji: Set(payload.nama_sumber_gaji),
        jalan: Set(payload.jalan),
        dusun: Set(payload.dusun),
        rt: Set(payload.rt),
        rw: Set(payload.rw),
        ds_kel: Set(payload.ds_kel),
        kode_pos: Set(payload.kode_pos),
        id_wilayah: Set(payload.id_wilayah),
        nama_wilayah: Set(payload.nama_wilayah),
        telepon: Set(payload.telepon),
        handphone: Set(payload.handphone),
        email: Set(payload.email),
        status_pernikahan: Set(payload.status_pernikahan),
        nama_suami_istri: Set(payload.nama_suami_istri),
        nip_suami_istri: Set(payload.nip_suami_istri),
        tanggal_mulai_pns: Set(payload.tanggal_mulai_pns),
        nama_pekerjaan_suami_istri: Set(payload.nama_pekerjaan_suami_istri),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_pekerjaan_suami_istri: Set(payload.id_pekerjaan_suami_istri),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(BiodataDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            jenis_kelamin: item.jenis_kelamin,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            id_status_aktif: item.id_status_aktif,
            nama_status_aktif: item.nama_status_aktif,
            nidn: item.nidn,
            nama_ibu_kandung: item.nama_ibu_kandung,
            nik: item.nik,
            nip: item.nip,
            npwp: item.npwp,
            id_jenis_sdm: item.id_jenis_sdm,
            nama_jenis_sdm: item.nama_jenis_sdm,
            no_sk_cpns: item.no_sk_cpns,
            tanggal_sk_cpns: item.tanggal_sk_cpns,
            no_sk_pengangkatan: item.no_sk_pengangkatan,
            mulai_sk_pengangkatan: item.mulai_sk_pengangkatan,
            id_lembaga_pengangkatan: item.id_lembaga_pengangkatan,
            nama_lembaga_pengangkatan: item.nama_lembaga_pengangkatan,
            id_pangkat_golongan: item.id_pangkat_golongan,
            nama_pangkat_golongan: item.nama_pangkat_golongan,
            id_sumber_gaji: item.id_sumber_gaji,
            nama_sumber_gaji: item.nama_sumber_gaji,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            ds_kel: item.ds_kel,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            status_pernikahan: item.status_pernikahan,
            nama_suami_istri: item.nama_suami_istri,
            nip_suami_istri: item.nip_suami_istri,
            tanggal_mulai_pns: item.tanggal_mulai_pns,
            nama_pekerjaan_suami_istri: item.nama_pekerjaan_suami_istri,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_pekerjaan_suami_istri: item.id_pekerjaan_suami_istri,

    }))
}

#[endpoint(tags("Feeder - Master - BiodataDosen"), status_codes(200, 400, 404, 500))]
pub async fn update_biodata_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateBiodataDosenRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("BiodataDosen not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_dosen) = payload.id_dosen {
        active_model.id_dosen = Set(Some(id_dosen));
    }
    if let Some(nama_dosen) = payload.nama_dosen {
        active_model.nama_dosen = Set(Some(nama_dosen));
    }
    if let Some(tempat_lahir) = payload.tempat_lahir {
        active_model.tempat_lahir = Set(Some(tempat_lahir));
    }
    if let Some(tanggal_lahir) = payload.tanggal_lahir {
        active_model.tanggal_lahir = Set(Some(tanggal_lahir));
    }
    if let Some(jenis_kelamin) = payload.jenis_kelamin {
        active_model.jenis_kelamin = Set(Some(jenis_kelamin));
    }
    if let Some(id_agama) = payload.id_agama {
        active_model.id_agama = Set(Some(id_agama));
    }
    if let Some(nama_agama) = payload.nama_agama {
        active_model.nama_agama = Set(Some(nama_agama));
    }
    if let Some(id_status_aktif) = payload.id_status_aktif {
        active_model.id_status_aktif = Set(Some(id_status_aktif));
    }
    if let Some(nama_status_aktif) = payload.nama_status_aktif {
        active_model.nama_status_aktif = Set(Some(nama_status_aktif));
    }
    if let Some(nidn) = payload.nidn {
        active_model.nidn = Set(Some(nidn));
    }
    if let Some(nama_ibu_kandung) = payload.nama_ibu_kandung {
        active_model.nama_ibu_kandung = Set(Some(nama_ibu_kandung));
    }
    if let Some(nik) = payload.nik {
        active_model.nik = Set(Some(nik));
    }
    if let Some(nip) = payload.nip {
        active_model.nip = Set(Some(nip));
    }
    if let Some(npwp) = payload.npwp {
        active_model.npwp = Set(Some(npwp));
    }
    if let Some(id_jenis_sdm) = payload.id_jenis_sdm {
        active_model.id_jenis_sdm = Set(Some(id_jenis_sdm));
    }
    if let Some(nama_jenis_sdm) = payload.nama_jenis_sdm {
        active_model.nama_jenis_sdm = Set(Some(nama_jenis_sdm));
    }
    if let Some(no_sk_cpns) = payload.no_sk_cpns {
        active_model.no_sk_cpns = Set(Some(no_sk_cpns));
    }
    if let Some(tanggal_sk_cpns) = payload.tanggal_sk_cpns {
        active_model.tanggal_sk_cpns = Set(Some(tanggal_sk_cpns));
    }
    if let Some(no_sk_pengangkatan) = payload.no_sk_pengangkatan {
        active_model.no_sk_pengangkatan = Set(Some(no_sk_pengangkatan));
    }
    if let Some(mulai_sk_pengangkatan) = payload.mulai_sk_pengangkatan {
        active_model.mulai_sk_pengangkatan = Set(Some(mulai_sk_pengangkatan));
    }
    if let Some(id_lembaga_pengangkatan) = payload.id_lembaga_pengangkatan {
        active_model.id_lembaga_pengangkatan = Set(Some(id_lembaga_pengangkatan));
    }
    if let Some(nama_lembaga_pengangkatan) = payload.nama_lembaga_pengangkatan {
        active_model.nama_lembaga_pengangkatan = Set(Some(nama_lembaga_pengangkatan));
    }
    if let Some(id_pangkat_golongan) = payload.id_pangkat_golongan {
        active_model.id_pangkat_golongan = Set(Some(id_pangkat_golongan));
    }
    if let Some(nama_pangkat_golongan) = payload.nama_pangkat_golongan {
        active_model.nama_pangkat_golongan = Set(Some(nama_pangkat_golongan));
    }
    if let Some(id_sumber_gaji) = payload.id_sumber_gaji {
        active_model.id_sumber_gaji = Set(Some(id_sumber_gaji));
    }
    if let Some(nama_sumber_gaji) = payload.nama_sumber_gaji {
        active_model.nama_sumber_gaji = Set(Some(nama_sumber_gaji));
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
    if let Some(ds_kel) = payload.ds_kel {
        active_model.ds_kel = Set(Some(ds_kel));
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
    if let Some(telepon) = payload.telepon {
        active_model.telepon = Set(Some(telepon));
    }
    if let Some(handphone) = payload.handphone {
        active_model.handphone = Set(Some(handphone));
    }
    if let Some(email) = payload.email {
        active_model.email = Set(Some(email));
    }
    if let Some(status_pernikahan) = payload.status_pernikahan {
        active_model.status_pernikahan = Set(Some(status_pernikahan));
    }
    if let Some(nama_suami_istri) = payload.nama_suami_istri {
        active_model.nama_suami_istri = Set(Some(nama_suami_istri));
    }
    if let Some(nip_suami_istri) = payload.nip_suami_istri {
        active_model.nip_suami_istri = Set(Some(nip_suami_istri));
    }
    if let Some(tanggal_mulai_pns) = payload.tanggal_mulai_pns {
        active_model.tanggal_mulai_pns = Set(Some(tanggal_mulai_pns));
    }
    if let Some(nama_pekerjaan_suami_istri) = payload.nama_pekerjaan_suami_istri {
        active_model.nama_pekerjaan_suami_istri = Set(Some(nama_pekerjaan_suami_istri));
    }
    if let Some(id_pekerjaan_suami_istri) = payload.id_pekerjaan_suami_istri {
        active_model.id_pekerjaan_suami_istri = Set(Some(id_pekerjaan_suami_istri));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(BiodataDosenResponse {
            id: item.id,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            tempat_lahir: item.tempat_lahir,
            tanggal_lahir: item.tanggal_lahir,
            jenis_kelamin: item.jenis_kelamin,
            id_agama: item.id_agama,
            nama_agama: item.nama_agama,
            id_status_aktif: item.id_status_aktif,
            nama_status_aktif: item.nama_status_aktif,
            nidn: item.nidn,
            nama_ibu_kandung: item.nama_ibu_kandung,
            nik: item.nik,
            nip: item.nip,
            npwp: item.npwp,
            id_jenis_sdm: item.id_jenis_sdm,
            nama_jenis_sdm: item.nama_jenis_sdm,
            no_sk_cpns: item.no_sk_cpns,
            tanggal_sk_cpns: item.tanggal_sk_cpns,
            no_sk_pengangkatan: item.no_sk_pengangkatan,
            mulai_sk_pengangkatan: item.mulai_sk_pengangkatan,
            id_lembaga_pengangkatan: item.id_lembaga_pengangkatan,
            nama_lembaga_pengangkatan: item.nama_lembaga_pengangkatan,
            id_pangkat_golongan: item.id_pangkat_golongan,
            nama_pangkat_golongan: item.nama_pangkat_golongan,
            id_sumber_gaji: item.id_sumber_gaji,
            nama_sumber_gaji: item.nama_sumber_gaji,
            jalan: item.jalan,
            dusun: item.dusun,
            rt: item.rt,
            rw: item.rw,
            ds_kel: item.ds_kel,
            kode_pos: item.kode_pos,
            id_wilayah: item.id_wilayah,
            nama_wilayah: item.nama_wilayah,
            telepon: item.telepon,
            handphone: item.handphone,
            email: item.email,
            status_pernikahan: item.status_pernikahan,
            nama_suami_istri: item.nama_suami_istri,
            nip_suami_istri: item.nip_suami_istri,
            tanggal_mulai_pns: item.tanggal_mulai_pns,
            nama_pekerjaan_suami_istri: item.nama_pekerjaan_suami_istri,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_pekerjaan_suami_istri: item.id_pekerjaan_suami_istri,

    }))
}

#[endpoint(tags("Feeder - Master - BiodataDosen"), status_codes(200, 400, 404, 500))]
pub async fn delete_biodata_dosen(
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
        .ok_or_else(|| StatusError::not_found().brief("BiodataDosen not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "BiodataDosen deleted successfully".to_string(),
    }))
}
