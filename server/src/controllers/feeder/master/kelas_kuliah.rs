use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::kelas_kuliah::{
    CreateKelasKuliahRequest, KelasKuliahQuery, KelasKuliahResponse, PaginatedKelasKuliahResponse,
    UpdateKelasKuliahRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::kelas_kuliah as entity_mod;

#[endpoint(tags("Feeder - Master - KelasKuliah"), status_codes(200, 500))]
pub async fn list_kelas_kuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedKelasKuliahResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: KelasKuliahQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| KelasKuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mk: item.sks_mk,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan: item.bahasan,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            kapasitas: item.kapasitas,
            tanggal_tutup_daftar: item.tanggal_tutup_daftar,
            prodi_penyelenggara: item.prodi_penyelenggara,
            perguruan_tinggi_penyelenggara: item.perguruan_tinggi_penyelenggara,
            sks: item.sks,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jumlah_mahasiswa: item.jumlah_mahasiswa,
            apa_untuk_pditt: item.apa_untuk_pditt,

    }).collect();

    Ok(Json(PaginatedKelasKuliahResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - KelasKuliah"), status_codes(200, 400, 404, 500))]
pub async fn get_kelas_kuliah(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<KelasKuliahResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("KelasKuliah not found"))?;

    Ok(Json(KelasKuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mk: item.sks_mk,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan: item.bahasan,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            kapasitas: item.kapasitas,
            tanggal_tutup_daftar: item.tanggal_tutup_daftar,
            prodi_penyelenggara: item.prodi_penyelenggara,
            perguruan_tinggi_penyelenggara: item.perguruan_tinggi_penyelenggara,
            sks: item.sks,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jumlah_mahasiswa: item.jumlah_mahasiswa,
            apa_untuk_pditt: item.apa_untuk_pditt,

    }))
}#[endpoint(tags("Feeder - Master - KelasKuliah"), status_codes(200, 400, 500))]
pub async fn create_kelas_kuliah(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<KelasKuliahResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateKelasKuliahRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(Some(new_id)),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        id_kelas_kuliah: Set(payload.id_kelas_kuliah),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_semester: Set(payload.id_semester),
        nama_semester: Set(payload.nama_semester),
        id_matkul: Set(payload.id_matkul),
        kode_mata_kuliah: Set(payload.kode_mata_kuliah),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        nama_kelas_kuliah: Set(payload.nama_kelas_kuliah),
        sks_mk: Set(payload.sks_mk),
        sks_tm: Set(payload.sks_tm),
        sks_prak: Set(payload.sks_prak),
        sks_prak_lap: Set(payload.sks_prak_lap),
        sks_sim: Set(payload.sks_sim),
        bahasan: Set(payload.bahasan),
        tanggal_mulai_efektif: Set(payload.tanggal_mulai_efektif),
        tanggal_akhir_efektif: Set(payload.tanggal_akhir_efektif),
        kapasitas: Set(payload.kapasitas),
        tanggal_tutup_daftar: Set(payload.tanggal_tutup_daftar),
        prodi_penyelenggara: Set(payload.prodi_penyelenggara),
        perguruan_tinggi_penyelenggara: Set(payload.perguruan_tinggi_penyelenggara),
        sks: Set(payload.sks),
        id_dosen: Set(payload.id_dosen),
        nama_dosen: Set(payload.nama_dosen),
        jumlah_mahasiswa: Set(payload.jumlah_mahasiswa),
        apa_untuk_pditt: Set(payload.apa_untuk_pditt),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(KelasKuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mk: item.sks_mk,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan: item.bahasan,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            kapasitas: item.kapasitas,
            tanggal_tutup_daftar: item.tanggal_tutup_daftar,
            prodi_penyelenggara: item.prodi_penyelenggara,
            perguruan_tinggi_penyelenggara: item.perguruan_tinggi_penyelenggara,
            sks: item.sks,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jumlah_mahasiswa: item.jumlah_mahasiswa,
            apa_untuk_pditt: item.apa_untuk_pditt,

        }))
}

