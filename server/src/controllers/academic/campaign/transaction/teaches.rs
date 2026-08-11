use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::campaign::transaction::teaches::{
    CreateTeachRequest, TeachQuery, TeachResponse, PaginatedTeachResponse,
    UpdateTeachRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::campaign::transaction::teaches as entity_mod;

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 500))]
pub async fn list_teaches(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedTeachResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: TeachQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,

    }).collect();

    Ok(Json(PaginatedTeachResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 404, 500))]
pub async fn get_teache(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<TeachResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Teach not found"))?;

    Ok(Json(TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,

    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 500))]
pub async fn create_teache(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<TeachResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateTeachRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        name: Set(payload.name),
        class_code_id: Set(payload.class_code_id),
        course_id: Set(payload.course_id),
        activity_id: Set(payload.activity_id),
        description: Set(payload.description),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        practice_start_date: Set(payload.practice_start_date),
        practice_end_date: Set(payload.practice_end_date),
        curriculum_detail_id: Set(payload.curriculum_detail_id),
        teach_decree_id: Set(payload.teach_decree_id),
        is_lecturer_credit_sum_problem: Set(payload.is_lecturer_credit_sum_problem),
        is_lock: Set(payload.is_lock),
        encounter_category_id: Set(payload.encounter_category_id),
        scope_id: Set(payload.scope_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        max_member: Set(payload.max_member),
        feeder_id: Set(payload.feeder_id),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,

    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 404, 500))]
pub async fn update_teache(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<TeachResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateTeachRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Teach not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
        active_model.name = Set(Some(name));
    }
    if let Some(class_code_id) = payload.class_code_id {
        active_model.class_code_id = Set(class_code_id);
    }
    if let Some(course_id) = payload.course_id {
        active_model.course_id = Set(course_id);
    }
    if let Some(activity_id) = payload.activity_id {
        active_model.activity_id = Set(Some(activity_id));
    }
    if let Some(description) = payload.description {
        active_model.description = Set(Some(description));
    }
    if let Some(start_date) = payload.start_date {
        active_model.start_date = Set(Some(start_date));
    }
    if let Some(end_date) = payload.end_date {
        active_model.end_date = Set(Some(end_date));
    }
    if let Some(practice_start_date) = payload.practice_start_date {
        active_model.practice_start_date = Set(Some(practice_start_date));
    }
    if let Some(practice_end_date) = payload.practice_end_date {
        active_model.practice_end_date = Set(Some(practice_end_date));
    }
    if let Some(curriculum_detail_id) = payload.curriculum_detail_id {
        active_model.curriculum_detail_id = Set(Some(curriculum_detail_id));
    }
    if let Some(teach_decree_id) = payload.teach_decree_id {
        active_model.teach_decree_id = Set(teach_decree_id);
    }
    if let Some(is_lecturer_credit_sum_problem) = payload.is_lecturer_credit_sum_problem {
        active_model.is_lecturer_credit_sum_problem = Set(Some(is_lecturer_credit_sum_problem));
    }
    if let Some(is_lock) = payload.is_lock {
        active_model.is_lock = Set(Some(is_lock));
    }
    if let Some(encounter_category_id) = payload.encounter_category_id {
        active_model.encounter_category_id = Set(Some(encounter_category_id));
    }
    if let Some(scope_id) = payload.scope_id {
        active_model.scope_id = Set(Some(scope_id));
    }
    if let Some(max_member) = payload.max_member {
        active_model.max_member = Set(Some(max_member));
    }
    if let Some(feeder_id) = payload.feeder_id {
        active_model.feeder_id = Set(Some(feeder_id));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(TeachResponse {
            id: item.id,
            name: item.name,
            class_code_id: item.class_code_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            description: item.description,
            start_date: item.start_date,
            end_date: item.end_date,
            practice_start_date: item.practice_start_date,
            practice_end_date: item.practice_end_date,
            curriculum_detail_id: item.curriculum_detail_id,
            teach_decree_id: item.teach_decree_id,
            is_lecturer_credit_sum_problem: item.is_lecturer_credit_sum_problem,
            is_lock: item.is_lock,
            encounter_category_id: item.encounter_category_id,
            scope_id: item.scope_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            max_member: item.max_member,
            feeder_id: item.feeder_id,

    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Teach"), status_codes(200, 400, 404, 500))]
pub async fn delete_teache(
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
        .ok_or_else(|| StatusError::not_found().brief("Teach not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Teach deleted successfully".to_string(),
    }))
}
