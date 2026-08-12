use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::lecturer::transaction::academic_ranks::{
    CreateAcademicRankRequest, AcademicRankQuery, AcademicRankResponse, PaginatedAcademicRankResponse,
    UpdateAcademicRankRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::lecturer::transaction::academic_ranks as entity_mod;

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicRank"), status_codes(200, 500))]
pub async fn list_academic_ranks(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedAcademicRankResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: AcademicRankQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| AcademicRankResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            rank_id: item.rank_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,

    }).collect();

    Ok(Json(PaginatedAcademicRankResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicRank"), status_codes(200, 400, 404, 500))]
pub async fn get_academic_rank(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AcademicRankResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("AcademicRank not found"))?;

    Ok(Json(AcademicRankResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            rank_id: item.rank_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,

    }))
}#[endpoint(tags("Academic - Lecturer - Transaction - AcademicRank"), status_codes(200, 400, 500))]
pub async fn create_academic_rank(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AcademicRankResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateAcademicRankRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        decree_number: Set(payload.decree_number),
        decree_date: Set(payload.decree_date),
        lecturer_id: Set(payload.lecturer_id),
        rank_id: Set(payload.rank_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AcademicRankResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            rank_id: item.rank_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,

        }))
}

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicRank"), status_codes(200, 400, 404, 500))]
pub async fn update_academic_rank(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AcademicRankResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateAcademicRankRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("AcademicRank not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(decree_number) = payload.decree_number {
            active_model.decree_number = Set(Some(decree_number));
        }
    if let Some(decree_date) = payload.decree_date {
            active_model.decree_date = Set(Some(decree_date));
        }
    if let Some(lecturer_id) = payload.lecturer_id {
            active_model.lecturer_id = Set(lecturer_id);
        }
    if let Some(rank_id) = payload.rank_id {
            active_model.rank_id = Set(rank_id);
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AcademicRankResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            rank_id: item.rank_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,

        }))
}
#[endpoint(tags("Academic - Lecturer - Transaction - AcademicRank"), status_codes(200, 400, 404, 500))]
pub async fn delete_academic_rank(
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
            .ok_or_else(|| StatusError::not_found().brief("AcademicRank not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "AcademicRank deleted successfully".to_string(),
        }))
}