#[endpoint(tags("Feeder - Master - KelasKuliah"), status_codes(200, 400, 404, 500))]
pub async fn update_kelas_kuliah(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<KelasKuliahResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateKelasKuliahRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("KelasKuliah not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_kelas_kuliah) = payload.id_kelas_kuliah {
            active_model.id_kelas_kuliah = Set(id_kelas_kuliah);
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(id_semester) = payload.id_semester {
            active_model.id_semester = Set(Some(id_semester));
        }
    if let Some(nama_semester) = payload.nama_semester {
            active_model.nama_semester = Set(Some(nama_semester));
        }
    if let Some(id_matkul) = payload.id_matkul {
            active_model.id_matkul = Set(Some(id_matkul));
        }
    if let Some(kode_mata_kuliah) = payload.kode_mata_kuliah {
            active_model.kode_mata_kuliah = Set(Some(kode_mata_kuliah));
        }
    if let Some(nama_mata_kuliah) = payload.nama_mata_kuliah {
            active_model.nama_mata_kuliah = Set(Some(nama_mata_kuliah));
        }
    if let Some(nama_kelas_kuliah) = payload.nama_kelas_kuliah {
            active_model.nama_kelas_kuliah = Set(Some(nama_kelas_kuliah));
        }
    if let Some(sks_mk) = payload.sks_mk {
            active_model.sks_mk = Set(Some(sks_mk));
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
    if let Some(bahasan) = payload.bahasan {
            active_model.bahasan = Set(Some(bahasan));
        }
    if let Some(tanggal_mulai_efektif) = payload.tanggal_mulai_efektif {
            active_model.tanggal_mulai_efektif = Set(Some(tanggal_mulai_efektif));
        }
    if let Some(tanggal_akhir_efektif) = payload.tanggal_akhir_efektif {
            active_model.tanggal_akhir_efektif = Set(Some(tanggal_akhir_efektif));
        }
    if let Some(kapasitas) = payload.kapasitas {
            active_model.kapasitas = Set(Some(kapasitas));
        }
    if let Some(tanggal_tutup_daftar) = payload.tanggal_tutup_daftar {
            active_model.tanggal_tutup_daftar = Set(Some(tanggal_tutup_daftar));
        }
    if let Some(prodi_penyelenggara) = payload.prodi_penyelenggara {
            active_model.prodi_penyelenggara = Set(Some(prodi_penyelenggara));
        }
    if let Some(perguruan_tinggi_penyelenggara) = payload.perguruan_tinggi_penyelenggara {
            active_model.perguruan_tinggi_penyelenggara = Set(Some(perguruan_tinggi_penyelenggara));
        }
    if let Some(sks) = payload.sks {
            active_model.sks = Set(Some(sks));
        }
    if let Some(id_dosen) = payload.id_dosen {
            active_model.id_dosen = Set(Some(id_dosen));
        }
    if let Some(nama_dosen) = payload.nama_dosen {
            active_model.nama_dosen = Set(Some(nama_dosen));
        }
    if let Some(jumlah_mahasiswa) = payload.jumlah_mahasiswa {
            active_model.jumlah_mahasiswa = Set(Some(jumlah_mahasiswa));
        }
    if let Some(apa_untuk_pditt) = payload.apa_untuk_pditt {
            active_model.apa_untuk_pditt = Set(Some(apa_untuk_pditt));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(KelasKuliahResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kelas_kuliah: item.id_kelas_kuliah,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_semester: item.id_semester,
            nama_semester: item.nama_semester,
            id_matkul: item.id_matkul,
            kode_mata_kuliah: item.kode_mata_kuliah,
            nama_mata_kuliah: item.nama_mata_kuliah,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            sks_mk: item.sks_mk,
            sks_tm: item.sks_tm,
            sks_prak: item.sks_prak,
            sks_prak_lap: item.sks_prak_lap,
            sks_sim: item.sks_sim,
            bahasan: item.bahasan,
            tanggal_mulai_efektif: item.tanggal_mulai_efektif,
            tanggal_akhir_efektif: item.tanggal_akhir_efektif,
            kapasitas: item.kapasitas,
            tanggal_tutup_daftar: item.tanggal_tutup_daftar,
            prodi_penyelenggara: item.prodi_penyelenggara,
            perguruan_tinggi_penyelenggara: item.perguruan_tinggi_penyelenggara,
            sks: item.sks,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            jumlah_mahasiswa: item.jumlah_mahasiswa,
            apa_untuk_pditt: item.apa_untuk_pditt,

        }))
}
#[endpoint(tags("Feeder - Master - KelasKuliah"), status_codes(200, 400, 404, 500))]
pub async fn delete_kelas_kuliah(
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
            .ok_or_else(|| StatusError::not_found().brief("KelasKuliah not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "KelasKuliah deleted successfully".to_string(),
        }))
}
