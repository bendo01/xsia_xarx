use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::common::reference::{
    CreateReferenceRequest, MessageResponse, PaginatedReferenceResponse, ReferenceQuery,
    ReferenceResponse, UpdateReferenceRequest,
};
use crate::models::academic::course::reference::course_evaluation_bases as entity_mod;

#[endpoint(tags("Academic - Course - Reference - CourseEvaluationBas"), status_codes(200, 500))]
pub async fn list_course_evaluation_bases(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedReferenceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ReferenceQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Code)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| ReferenceResponse {
            id: item.id,
            code: item.code,
            alphabet_code: String::new(),
            name: String::new(),
            created_at: item.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
            updated_at: item.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedReferenceResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Course - Reference - CourseEvaluationBas"), status_codes(200, 400, 404, 500))]
pub async fn get_course_evaluation_base(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReferenceResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("CourseEvaluationBas not found"))?;

    Ok(Json(ReferenceResponse {
            id: item.id,
            code: item.code,
            alphabet_code: String::new(),
            name: String::new(),
            created_at: item.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
            updated_at: item.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Course - Reference - CourseEvaluationBas"), status_codes(200, 400, 500))]
pub async fn create_course_evaluation_base(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReferenceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateReferenceRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        evaluation_base: Set(Default::default()),
        component_evaluation: Set(Default::default()),
        start_effective_date: Set(None),
        end_effective_date: Set(None),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ReferenceResponse {
            id: item.id,
            code: item.code,
            alphabet_code: String::new(),
            name: String::new(),
            created_at: item.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
            updated_at: item.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Course - Reference - CourseEvaluationBas"), status_codes(200, 400, 404, 500))]
pub async fn update_course_evaluation_base(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReferenceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateReferenceRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("CourseEvaluationBas not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
        active_model.code = Set(code);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ReferenceResponse {
            id: item.id,
            code: item.code,
            alphabet_code: String::new(),
            name: String::new(),
            created_at: item.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
            updated_at: item.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Course - Reference - CourseEvaluationBas"), status_codes(200, 400, 404, 500))]
pub async fn delete_course_evaluation_base(
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
        .ok_or_else(|| StatusError::not_found().brief("CourseEvaluationBas not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "CourseEvaluationBas deleted successfully".to_string(),
    }))
}
