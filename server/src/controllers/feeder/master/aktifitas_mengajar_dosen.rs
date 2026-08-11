use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::aktifitas_mengajar_dosen::{
    CreateAktifitasMengajarDosenRequest, AktifitasMengajarDosenQuery, AktifitasMengajarDosenResponse, PaginatedAktifitasMengajarDosenResponse,
    UpdateAktifitasMengajarDosenRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::aktifitas_mengajar_dosen as entity_mod;

#[endpoint(tags("Feeder - Master - AktifitasMengajarDosen"), status_codes(200, 500))]
pub async fn list_aktifitas_mengajar_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedAktifitasMengajarDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: AktifitasMengajarDosenQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| AktifitasMengajarDosenResponse {
            id: item.id,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            id_periode: item.id_periode,
            nama_periode: item.nama_periode,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedAktifitasMengajarDosenResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - AktifitasMengajarDosen"), status_codes(200, 400, 404, 500))]
pub async fn get_aktifitas_mengajar_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AktifitasMengajarDosenResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("AktifitasMengajarDosen not found"))?;

    Ok(Json(AktifitasMengajarDosenResponse {
            id: item.id,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            id_periode: item.id_periode,
            nama_periode: item.nama_periode,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - AktifitasMengajarDosen"), status_codes(200, 400, 500))]
pub async fn create_aktifitas_mengajar_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AktifitasMengajarDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateAktifitasMengajarDosenRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        id_registrasi_dosen: Set(payload.id_registrasi_dosen),
        id_dosen: Set(payload.id_dosen),
        nama_dosen: Set(payload.nama_dosen),
        id_periode: Set(payload.id_periode),
        nama_periode: Set(payload.nama_periode),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_matkul: Set(payload.id_matkul),
        nama_mata_kuliah: Set(payload.nama_mata_kuliah),
        id_kelas: Set(payload.id_kelas),
        nama_kelas_kuliah: Set(payload.nama_kelas_kuliah),
        rencana_minggu_pertemuan: Set(payload.rencana_minggu_pertemuan),
        realisasi_minggu_pertemuan: Set(payload.realisasi_minggu_pertemuan),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(AktifitasMengajarDosenResponse {
            id: item.id,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            id_periode: item.id_periode,
            nama_periode: item.nama_periode,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - AktifitasMengajarDosen"), status_codes(200, 400, 404, 500))]
pub async fn update_aktifitas_mengajar_dosen(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AktifitasMengajarDosenResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateAktifitasMengajarDosenRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("AktifitasMengajarDosen not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(id_registrasi_dosen) = payload.id_registrasi_dosen {
        active_model.id_registrasi_dosen = Set(Some(id_registrasi_dosen));
    }
    if let Some(id_dosen) = payload.id_dosen {
        active_model.id_dosen = Set(Some(id_dosen));
    }
    if let Some(nama_dosen) = payload.nama_dosen {
        active_model.nama_dosen = Set(Some(nama_dosen));
    }
    if let Some(id_periode) = payload.id_periode {
        active_model.id_periode = Set(Some(id_periode));
    }
    if let Some(nama_periode) = payload.nama_periode {
        active_model.nama_periode = Set(Some(nama_periode));
    }
    if let Some(id_prodi) = payload.id_prodi {
        active_model.id_prodi = Set(Some(id_prodi));
    }
    if let Some(nama_program_studi) = payload.nama_program_studi {
        active_model.nama_program_studi = Set(Some(nama_program_studi));
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
    if let Some(rencana_minggu_pertemuan) = payload.rencana_minggu_pertemuan {
        active_model.rencana_minggu_pertemuan = Set(Some(rencana_minggu_pertemuan));
    }
    if let Some(realisasi_minggu_pertemuan) = payload.realisasi_minggu_pertemuan {
        active_model.realisasi_minggu_pertemuan = Set(Some(realisasi_minggu_pertemuan));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(AktifitasMengajarDosenResponse {
            id: item.id,
            id_registrasi_dosen: item.id_registrasi_dosen,
            id_dosen: item.id_dosen,
            nama_dosen: item.nama_dosen,
            id_periode: item.id_periode,
            nama_periode: item.nama_periode,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_matkul: item.id_matkul,
            nama_mata_kuliah: item.nama_mata_kuliah,
            id_kelas: item.id_kelas,
            nama_kelas_kuliah: item.nama_kelas_kuliah,
            rencana_minggu_pertemuan: item.rencana_minggu_pertemuan,
            realisasi_minggu_pertemuan: item.realisasi_minggu_pertemuan,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Feeder - Master - AktifitasMengajarDosen"), status_codes(200, 400, 404, 500))]
pub async fn delete_aktifitas_mengajar_dosen(
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
        .ok_or_else(|| StatusError::not_found().brief("AktifitasMengajarDosen not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "AktifitasMengajarDosen deleted successfully".to_string(),
    }))
}
