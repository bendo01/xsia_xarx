use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::final_assignment::transaction::submissions::{
    CreateSubmissionRequest, SubmissionQuery, SubmissionResponse, PaginatedSubmissionResponse,
    UpdateSubmissionRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::final_assignment::transaction::submissions as entity_mod;

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Submission"), status_codes(200, 500))]
pub async fn list_submissions(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedSubmissionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: SubmissionQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| SubmissionResponse {
            id: item.id,
            title: item.title,
            student_id: item.student_id,
            approval_type_id: item.approval_type_id,
            category_id: item.category_id,
            stage_id: item.stage_id,
            final_assignment_decree_id: item.final_assignment_decree_id,
            detail_activity_id: item.detail_activity_id,
            is_taken: item.is_taken,
            is_lock: item.is_lock,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            filesize: item.filesize,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedSubmissionResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Submission"), status_codes(200, 400, 404, 500))]
pub async fn get_submission(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubmissionResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Submission not found"))?;

    Ok(Json(SubmissionResponse {
            id: item.id,
            title: item.title,
            student_id: item.student_id,
            approval_type_id: item.approval_type_id,
            category_id: item.category_id,
            stage_id: item.stage_id,
            final_assignment_decree_id: item.final_assignment_decree_id,
            detail_activity_id: item.detail_activity_id,
            is_taken: item.is_taken,
            is_lock: item.is_lock,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            filesize: item.filesize,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Submission"), status_codes(200, 400, 500))]
pub async fn create_submission(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubmissionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateSubmissionRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        title: Set(payload.title),
        student_id: Set(payload.student_id),
        approval_type_id: Set(payload.approval_type_id),
        category_id: Set(payload.category_id),
        stage_id: Set(payload.stage_id),
        final_assignment_decree_id: Set(payload.final_assignment_decree_id),
        detail_activity_id: Set(payload.detail_activity_id),
        is_taken: Set(payload.is_taken),
        is_lock: Set(payload.is_lock),
        filename: Set(payload.filename),
        dir: Set(payload.dir),
        r#type: Set(payload.r#type),
        filesize: Set(payload.filesize),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(SubmissionResponse {
            id: item.id,
            title: item.title,
            student_id: item.student_id,
            approval_type_id: item.approval_type_id,
            category_id: item.category_id,
            stage_id: item.stage_id,
            final_assignment_decree_id: item.final_assignment_decree_id,
            detail_activity_id: item.detail_activity_id,
            is_taken: item.is_taken,
            is_lock: item.is_lock,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            filesize: item.filesize,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Submission"), status_codes(200, 400, 404, 500))]
pub async fn update_submission(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<SubmissionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateSubmissionRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Submission not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(title) = payload.title {
        active_model.title = Set(Some(title));
    }
    if let Some(student_id) = payload.student_id {
        active_model.student_id = Set(student_id);
    }
    if let Some(approval_type_id) = payload.approval_type_id {
        active_model.approval_type_id = Set(Some(approval_type_id));
    }
    if let Some(category_id) = payload.category_id {
        active_model.category_id = Set(Some(category_id));
    }
    if let Some(stage_id) = payload.stage_id {
        active_model.stage_id = Set(Some(stage_id));
    }
    if let Some(final_assignment_decree_id) = payload.final_assignment_decree_id {
        active_model.final_assignment_decree_id = Set(Some(final_assignment_decree_id));
    }
    if let Some(detail_activity_id) = payload.detail_activity_id {
        active_model.detail_activity_id = Set(detail_activity_id);
    }
    if let Some(is_taken) = payload.is_taken {
        active_model.is_taken = Set(Some(is_taken));
    }
    if let Some(is_lock) = payload.is_lock {
        active_model.is_lock = Set(Some(is_lock));
    }
    if let Some(filename) = payload.filename {
        active_model.filename = Set(Some(filename));
    }
    if let Some(dir) = payload.dir {
        active_model.dir = Set(Some(dir));
    }
    if let Some(r#type) = payload.r#type {
        active_model.r#type = Set(Some(r#type));
    }
    if let Some(filesize) = payload.filesize {
        active_model.filesize = Set(Some(filesize));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(SubmissionResponse {
            id: item.id,
            title: item.title,
            student_id: item.student_id,
            approval_type_id: item.approval_type_id,
            category_id: item.category_id,
            stage_id: item.stage_id,
            final_assignment_decree_id: item.final_assignment_decree_id,
            detail_activity_id: item.detail_activity_id,
            is_taken: item.is_taken,
            is_lock: item.is_lock,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            filesize: item.filesize,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Final_Assignment - Transaction - Submission"), status_codes(200, 400, 404, 500))]
pub async fn delete_submission(
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
        .ok_or_else(|| StatusError::not_found().brief("Submission not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Submission deleted successfully".to_string(),
    }))
}
