use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::convertions::{
    CreateConvertionRequest, ConvertionQuery, ConvertionResponse, PaginatedConvertionResponse,
    UpdateConvertionRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::campaign::convertions as entity_mod;

#[endpoint(tags("Academic - Student - Campaign - Convertion"), status_codes(200, 500))]
pub async fn list_convertions(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedConvertionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ConvertionQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| ConvertionResponse {
            id: item.id,
            student_id: item.student_id,
            course_id: item.course_id,
            grade_id: item.grade_id,
            transfer_code: item.transfer_code.clone(),
            transfer_name: item.transfer_name.clone(),
            transfer_credit: item.transfer_credit,
            transfer_grade: item.transfer_grade.clone(),
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            academic_year_id: item.academic_year_id,
            origin_code: item.origin_code,
            origin_name: item.origin_name,
            origin_credit: item.origin_credit,
            origin_grade: item.origin_grade,

    }).collect();

    Ok(Json(PaginatedConvertionResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Campaign - Convertion"), status_codes(200, 400, 404, 500))]
pub async fn get_convertion(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ConvertionResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Convertion not found"))?;

    Ok(Json(ConvertionResponse {
            id: item.id,
            student_id: item.student_id,
            course_id: item.course_id,
            grade_id: item.grade_id,
            transfer_code: item.transfer_code.clone(),
            transfer_name: item.transfer_name.clone(),
            transfer_credit: item.transfer_credit,
            transfer_grade: item.transfer_grade.clone(),
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            academic_year_id: item.academic_year_id,
            origin_code: item.origin_code,
            origin_name: item.origin_name,
            origin_credit: item.origin_credit,
            origin_grade: item.origin_grade,

    }))
}

#[endpoint(tags("Academic - Student - Campaign - Convertion"), status_codes(200, 400, 500))]
pub async fn create_convertion(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ConvertionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateConvertionRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        student_id: Set(payload.student_id),
        course_id: Set(payload.course_id),
        grade_id: Set(payload.grade_id),
        transfer_code: Set(payload.transfer_code),
        transfer_name: Set(payload.transfer_name),
        transfer_credit: Set(payload.transfer_credit),
        transfer_grade: Set(payload.transfer_grade),
        is_lock: Set(payload.is_lock),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        feeder_id: Set(payload.feeder_id),
        name: Set(payload.name),
        academic_year_id: Set(payload.academic_year_id),
        origin_code: Set(payload.origin_code),
        origin_name: Set(payload.origin_name),
        origin_credit: Set(payload.origin_credit),
        origin_grade: Set(payload.origin_grade),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ConvertionResponse {
            id: item.id,
            student_id: item.student_id,
            course_id: item.course_id,
            grade_id: item.grade_id,
            transfer_code: item.transfer_code.clone(),
            transfer_name: item.transfer_name.clone(),
            transfer_credit: item.transfer_credit,
            transfer_grade: item.transfer_grade.clone(),
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            academic_year_id: item.academic_year_id,
            origin_code: item.origin_code,
            origin_name: item.origin_name,
            origin_credit: item.origin_credit,
            origin_grade: item.origin_grade,

    }))
}

#[endpoint(tags("Academic - Student - Campaign - Convertion"), status_codes(200, 400, 404, 500))]
pub async fn update_convertion(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ConvertionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateConvertionRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Convertion not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(student_id) = payload.student_id {
        active_model.student_id = Set(student_id);
    }
    if let Some(course_id) = payload.course_id {
        active_model.course_id = Set(course_id);
    }
    if let Some(grade_id) = payload.grade_id {
        active_model.grade_id = Set(grade_id);
    }
    if let Some(transfer_code) = payload.transfer_code {
        active_model.transfer_code = Set(transfer_code);
    }
    if let Some(transfer_name) = payload.transfer_name {
        active_model.transfer_name = Set(transfer_name);
    }
    if let Some(transfer_credit) = payload.transfer_credit {
        active_model.transfer_credit = Set(transfer_credit);
    }
    if let Some(transfer_grade) = payload.transfer_grade {
        active_model.transfer_grade = Set(transfer_grade);
    }
    if let Some(is_lock) = payload.is_lock {
        active_model.is_lock = Set(Some(is_lock));
    }
    if let Some(feeder_id) = payload.feeder_id {
        active_model.feeder_id = Set(Some(feeder_id));
    }
    if let Some(name) = payload.name {
        active_model.name = Set(Some(name));
    }
    if let Some(academic_year_id) = payload.academic_year_id {
        active_model.academic_year_id = Set(Some(academic_year_id));
    }
    if let Some(origin_code) = payload.origin_code {
        active_model.origin_code = Set(Some(origin_code));
    }
    if let Some(origin_name) = payload.origin_name {
        active_model.origin_name = Set(Some(origin_name));
    }
    if let Some(origin_credit) = payload.origin_credit {
        active_model.origin_credit = Set(Some(origin_credit));
    }
    if let Some(origin_grade) = payload.origin_grade {
        active_model.origin_grade = Set(Some(origin_grade));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ConvertionResponse {
            id: item.id,
            student_id: item.student_id,
            course_id: item.course_id,
            grade_id: item.grade_id,
            transfer_code: item.transfer_code.clone(),
            transfer_name: item.transfer_name.clone(),
            transfer_credit: item.transfer_credit,
            transfer_grade: item.transfer_grade.clone(),
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            academic_year_id: item.academic_year_id,
            origin_code: item.origin_code,
            origin_name: item.origin_name,
            origin_credit: item.origin_credit,
            origin_grade: item.origin_grade,

    }))
}

#[endpoint(tags("Academic - Student - Campaign - Convertion"), status_codes(200, 400, 404, 500))]
pub async fn delete_convertion(
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
        .ok_or_else(|| StatusError::not_found().brief("Convertion not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Convertion deleted successfully".to_string(),
    }))
}
