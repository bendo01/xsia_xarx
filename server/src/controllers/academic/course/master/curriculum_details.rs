use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::course::master::curriculum_details::{
    CreateCurriculumDetailRequest, CurriculumDetailQuery, CurriculumDetailResponse, PaginatedCurriculumDetailResponse,
    UpdateCurriculumDetailRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::course::master::curriculum_details as entity_mod;

#[endpoint(tags("Academic - Course - Master - CurriculumDetail"), status_codes(200, 500))]
pub async fn list_curriculum_details(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCurriculumDetailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CurriculumDetailQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| CurriculumDetailResponse {
            id: item.id,
            code: item.code,
            curriculum_id: item.curriculum_id,
            semester_id: item.semester_id,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            credit: item.credit,
            name: item.name,
            concentration_id: item.concentration_id,
            is_convertable_to_mbkm: item.is_convertable_to_mbkm,
            feeder_id: item.feeder_id,
            is_convertable_to_prior_learning_recognition: item.is_convertable_to_prior_learning_recognition,

    }).collect();

    Ok(Json(PaginatedCurriculumDetailResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Course - Master - CurriculumDetail"), status_codes(200, 400, 404, 500))]
pub async fn get_curriculum_detail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CurriculumDetailResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("CurriculumDetail not found"))?;

    Ok(Json(CurriculumDetailResponse {
            id: item.id,
            code: item.code,
            curriculum_id: item.curriculum_id,
            semester_id: item.semester_id,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            credit: item.credit,
            name: item.name,
            concentration_id: item.concentration_id,
            is_convertable_to_mbkm: item.is_convertable_to_mbkm,
            feeder_id: item.feeder_id,
            is_convertable_to_prior_learning_recognition: item.is_convertable_to_prior_learning_recognition,

    }))
}#[endpoint(tags("Academic - Course - Master - CurriculumDetail"), status_codes(200, 400, 500))]
pub async fn create_curriculum_detail(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CurriculumDetailResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateCurriculumDetailRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        curriculum_id: Set(payload.curriculum_id),
        semester_id: Set(payload.semester_id),
        course_id: Set(payload.course_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        credit: Set(payload.credit),
        name: Set(payload.name),
        concentration_id: Set(payload.concentration_id),
        is_convertable_to_mbkm: Set(payload.is_convertable_to_mbkm),
        feeder_id: Set(payload.feeder_id),
        is_convertable_to_prior_learning_recognition: Set(payload.is_convertable_to_prior_learning_recognition),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CurriculumDetailResponse {
            id: item.id,
            code: item.code,
            curriculum_id: item.curriculum_id,
            semester_id: item.semester_id,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            credit: item.credit,
            name: item.name,
            concentration_id: item.concentration_id,
            is_convertable_to_mbkm: item.is_convertable_to_mbkm,
            feeder_id: item.feeder_id,
            is_convertable_to_prior_learning_recognition: item.is_convertable_to_prior_learning_recognition,

        }))
}

#[endpoint(tags("Academic - Course - Master - CurriculumDetail"), status_codes(200, 400, 404, 500))]
pub async fn update_curriculum_detail(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CurriculumDetailResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCurriculumDetailRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("CurriculumDetail not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(curriculum_id) = payload.curriculum_id {
            active_model.curriculum_id = Set(curriculum_id);
        }
    if let Some(semester_id) = payload.semester_id {
            active_model.semester_id = Set(semester_id);
        }
    if let Some(course_id) = payload.course_id {
            active_model.course_id = Set(course_id);
        }
    if let Some(credit) = payload.credit {
            active_model.credit = Set(Some(credit));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(concentration_id) = payload.concentration_id {
            active_model.concentration_id = Set(Some(concentration_id));
        }
    if let Some(is_convertable_to_mbkm) = payload.is_convertable_to_mbkm {
            active_model.is_convertable_to_mbkm = Set(Some(is_convertable_to_mbkm));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(is_convertable_to_prior_learning_recognition) = payload.is_convertable_to_prior_learning_recognition {
            active_model.is_convertable_to_prior_learning_recognition = Set(Some(is_convertable_to_prior_learning_recognition));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CurriculumDetailResponse {
            id: item.id,
            code: item.code,
            curriculum_id: item.curriculum_id,
            semester_id: item.semester_id,
            course_id: item.course_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            credit: item.credit,
            name: item.name,
            concentration_id: item.concentration_id,
            is_convertable_to_mbkm: item.is_convertable_to_mbkm,
            feeder_id: item.feeder_id,
            is_convertable_to_prior_learning_recognition: item.is_convertable_to_prior_learning_recognition,

        }))
}
#[endpoint(tags("Academic - Course - Master - CurriculumDetail"), status_codes(200, 400, 404, 500))]
pub async fn delete_curriculum_detail(
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
            .ok_or_else(|| StatusError::not_found().brief("CurriculumDetail not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "CurriculumDetail deleted successfully".to_string(),
        }))
}
