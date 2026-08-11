use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::final_assignment::transaction::schedules::{
    CreateSchedulRequest, SchedulQuery, SchedulResponse, PaginatedSchedulResponse,
    UpdateSchedulRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::final_assignment::transaction::schedules as entity_mod;

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Schedul"), status_codes(200, 500))]
pub async fn list_schedules(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedSchedulResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: SchedulQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| SchedulResponse {
            id: item.id,
            ecree_number: item.ecree_number,
            schedule_date: item.schedule_date,
            schedule_time: item.schedule_time,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            room_id: item.room_id,
            zoom_meeting: item.zoom_meeting,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedSchedulResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Schedul"), status_codes(200, 400, 404, 500))]
pub async fn get_schedule(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SchedulResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Schedul not found"))?;

    Ok(Json(SchedulResponse {
            id: item.id,
            ecree_number: item.ecree_number,
            schedule_date: item.schedule_date,
            schedule_time: item.schedule_time,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            room_id: item.room_id,
            zoom_meeting: item.zoom_meeting,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Schedul"), status_codes(200, 400, 500))]
pub async fn create_schedule(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SchedulResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateSchedulRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        ecree_number: Set(payload.ecree_number),
        schedule_date: Set(payload.schedule_date),
        schedule_time: Set(payload.schedule_time),
        submission_id: Set(payload.submission_id),
        detail_activity_id: Set(payload.detail_activity_id),
        stage_id: Set(payload.stage_id),
        room_id: Set(payload.room_id),
        zoom_meeting: Set(payload.zoom_meeting),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(SchedulResponse {
            id: item.id,
            ecree_number: item.ecree_number,
            schedule_date: item.schedule_date,
            schedule_time: item.schedule_time,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            room_id: item.room_id,
            zoom_meeting: item.zoom_meeting,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Schedul"), status_codes(200, 400, 404, 500))]
pub async fn update_schedule(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SchedulResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateSchedulRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Schedul not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(ecree_number) = payload.ecree_number {
        active_model.ecree_number = Set(Some(ecree_number));
    }
    if let Some(schedule_date) = payload.schedule_date {
        active_model.schedule_date = Set(Some(schedule_date));
    }
    if let Some(schedule_time) = payload.schedule_time {
        active_model.schedule_time = Set(Some(schedule_time));
    }
    if let Some(submission_id) = payload.submission_id {
        active_model.submission_id = Set(Some(submission_id));
    }
    if let Some(detail_activity_id) = payload.detail_activity_id {
        active_model.detail_activity_id = Set(detail_activity_id);
    }
    if let Some(stage_id) = payload.stage_id {
        active_model.stage_id = Set(stage_id);
    }
    if let Some(room_id) = payload.room_id {
        active_model.room_id = Set(Some(room_id));
    }
    if let Some(zoom_meeting) = payload.zoom_meeting {
        active_model.zoom_meeting = Set(Some(zoom_meeting));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(SchedulResponse {
            id: item.id,
            ecree_number: item.ecree_number,
            schedule_date: item.schedule_date,
            schedule_time: item.schedule_time,
            submission_id: item.submission_id,
            detail_activity_id: item.detail_activity_id,
            stage_id: item.stage_id,
            room_id: item.room_id,
            zoom_meeting: item.zoom_meeting,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Schedul"), status_codes(200, 400, 404, 500))]
pub async fn delete_schedule(
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
        .ok_or_else(|| StatusError::not_found().brief("Schedul not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Schedul deleted successfully".to_string(),
    }))
}
