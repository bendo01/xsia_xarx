use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::nilai_perkuliahan_kelas::{
    CreateNilaiPerkuliahanKelaRequest, NilaiPerkuliahanKelaQuery, NilaiPerkuliahanKelaResponse, PaginatedNilaiPerkuliahanKelaResponse,
    UpdateNilaiPerkuliahanKelaRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::nilai_perkuliahan_kelas as entity_mod;

#[endpoint(tags("Feeder - Master - NilaiPerkuliahanKela"), status_codes(200, 500))]
pub async fn list_nilai_perkuliahan_kelas(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedNilaiPerkuliahanKelaResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: NilaiPerkuliahanKelaQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| NilaiPerkuliahanKelaResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            jumlah_mahasiswa_krs: item.jumlah_mahasiswa_krs,
            jumlah_mahasiswa_dapat_nilai: item.jumlah_mahasiswa_dapat_nilai,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan_case: item.bahasan_case,
            a_selenggara_pditt: item.a_selenggara_pditt,
            a_pengguna_pditt: item.a_pengguna_pditt,
            kuota_pditt: item.kuota_pditt,
            tgl_mulai_koas: item.tgl_mulai_koas,
            tgl_selesai_koas: item.tgl_selesai_koas,
            id_mou: item.id_mou,
            id_kls_pditt: item.id_kls_pditt,
            id_sms: item.id_sms,
            id_smt: item.id_smt,
            tgl_create: item.tgl_create,
            lingkup_kelas: item.lingkup_kelas,
            mode_kuliah: item.mode_kuliah,
            nm_smt: item.nm_smt,
            nama_prodi: item.nama_prodi,
            status_sync: item.status_sync,

    }).collect();

    Ok(Json(PaginatedNilaiPerkuliahanKelaResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - NilaiPerkuliahanKela"), status_codes(200, 400, 404, 500))]
pub async fn get_nilai_perkuliahan_kela(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<NilaiPerkuliahanKelaResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("NilaiPerkuliahanKela not found"))?;

    Ok(Json(NilaiPerkuliahanKelaResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            jumlah_mahasiswa_krs: item.jumlah_mahasiswa_krs,
            jumlah_mahasiswa_dapat_nilai: item.jumlah_mahasiswa_dapat_nilai,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan_case: item.bahasan_case,
            a_selenggara_pditt: item.a_selenggara_pditt,
            a_pengguna_pditt: item.a_pengguna_pditt,
            kuota_pditt: item.kuota_pditt,
            tgl_mulai_koas: item.tgl_mulai_koas,
            tgl_selesai_koas: item.tgl_selesai_koas,
            id_mou: item.id_mou,
            id_kls_pditt: item.id_kls_pditt,
            id_sms: item.id_sms,
            id_smt: item.id_smt,
            tgl_create: item.tgl_create,
            lingkup_kelas: item.lingkup_kelas,
            mode_kuliah: item.mode_kuliah,
            nm_smt: item.nm_smt,
            nama_prodi: item.nama_prodi,
            status_sync: item.status_sync,

    }))
}#[endpoint(tags("Feeder - Master - NilaiPerkuliahanKela"), status_codes(200, 400, 500))]
pub async fn create_nilai_perkuliahan_kela(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<NilaiPerkuliahanKelaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateNilaiPerkuliahanKelaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_matkul: Set(payload.id_matkul),
        kode_mata_kuliah: Set(payload.kode_mata_kuliah),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        id_kelas_kuliah: Set(payload.id_kelas_kuliah),
        nama_kelas_kuliah: Set(payload.nama_kelas_kuliah),
        sks_mata_kuliah: Set(payload.sks_mata_kuliah),
        jumlah_mahasiswa_krs: Set(payload.jumlah_mahasiswa_krs),
        jumlah_mahasiswa_dapat_nilai: Set(payload.jumlah_mahasiswa_dapat_nilai),
        sks_tm: Set(payload.sks_tm),
        sks_prak: Set(payload.sks_prak),
        sks_prak_lap: Set(payload.sks_prak_lap),
        sks_sim: Set(payload.sks_sim),
        bahasan_case: Set(payload.bahasan_case),
        a_selenggara_pditt: Set(payload.a_selenggara_pditt),
        a_pengguna_pditt: Set(payload.a_pengguna_pditt),
        kuota_pditt: Set(payload.kuota_pditt),
        tgl_mulai_koas: Set(payload.tgl_mulai_koas),
        tgl_selesai_koas: Set(payload.tgl_selesai_koas),
        id_mou: Set(payload.id_mou),
        id_kls_pditt: Set(payload.id_kls_pditt),
        id_sms: Set(payload.id_sms),
        id_smt: Set(payload.id_smt),
        tgl_create: Set(payload.tgl_create),
        lingkup_kelas: Set(payload.lingkup_kelas),
        mode_kuliah: Set(payload.mode_kuliah),
        nm_smt: Set(payload.nm_smt),
        nama_prodi: Set(payload.nama_prodi),
        status_sync: Set(payload.status_sync),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(NilaiPerkuliahanKelaResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            jumlah_mahasiswa_krs: item.jumlah_mahasiswa_krs,
            jumlah_mahasiswa_dapat_nilai: item.jumlah_mahasiswa_dapat_nilai,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan_case: item.bahasan_case,
            a_selenggara_pditt: item.a_selenggara_pditt,
            a_pengguna_pditt: item.a_pengguna_pditt,
            kuota_pditt: item.kuota_pditt,
            tgl_mulai_koas: item.tgl_mulai_koas,
            tgl_selesai_koas: item.tgl_selesai_koas,
            id_mou: item.id_mou,
            id_kls_pditt: item.id_kls_pditt,
            id_sms: item.id_sms,
            id_smt: item.id_smt,
            tgl_create: item.tgl_create,
            lingkup_kelas: item.lingkup_kelas,
            mode_kuliah: item.mode_kuliah,
            nm_smt: item.nm_smt,
            nama_prodi: item.nama_prodi,
            status_sync: item.status_sync,

        }))
}

