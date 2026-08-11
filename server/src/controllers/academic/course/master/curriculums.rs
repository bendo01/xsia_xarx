use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::course::master::curriculums::{
    CreateCurriculumRequest, CurriculumQuery, CurriculumResponse, PaginatedCurriculumResponse,
    UpdateCurriculumRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::course::master::curriculums as entity_mod;

#[endpoint(tags("Academic - Course - Master - Curriculum"), status_codes(200, 500))]
pub async fn list_curriculums(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCurriculumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CurriculumQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| CurriculumResponse {
            id: item.id,
            name: item.name.clone(),
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            curriculum_type_id: item.curriculum_type_id,
            total_credit: item.total_credit,
            mandatory_course_credit: item.mandatory_course_credit,
            optional_course_credit: item.optional_course_credit,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            is_active: item.is_active,

    }).collect();

    Ok(Json(PaginatedCurriculumResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Course - Master - Curriculum"), status_codes(200, 400, 404, 500))]
pub async fn get_curriculum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CurriculumResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Curriculum not found"))?;

    Ok(Json(CurriculumResponse {
            id: item.id,
            name: item.name.clone(),
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            curriculum_type_id: item.curriculum_type_id,
            total_credit: item.total_credit,
            mandatory_course_credit: item.mandatory_course_credit,
            optional_course_credit: item.optional_course_credit,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            is_active: item.is_active,

    }))
}

#[endpoint(tags("Academic - Course - Master - Curriculum"), status_codes(200, 400, 500))]
pub async fn create_curriculum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CurriculumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateCurriculumRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        name: Set(payload.name),
        unit_id: Set(payload.unit_id),
        academic_year_id: Set(payload.academic_year_id),
        curriculum_type_id: Set(payload.curriculum_type_id),
        total_credit: Set(payload.total_credit),
        mandatory_course_credit: Set(payload.mandatory_course_credit),
        optional_course_credit: Set(payload.optional_course_credit),
        feeder_id: Set(payload.feeder_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        is_active: Set(payload.is_active),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CurriculumResponse {
            id: item.id,
            name: item.name.clone(),
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            curriculum_type_id: item.curriculum_type_id,
            total_credit: item.total_credit,
            mandatory_course_credit: item.mandatory_course_credit,
            optional_course_credit: item.optional_course_credit,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            is_active: item.is_active,

    }))
}

#[endpoint(tags("Academic - Course - Master - Curriculum"), status_codes(200, 400, 404, 500))]
pub async fn update_curriculum(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CurriculumResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateCurriculumRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Curriculum not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(unit_id) = payload.unit_id {
        active_model.unit_id = Set(unit_id);
    }
    if let Some(academic_year_id) = payload.academic_year_id {
        active_model.academic_year_id = Set(academic_year_id);
    }
    if let Some(curriculum_type_id) = payload.curriculum_type_id {
        active_model.curriculum_type_id = Set(curriculum_type_id);
    }
    if let Some(total_credit) = payload.total_credit {
        active_model.total_credit = Set(Some(total_credit));
    }
    if let Some(mandatory_course_credit) = payload.mandatory_course_credit {
        active_model.mandatory_course_credit = Set(Some(mandatory_course_credit));
    }
    if let Some(optional_course_credit) = payload.optional_course_credit {
        active_model.optional_course_credit = Set(Some(optional_course_credit));
    }
    if let Some(feeder_id) = payload.feeder_id {
        active_model.feeder_id = Set(Some(feeder_id));
    }
    if let Some(start_date) = payload.start_date {
        active_model.start_date = Set(Some(start_date));
    }
    if let Some(end_date) = payload.end_date {
        active_model.end_date = Set(Some(end_date));
    }
    if let Some(is_active) = payload.is_active {
        active_model.is_active = Set(is_active);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CurriculumResponse {
            id: item.id,
            name: item.name.clone(),
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            curriculum_type_id: item.curriculum_type_id,
            total_credit: item.total_credit,
            mandatory_course_credit: item.mandatory_course_credit,
            optional_course_credit: item.optional_course_credit,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            is_active: item.is_active,

    }))
}

#[endpoint(tags("Academic - Course - Master - Curriculum"), status_codes(200, 400, 404, 500))]
pub async fn delete_curriculum(
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
        .ok_or_else(|| StatusError::not_found().brief("Curriculum not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Curriculum deleted successfully".to_string(),
    }))
}
