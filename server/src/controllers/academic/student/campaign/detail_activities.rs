use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::detail_activities::{
    CreateDetailActivitiRequest, DetailActivitiQuery, DetailActivitiResponse, PaginatedDetailActivitiResponse,
    UpdateDetailActivitiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::campaign::detail_activities as entity_mod;

#[endpoint(tags("Academic - Student - Campaign - DetailActiviti"), status_codes(200, 500))]
pub async fn list_detail_activities(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedDetailActivitiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DetailActivitiQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| DetailActivitiResponse {
            id: item.id,
            mark: item.mark,
            credit: item.credit,
            grade_id: item.grade_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            teach_id: item.teach_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            feeder_grade_id: item.feeder_grade_id,
            curiculum_detail_sequence: item.curiculum_detail_sequence,

    }).collect();

    Ok(Json(PaginatedDetailActivitiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActiviti"), status_codes(200, 400, 404, 500))]
pub async fn get_detail_activitie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DetailActivitiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("DetailActiviti not found"))?;

    Ok(Json(DetailActivitiResponse {
            id: item.id,
            mark: item.mark,
            credit: item.credit,
            grade_id: item.grade_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            teach_id: item.teach_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            feeder_grade_id: item.feeder_grade_id,
            curiculum_detail_sequence: item.curiculum_detail_sequence,

    }))
}#[endpoint(tags("Academic - Student - Campaign - DetailActiviti"), status_codes(200, 400, 500))]
pub async fn create_detail_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DetailActivitiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateDetailActivitiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        mark: Set(payload.mark),
        credit: Set(payload.credit),
        grade_id: Set(payload.grade_id),
        course_id: Set(payload.course_id),
        activity_id: Set(payload.activity_id),
        teach_id: Set(payload.teach_id),
        is_lock: Set(payload.is_lock),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        feeder_id: Set(payload.feeder_id),
        name: Set(payload.name),
        feeder_grade_id: Set(payload.feeder_grade_id),
        curiculum_detail_sequence: Set(payload.curiculum_detail_sequence),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(DetailActivitiResponse {
            id: item.id,
            mark: item.mark,
            credit: item.credit,
            grade_id: item.grade_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            teach_id: item.teach_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            feeder_grade_id: item.feeder_grade_id,
            curiculum_detail_sequence: item.curiculum_detail_sequence,

        }))
}

#[endpoint(tags("Academic - Student - Campaign - DetailActiviti"), status_codes(200, 400, 404, 500))]
pub async fn update_detail_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<DetailActivitiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateDetailActivitiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("DetailActiviti not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(mark) = payload.mark {
            active_model.mark = Set(Some(mark));
        }
    if let Some(credit) = payload.credit {
            active_model.credit = Set(Some(credit));
        }
    if let Some(grade_id) = payload.grade_id {
            active_model.grade_id = Set(Some(grade_id));
        }
    if let Some(course_id) = payload.course_id {
            active_model.course_id = Set(course_id);
        }
    if let Some(activity_id) = payload.activity_id {
            active_model.activity_id = Set(activity_id);
        }
    if let Some(teach_id) = payload.teach_id {
            active_model.teach_id = Set(Some(teach_id));
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
    if let Some(feeder_grade_id) = payload.feeder_grade_id {
            active_model.feeder_grade_id = Set(Some(feeder_grade_id));
        }
    if let Some(curiculum_detail_sequence) = payload.curiculum_detail_sequence {
            active_model.curiculum_detail_sequence = Set(Some(curiculum_detail_sequence));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(DetailActivitiResponse {
            id: item.id,
            mark: item.mark,
            credit: item.credit,
            grade_id: item.grade_id,
            course_id: item.course_id,
            activity_id: item.activity_id,
            teach_id: item.teach_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            name: item.name,
            feeder_grade_id: item.feeder_grade_id,
            curiculum_detail_sequence: item.curiculum_detail_sequence,

        }))
}
#[endpoint(tags("Academic - Student - Campaign - DetailActiviti"), status_codes(200, 400, 404, 500))]
pub async fn delete_detail_activitie(
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
            .ok_or_else(|| StatusError::not_found().brief("DetailActiviti not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "DetailActiviti deleted successfully".to_string(),
        }))
}
