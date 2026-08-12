use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::final_assignment::transaction::final_assignment_decrees::{
    CreateFinalAssignmentDecreeRequest, FinalAssignmentDecreeQuery, FinalAssignmentDecreeResponse, PaginatedFinalAssignmentDecreeResponse,
    UpdateFinalAssignmentDecreeRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::final_assignment::transaction::final_assignment_decrees as entity_mod;

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - FinalAssignmentDecree"), status_codes(200, 500))]
pub async fn list_final_assignment_decrees(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedFinalAssignmentDecreeResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: FinalAssignmentDecreeQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| FinalAssignmentDecreeResponse {
            id: item.id,
            decree_number: item.decree_number.clone(),
            decree_date: item.decree_date,
            unit_id: item.unit_id,
            activity_id: item.activity_id,
            staff_id: item.staff_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedFinalAssignmentDecreeResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - FinalAssignmentDecree"), status_codes(200, 400, 404, 500))]
pub async fn get_final_assignment_decree(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<FinalAssignmentDecreeResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("FinalAssignmentDecree not found"))?;

    Ok(Json(FinalAssignmentDecreeResponse {
            id: item.id,
            decree_number: item.decree_number.clone(),
            decree_date: item.decree_date,
            unit_id: item.unit_id,
            activity_id: item.activity_id,
            staff_id: item.staff_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - FinalAssignmentDecree"), status_codes(200, 400, 500))]
pub async fn create_final_assignment_decree(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<FinalAssignmentDecreeResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateFinalAssignmentDecreeRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        decree_number: Set(payload.decree_number),
        decree_date: Set(payload.decree_date),
        unit_id: Set(payload.unit_id),
        activity_id: Set(payload.activity_id),
        staff_id: Set(payload.staff_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(FinalAssignmentDecreeResponse {
            id: item.id,
            decree_number: item.decree_number.clone(),
            decree_date: item.decree_date,
            unit_id: item.unit_id,
            activity_id: item.activity_id,
            staff_id: item.staff_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - FinalAssignmentDecree"), status_codes(200, 400, 404, 500))]
pub async fn update_final_assignment_decree(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<FinalAssignmentDecreeResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateFinalAssignmentDecreeRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("FinalAssignmentDecree not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(decree_number) = payload.decree_number {
            active_model.decree_number = Set(decree_number);
        }
    if let Some(decree_date) = payload.decree_date {
            active_model.decree_date = Set(decree_date);
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(Some(unit_id));
        }
    if let Some(activity_id) = payload.activity_id {
            active_model.activity_id = Set(Some(activity_id));
        }
    if let Some(staff_id) = payload.staff_id {
            active_model.staff_id = Set(Some(staff_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(FinalAssignmentDecreeResponse {
            id: item.id,
            decree_number: item.decree_number.clone(),
            decree_date: item.decree_date,
            unit_id: item.unit_id,
            activity_id: item.activity_id,
            staff_id: item.staff_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - FinalAssignmentDecree"), status_codes(200, 400, 404, 500))]
pub async fn delete_final_assignment_decree(
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
            .ok_or_else(|| StatusError::not_found().brief("FinalAssignmentDecree not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "FinalAssignmentDecree deleted successfully".to_string(),
        }))
}
