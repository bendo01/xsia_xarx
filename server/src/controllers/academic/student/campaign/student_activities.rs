use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::campaign::student_activities::{
    CreateStudentActivityRequest, StudentActivityQuery, StudentActivityResponse, PaginatedStudentActivityResponse,
    UpdateStudentActivityRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::campaign::student_activities as entity_mod;

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 500))]
pub async fn list_student_activities(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStudentActivityResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: StudentActivityQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }
    if let Some(student_id) = query.student_id {
        select = select.filter(entity_mod::Column::StudentId.eq(student_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,

    }).collect();

    Ok(Json(PaginatedStudentActivityResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn get_student_activitie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

    Ok(Json(StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,

    }))
}#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 500))]
pub async fn create_student_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateStudentActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        cumulative_index: Set(payload.cumulative_index),
        grand_cumulative_index: Set(payload.grand_cumulative_index),
        total_credit: Set(payload.total_credit),
        grand_total_credit: Set(payload.grand_total_credit),
        student_id: Set(payload.student_id),
        unit_activity_id: Set(payload.unit_activity_id),
        status_id: Set(payload.status_id),
        resign_status_id: Set(payload.resign_status_id),
        unit_id: Set(payload.unit_id),
        is_lock: Set(payload.is_lock),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
        feeder_id: Set(payload.feeder_id),
        finance_id: Set(payload.finance_id),
        finance_fee: Set(payload.finance_fee),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,

        }))
}

#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn update_student_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentActivityResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateStudentActivityRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(cumulative_index) = payload.cumulative_index {
            active_model.cumulative_index = Set(cumulative_index);
        }
    if let Some(grand_cumulative_index) = payload.grand_cumulative_index {
            active_model.grand_cumulative_index = Set(grand_cumulative_index);
        }
    if let Some(total_credit) = payload.total_credit {
            active_model.total_credit = Set(Some(total_credit));
        }
    if let Some(grand_total_credit) = payload.grand_total_credit {
            active_model.grand_total_credit = Set(Some(grand_total_credit));
        }
    if let Some(student_id) = payload.student_id {
            active_model.student_id = Set(student_id);
        }
    if let Some(unit_activity_id) = payload.unit_activity_id {
            active_model.unit_activity_id = Set(unit_activity_id);
        }
    if let Some(status_id) = payload.status_id {
            active_model.status_id = Set(status_id);
        }
    if let Some(resign_status_id) = payload.resign_status_id {
            active_model.resign_status_id = Set(Some(resign_status_id));
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(Some(unit_id));
        }
    if let Some(is_lock) = payload.is_lock {
            active_model.is_lock = Set(Some(is_lock));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(finance_id) = payload.finance_id {
            active_model.finance_id = Set(Some(finance_id));
        }
    if let Some(finance_fee) = payload.finance_fee {
            active_model.finance_fee = Set(Some(finance_fee));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(StudentActivityResponse {
            id: item.id,
            name: item.name,
            cumulative_index: item.cumulative_index,
            grand_cumulative_index: item.grand_cumulative_index,
            total_credit: item.total_credit,
            grand_total_credit: item.grand_total_credit,
            student_id: item.student_id,
            unit_activity_id: item.unit_activity_id,
            status_id: item.status_id,
            resign_status_id: item.resign_status_id,
            unit_id: item.unit_id,
            is_lock: item.is_lock,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            feeder_id: item.feeder_id,
            finance_id: item.finance_id,
            finance_fee: item.finance_fee,

        }))
}
#[endpoint(tags("Academic - Student - Campaign - StudentActivity"), status_codes(200, 400, 404, 500))]
pub async fn delete_student_activitie(
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
            .ok_or_else(|| StatusError::not_found().brief("StudentActivity not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "StudentActivity deleted successfully".to_string(),
        }))
}
