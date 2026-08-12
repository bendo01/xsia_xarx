use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::kurikulum::{
    CreateKurikulumRequest, KurikulumQuery, KurikulumResponse, PaginatedKurikulumResponse,
    UpdateKurikulumRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::kurikulum as entity_mod;

#[endpoint(tags("Feeder - Master - Kurikulum"), status_codes(200, 500))]
pub async fn list_kurikulum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedKurikulumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: KurikulumQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| KurikulumResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenj_didik: item.id_jenj_didik,
            jml_sem_normal: item.jml_sem_normal,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            jumlah_sks_lulus: item.jumlah_sks_lulus,
            jumlah_sks_wajib: item.jumlah_sks_wajib,
            jumlah_sks_pilihan: item.jumlah_sks_pilihan,
            jumlah_sks_mata_kuliah_wajib: item.jumlah_sks_mata_kuliah_wajib,
            jumlah_sks_mata_kuliah_pilihan: item.jumlah_sks_mata_kuliah_pilihan,
            status_sync: item.status_sync,

    }).collect();

    Ok(Json(PaginatedKurikulumResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - Kurikulum"), status_codes(200, 400, 404, 500))]
pub async fn get_kurikulum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<KurikulumResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Kurikulum not found"))?;

    Ok(Json(KurikulumResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenj_didik: item.id_jenj_didik,
            jml_sem_normal: item.jml_sem_normal,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            jumlah_sks_lulus: item.jumlah_sks_lulus,
            jumlah_sks_wajib: item.jumlah_sks_wajib,
            jumlah_sks_pilihan: item.jumlah_sks_pilihan,
            jumlah_sks_mata_kuliah_wajib: item.jumlah_sks_mata_kuliah_wajib,
            jumlah_sks_mata_kuliah_pilihan: item.jumlah_sks_mata_kuliah_pilihan,
            status_sync: item.status_sync,

    }))
}#[endpoint(tags("Feeder - Master - Kurikulum"), status_codes(200, 400, 500))]
pub async fn create_kurikulum(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<KurikulumResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateKurikulumRequest = req.parse_json().await.map_err(|e| {
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
        id_kurikulum: Set(payload.id_kurikulum),
        nama_kurikulum: Set(payload.nama_kurikulum),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        id_jenj_didik: Set(payload.id_jenj_didik),
        jml_sem_normal: Set(payload.jml_sem_normal),
        id_semester: Set(payload.id_semester),
        semester_mulai_berlaku: Set(payload.semester_mulai_berlaku),
        jumlah_sks_lulus: Set(payload.jumlah_sks_lulus),
        jumlah_sks_wajib: Set(payload.jumlah_sks_wajib),
        jumlah_sks_pilihan: Set(payload.jumlah_sks_pilihan),
        jumlah_sks_mata_kuliah_wajib: Set(payload.jumlah_sks_mata_kuliah_wajib),
        jumlah_sks_mata_kuliah_pilihan: Set(payload.jumlah_sks_mata_kuliah_pilihan),
        status_sync: Set(payload.status_sync),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(KurikulumResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenj_didik: item.id_jenj_didik,
            jml_sem_normal: item.jml_sem_normal,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            jumlah_sks_lulus: item.jumlah_sks_lulus,
            jumlah_sks_wajib: item.jumlah_sks_wajib,
            jumlah_sks_pilihan: item.jumlah_sks_pilihan,
            jumlah_sks_mata_kuliah_wajib: item.jumlah_sks_mata_kuliah_wajib,
            jumlah_sks_mata_kuliah_pilihan: item.jumlah_sks_mata_kuliah_pilihan,
            status_sync: item.status_sync,

        }))
}

#[endpoint(tags("Feeder - Master - Kurikulum"), status_codes(200, 400, 404, 500))]
pub async fn update_kurikulum(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<KurikulumResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateKurikulumRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Kurikulum not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_kurikulum) = payload.id_kurikulum {
            active_model.id_kurikulum = Set(Some(id_kurikulum));
        }
    if let Some(nama_kurikulum) = payload.nama_kurikulum {
            active_model.nama_kurikulum = Set(Some(nama_kurikulum));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(id_jenj_didik) = payload.id_jenj_didik {
            active_model.id_jenj_didik = Set(Some(id_jenj_didik));
        }
    if let Some(jml_sem_normal) = payload.jml_sem_normal {
            active_model.jml_sem_normal = Set(Some(jml_sem_normal));
        }
    if let Some(id_semester) = payload.id_semester {
            active_model.id_semester = Set(Some(id_semester));
        }
    if let Some(semester_mulai_berlaku) = payload.semester_mulai_berlaku {
            active_model.semester_mulai_berlaku = Set(Some(semester_mulai_berlaku));
        }
    if let Some(jumlah_sks_lulus) = payload.jumlah_sks_lulus {
            active_model.jumlah_sks_lulus = Set(Some(jumlah_sks_lulus));
        }
    if let Some(jumlah_sks_wajib) = payload.jumlah_sks_wajib {
            active_model.jumlah_sks_wajib = Set(Some(jumlah_sks_wajib));
        }
    if let Some(jumlah_sks_pilihan) = payload.jumlah_sks_pilihan {
            active_model.jumlah_sks_pilihan = Set(Some(jumlah_sks_pilihan));
        }
    if let Some(jumlah_sks_mata_kuliah_wajib) = payload.jumlah_sks_mata_kuliah_wajib {
            active_model.jumlah_sks_mata_kuliah_wajib = Set(Some(jumlah_sks_mata_kuliah_wajib));
        }
    if let Some(jumlah_sks_mata_kuliah_pilihan) = payload.jumlah_sks_mata_kuliah_pilihan {
            active_model.jumlah_sks_mata_kuliah_pilihan = Set(Some(jumlah_sks_mata_kuliah_pilihan));
        }
    if let Some(status_sync) = payload.status_sync {
            active_model.status_sync = Set(Some(status_sync));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(KurikulumResponse {
            id: item.id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            id_kurikulum: item.id_kurikulum,
            nama_kurikulum: item.nama_kurikulum,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            id_jenj_didik: item.id_jenj_didik,
            jml_sem_normal: item.jml_sem_normal,
            id_semester: item.id_semester,
            semester_mulai_berlaku: item.semester_mulai_berlaku,
            jumlah_sks_lulus: item.jumlah_sks_lulus,
            jumlah_sks_wajib: item.jumlah_sks_wajib,
            jumlah_sks_pilihan: item.jumlah_sks_pilihan,
            jumlah_sks_mata_kuliah_wajib: item.jumlah_sks_mata_kuliah_wajib,
            jumlah_sks_mata_kuliah_pilihan: item.jumlah_sks_mata_kuliah_pilihan,
            status_sync: item.status_sync,

        }))
}
#[endpoint(tags("Feeder - Master - Kurikulum"), status_codes(200, 400, 404, 500))]
pub async fn delete_kurikulum(
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
            .ok_or_else(|| StatusError::not_found().brief("Kurikulum not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Kurikulum deleted successfully".to_string(),
        }))
}
