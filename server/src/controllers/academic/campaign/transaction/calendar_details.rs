use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::campaign::transaction::calendar_details::{
    CreateCalendarDetailRequest, CalendarDetailQuery, CalendarDetailResponse, PaginatedCalendarDetailResponse,
    UpdateCalendarDetailRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::campaign::transaction::calendar_details as entity_mod;

#[endpoint(tags("Academic - Campaign - Transaction - CalendarDetail"), status_codes(200, 500))]
pub async fn list_calendar_details(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCalendarDetailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CalendarDetailQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| CalendarDetailResponse {
            id: item.id,
            name: item.name.clone(),
            calendar_category_id: item.calendar_category_id,
            calendar_id: item.calendar_id,
            start_date: item.start_date,
            end_date: item.end_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedCalendarDetailResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - CalendarDetail"), status_codes(200, 400, 404, 500))]
pub async fn get_calendar_detail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CalendarDetailResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("CalendarDetail not found"))?;

    Ok(Json(CalendarDetailResponse {
            id: item.id,
            name: item.name.clone(),
            calendar_category_id: item.calendar_category_id,
            calendar_id: item.calendar_id,
            start_date: item.start_date,
            end_date: item.end_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - CalendarDetail"), status_codes(200, 400, 500))]
pub async fn create_calendar_detail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CalendarDetailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateCalendarDetailRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        name: Set(payload.name),
        calendar_category_id: Set(payload.calendar_category_id),
        calendar_id: Set(payload.calendar_id),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CalendarDetailResponse {
            id: item.id,
            name: item.name.clone(),
            calendar_category_id: item.calendar_category_id,
            calendar_id: item.calendar_id,
            start_date: item.start_date,
            end_date: item.end_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - CalendarDetail"), status_codes(200, 400, 404, 500))]
pub async fn update_calendar_detail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CalendarDetailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateCalendarDetailRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("CalendarDetail not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(calendar_category_id) = payload.calendar_category_id {
        active_model.calendar_category_id = Set(calendar_category_id);
    }
    if let Some(calendar_id) = payload.calendar_id {
        active_model.calendar_id = Set(calendar_id);
    }
    if let Some(start_date) = payload.start_date {
        active_model.start_date = Set(start_date);
    }
    if let Some(end_date) = payload.end_date {
        active_model.end_date = Set(end_date);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CalendarDetailResponse {
            id: item.id,
            name: item.name.clone(),
            calendar_category_id: item.calendar_category_id,
            calendar_id: item.calendar_id,
            start_date: item.start_date,
            end_date: item.end_date,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - CalendarDetail"), status_codes(200, 400, 404, 500))]
pub async fn delete_calendar_detail(
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
        .ok_or_else(|| StatusError::not_found().brief("CalendarDetail not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "CalendarDetail deleted successfully".to_string(),
    }))
}
