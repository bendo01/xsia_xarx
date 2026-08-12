use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::referensi::semester::{
    CreateSemesterRequest, SemesterQuery, SemesterResponse, PaginatedSemesterResponse,
    UpdateSemesterRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::referensi::semester as entity_mod;

#[endpoint(tags("Feeder - Referensi - Semester"), status_codes(200, 500))]
pub async fn list_semester(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedSemesterResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: SemesterQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| SemesterResponse {
            id: item.id,
            id_semester: item.id_semester,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_semester: item.nama_semester,
            semester: item.semester,
            a_periode_aktif: item.a_periode_aktif,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedSemesterResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Referensi - Semester"), status_codes(200, 400, 404, 500))]
pub async fn get_semester(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SemesterResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Semester not found"))?;

    Ok(Json(SemesterResponse {
            id: item.id,
            id_semester: item.id_semester,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_semester: item.nama_semester,
            semester: item.semester,
            a_periode_aktif: item.a_periode_aktif,
            tanggal_mulai: item.tanggal_mulai,
            tanggal_selesai: item.tanggal_selesai,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Referensi - Semester"), status_codes(200, 400, 500))]
pub async fn create_semester(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<SemesterResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateSemesterRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_semester: Set(payload.id_semester),
        id_tahun_ajaran: Set(payload.id_tahun_ajaran),
        nama_semester: Set(payload.nama_semester),
        semester: Set(payload.semester),
        a_periode_aktif: Set(payload.a_periode_aktif),
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

        Ok(Json(SemesterResponse {
            id: item.id,
            id_semester: item.id_semester,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_semester: item.nama_semester,
            semester: item.semester,
            a_periode_aktif: item.a_periode_aktif,
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

#[endpoint(tags("Feeder - Referensi - Semester"), status_codes(200, 400, 404, 500))]
pub async fn update_semester(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<SemesterResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateSemesterRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Semester not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_semester) = payload.id_semester {
            active_model.id_semester = Set(Some(id_semester));
        }
    if let Some(id_tahun_ajaran) = payload.id_tahun_ajaran {
            active_model.id_tahun_ajaran = Set(Some(id_tahun_ajaran));
        }
    if let Some(nama_semester) = payload.nama_semester {
            active_model.nama_semester = Set(Some(nama_semester));
        }
    if let Some(semester) = payload.semester {
            active_model.semester = Set(Some(semester));
        }
    if let Some(a_periode_aktif) = payload.a_periode_aktif {
            active_model.a_periode_aktif = Set(Some(a_periode_aktif));
        }
    if let Some(tanggal_mulai) = payload.tanggal_mulai {
            active_model.tanggal_mulai = Set(Some(tanggal_mulai));
        }
    if let Some(tanggal_selesai) = payload.tanggal_selesai {
            active_model.tanggal_selesai = Set(Some(tanggal_selesai));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(SemesterResponse {
            id: item.id,
            id_semester: item.id_semester,
            id_tahun_ajaran: item.id_tahun_ajaran,
            nama_semester: item.nama_semester,
            semester: item.semester,
            a_periode_aktif: item.a_periode_aktif,
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
#[endpoint(tags("Feeder - Referensi - Semester"), status_codes(200, 400, 404, 500))]
pub async fn delete_semester(
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
            .ok_or_else(|| StatusError::not_found().brief("Semester not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Semester deleted successfully".to_string(),
        }))
}
