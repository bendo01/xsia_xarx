use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::campaign::transaction::schedules::{
    CreateScheduleRequest, ScheduleQuery, ScheduleResponse, PaginatedScheduleResponse,
    UpdateScheduleRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::campaign::transaction::schedules as entity_mod;

#[endpoint(tags("Academic - Campaign - Transaction - Schedule"), status_codes(200, 500))]
pub async fn list_schedules(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedScheduleResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ScheduleQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| ScheduleResponse {
            id: item.id,
            name: item.name,
            start_hour: item.start_hour,
            end_hour: item.end_hour,
            weekday_id: item.weekday_id,
            room_id: item.room_id,
            teach_id: item.teach_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedScheduleResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Schedule"), status_codes(200, 400, 404, 500))]
pub async fn get_schedule(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ScheduleResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Schedule not found"))?;

    Ok(Json(ScheduleResponse {
            id: item.id,
            name: item.name,
            start_hour: item.start_hour,
            end_hour: item.end_hour,
            weekday_id: item.weekday_id,
            room_id: item.room_id,
            teach_id: item.teach_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Campaign - Transaction - Schedule"), status_codes(200, 400, 500))]
pub async fn create_schedule(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ScheduleResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateScheduleRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        start_hour: Set(payload.start_hour),
        end_hour: Set(payload.end_hour),
        weekday_id: Set(payload.weekday_id),
        room_id: Set(payload.room_id),
        teach_id: Set(payload.teach_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ScheduleResponse {
            id: item.id,
            name: item.name,
            start_hour: item.start_hour,
            end_hour: item.end_hour,
            weekday_id: item.weekday_id,
            room_id: item.room_id,
            teach_id: item.teach_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Schedule"), status_codes(200, 400, 404, 500))]
pub async fn update_schedule(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ScheduleResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateScheduleRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Schedule not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(start_hour) = payload.start_hour {
            active_model.start_hour = Set(start_hour);
        }
    if let Some(end_hour) = payload.end_hour {
            active_model.end_hour = Set(end_hour);
        }
    if let Some(weekday_id) = payload.weekday_id {
            active_model.weekday_id = Set(weekday_id);
        }
    if let Some(room_id) = payload.room_id {
            active_model.room_id = Set(room_id);
        }
    if let Some(teach_id) = payload.teach_id {
            active_model.teach_id = Set(teach_id);
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ScheduleResponse {
            id: item.id,
            name: item.name,
            start_hour: item.start_hour,
            end_hour: item.end_hour,
            weekday_id: item.weekday_id,
            room_id: item.room_id,
            teach_id: item.teach_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Campaign - Transaction - Schedule"), status_codes(200, 400, 404, 500))]
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
            .ok_or_else(|| StatusError::not_found().brief("Schedule not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Schedule deleted successfully".to_string(),
        }))
}
