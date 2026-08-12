use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::referensi::periode_lampau::{
    CreatePeriodeLampauRequest, PeriodeLampauQuery, PeriodeLampauResponse, PaginatedPeriodeLampauResponse,
    UpdatePeriodeLampauRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::referensi::periode_lampau as entity_mod;

#[endpoint(tags("Feeder - Referensi - PeriodeLampau"), status_codes(200, 500))]
pub async fn list_periode_lampau(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedPeriodeLampauResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: PeriodeLampauQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| PeriodeLampauResponse {
            id: item.id,
            id_program_studi: item.id_program_studi,
            program_studi: item.program_studi,
            id_semester: item.id_semester,
            semester: item.semester,
            tanggal_mulai_perkuliahan: item.tanggal_mulai_perkuliahan,
            tanggal_selesai_perkuliahan: item.tanggal_selesai_perkuliahan,
            tipe_periode: item.tipe_periode,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedPeriodeLampauResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Referensi - PeriodeLampau"), status_codes(200, 400, 404, 500))]
pub async fn get_periode_lampau(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PeriodeLampauResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("PeriodeLampau not found"))?;

    Ok(Json(PeriodeLampauResponse {
            id: item.id,
            id_program_studi: item.id_program_studi,
            program_studi: item.program_studi,
            id_semester: item.id_semester,
            semester: item.semester,
            tanggal_mulai_perkuliahan: item.tanggal_mulai_perkuliahan,
            tanggal_selesai_perkuliahan: item.tanggal_selesai_perkuliahan,
            tipe_periode: item.tipe_periode,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Referensi - PeriodeLampau"), status_codes(200, 400, 500))]
pub async fn create_periode_lampau(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PeriodeLampauResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreatePeriodeLampauRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_program_studi: Set(payload.id_program_studi),
        program_studi: Set(payload.program_studi),
        id_semester: Set(payload.id_semester),
        semester: Set(payload.semester),
        tanggal_mulai_perkuliahan: Set(payload.tanggal_mulai_perkuliahan),
        tanggal_selesai_perkuliahan: Set(payload.tanggal_selesai_perkuliahan),
        tipe_periode: Set(payload.tipe_periode),
        sync_at: Set(None),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PeriodeLampauResponse {
            id: item.id,
            id_program_studi: item.id_program_studi,
            program_studi: item.program_studi,
            id_semester: item.id_semester,
            semester: item.semester,
            tanggal_mulai_perkuliahan: item.tanggal_mulai_perkuliahan,
            tanggal_selesai_perkuliahan: item.tanggal_selesai_perkuliahan,
            tipe_periode: item.tipe_periode,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Referensi - PeriodeLampau"), status_codes(200, 400, 404, 500))]
pub async fn update_periode_lampau(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<PeriodeLampauResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdatePeriodeLampauRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("PeriodeLampau not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_program_studi) = payload.id_program_studi {
            active_model.id_program_studi = Set(Some(id_program_studi));
        }
    if let Some(program_studi) = payload.program_studi {
            active_model.program_studi = Set(Some(program_studi));
        }
    if let Some(id_semester) = payload.id_semester {
            active_model.id_semester = Set(Some(id_semester));
        }
    if let Some(semester) = payload.semester {
            active_model.semester = Set(Some(semester));
        }
    if let Some(tanggal_mulai_perkuliahan) = payload.tanggal_mulai_perkuliahan {
            active_model.tanggal_mulai_perkuliahan = Set(Some(tanggal_mulai_perkuliahan));
        }
    if let Some(tanggal_selesai_perkuliahan) = payload.tanggal_selesai_perkuliahan {
            active_model.tanggal_selesai_perkuliahan = Set(Some(tanggal_selesai_perkuliahan));
        }
    if let Some(tipe_periode) = payload.tipe_periode {
            active_model.tipe_periode = Set(Some(tipe_periode));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(PeriodeLampauResponse {
            id: item.id,
            id_program_studi: item.id_program_studi,
            program_studi: item.program_studi,
            id_semester: item.id_semester,
            semester: item.semester,
            tanggal_mulai_perkuliahan: item.tanggal_mulai_perkuliahan,
            tanggal_selesai_perkuliahan: item.tanggal_selesai_perkuliahan,
            tipe_periode: item.tipe_periode,
            sync_at: item.sync_at,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Referensi - PeriodeLampau"), status_codes(200, 400, 404, 500))]
pub async fn delete_periode_lampau(
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
            .ok_or_else(|| StatusError::not_found().brief("PeriodeLampau not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "PeriodeLampau deleted successfully".to_string(),
        }))
}