#[endpoint(tags("Feeder - Master - NilaiPerkuliahanKela"), status_codes(200, 400, 404, 500))]
pub async fn update_nilai_perkuliahan_kela(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<NilaiPerkuliahanKelaResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateNilaiPerkuliahanKelaRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("NilaiPerkuliahanKela not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_matkul) = payload.id_matkul {
            active_model.id_matkul = Set(Some(id_matkul));
        }
    if let Some(kode_mata_kuliah) = payload.kode_mata_kuliah {
            active_model.kode_mata_kuliah = Set(Some(kode_mata_kuliah));
        }
    if let Some(nama_mata_kuliah) = payload.nama_mata_kuliah {
            active_model.nama_mata_kuliah = Set(Some(nama_mata_kuliah));
        }
    if let Some(id_kelas_kuliah) = payload.id_kelas_kuliah {
            active_model.id_kelas_kuliah = Set(Some(id_kelas_kuliah));
        }
    if let Some(nama_kelas_kuliah) = payload.nama_kelas_kuliah {
            active_model.nama_kelas_kuliah = Set(Some(nama_kelas_kuliah));
        }
    if let Some(sks_mata_kuliah) = payload.sks_mata_kuliah {
            active_model.sks_mata_kuliah = Set(Some(sks_mata_kuliah));
        }
    if let Some(jumlah_mahasiswa_krs) = payload.jumlah_mahasiswa_krs {
            active_model.jumlah_mahasiswa_krs = Set(Some(jumlah_mahasiswa_krs));
        }
    if let Some(jumlah_mahasiswa_dapat_nilai) = payload.jumlah_mahasiswa_dapat_nilai {
            active_model.jumlah_mahasiswa_dapat_nilai = Set(Some(jumlah_mahasiswa_dapat_nilai));
        }
    if let Some(sks_tm) = payload.sks_tm {
            active_model.sks_tm = Set(Some(sks_tm));
        }
    if let Some(sks_prak) = payload.sks_prak {
            active_model.sks_prak = Set(Some(sks_prak));
        }
    if let Some(sks_prak_lap) = payload.sks_prak_lap {
            active_model.sks_prak_lap = Set(Some(sks_prak_lap));
        }
    if let Some(sks_sim) = payload.sks_sim {
            active_model.sks_sim = Set(Some(sks_sim));
        }
    if let Some(bahasan_case) = payload.bahasan_case {
            active_model.bahasan_case = Set(Some(bahasan_case));
        }
    if let Some(a_selenggara_pditt) = payload.a_selenggara_pditt {
            active_model.a_selenggara_pditt = Set(Some(a_selenggara_pditt));
        }
    if let Some(a_pengguna_pditt) = payload.a_pengguna_pditt {
            active_model.a_pengguna_pditt = Set(Some(a_pengguna_pditt));
        }
    if let Some(kuota_pditt) = payload.kuota_pditt {
            active_model.kuota_pditt = Set(Some(kuota_pditt));
        }
    if let Some(tgl_mulai_koas) = payload.tgl_mulai_koas {
            active_model.tgl_mulai_koas = Set(Some(tgl_mulai_koas));
        }
    if let Some(tgl_selesai_koas) = payload.tgl_selesai_koas {
            active_model.tgl_selesai_koas = Set(Some(tgl_selesai_koas));
        }
    if let Some(id_mou) = payload.id_mou {
            active_model.id_mou = Set(Some(id_mou));
        }
    if let Some(id_kls_pditt) = payload.id_kls_pditt {
            active_model.id_kls_pditt = Set(Some(id_kls_pditt));
        }
    if let Some(id_sms) = payload.id_sms {
            active_model.id_sms = Set(Some(id_sms));
        }
    if let Some(id_smt) = payload.id_smt {
            active_model.id_smt = Set(Some(id_smt));
        }
    if let Some(tgl_create) = payload.tgl_create {
            active_model.tgl_create = Set(Some(tgl_create));
        }
    if let Some(lingkup_kelas) = payload.lingkup_kelas {
            active_model.lingkup_kelas = Set(Some(lingkup_kelas));
        }
    if let Some(mode_kuliah) = payload.mode_kuliah {
            active_model.mode_kuliah = Set(Some(mode_kuliah));
        }
    if let Some(nm_smt) = payload.nm_smt {
            active_model.nm_smt = Set(Some(nm_smt));
        }
    if let Some(nama_prodi) = payload.nama_prodi {
            active_model.nama_prodi = Set(Some(nama_prodi));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(NilaiPerkuliahanKelaResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas_kuliah: item.id_kelas_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mata_kuliah: item.sks_mata_kuliah,
            jumlah_mahasiswa_krs: item.jumlah_mahasiswa_krs,
            jumlah_mahasiswa_dapat_nilai: item.jumlah_mahasiswa_dapat_nilai,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan_case: item.bahasan_case,
            a_selenggara_pditt: item.a_selenggara_pditt,
            a_pengguna_pditt: item.a_pengguna_pditt,
            kuota_pditt: item.kuota_pditt,
            tgl_mulai_koas: item.tgl_mulai_koas,
            tgl_selesai_koas: item.tgl_selesai_koas,
            id_mou: item.id_mou,
            id_kls_pditt: item.id_kls_pditt,
            id_sms: item.id_sms,
            id_smt: item.id_smt,
            tgl_create: item.tgl_create,
            lingkup_kelas: item.lingkup_kelas,
            mode_kuliah: item.mode_kuliah,
            nm_smt: item.nm_smt,
            nama_prodi: item.nama_prodi,
            status_sync: item.status_sync,

        }))
}
#[endpoint(tags("Feeder - Master - NilaiPerkuliahanKela"), status_codes(200, 400, 404, 500))]
pub async fn delete_nilai_perkuliahan_kela(
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
            .ok_or_else(|| StatusError::not_found().brief("NilaiPerkuliahanKela not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "NilaiPerkuliahanKela deleted successfully".to_string(),
        }))
}
