use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::campaign::transaction::activities::{
    CreateActivitiRequest, ActivitiQuery, ActivitiResponse, PaginatedActivitiResponse,
    UpdateActivitiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::campaign::transaction::activities as entity_mod;

#[endpoint(tags("Academic - Campaign - Transaction - Activiti"), status_codes(200, 500))]
pub async fn list_activities(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedActivitiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ActivitiQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| ActivitiResponse {
            id: item.id,
            name: item.name.clone(),
            week_quantity: item.week_quantity,
            student_target: item.student_target,
            candidate_number: item.candidate_number,
            candidate_pass: item.candidate_pass,
            became_student: item.became_student,
            transfer_student: item.transfer_student,
            total_class_member: item.total_class_member,
            start_date: item.start_date,
            end_date: item.end_date,
            start_transaction: item.start_transaction,
            end_transaction: item.end_transaction,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            is_active: item.is_active,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedActivitiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Activiti"), status_codes(200, 400, 404, 500))]
pub async fn get_activitie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ActivitiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Activiti not found"))?;

    Ok(Json(ActivitiResponse {
            id: item.id,
            name: item.name.clone(),
            week_quantity: item.week_quantity,
            student_target: item.student_target,
            candidate_number: item.candidate_number,
            candidate_pass: item.candidate_pass,
            became_student: item.became_student,
            transfer_student: item.transfer_student,
            total_class_member: item.total_class_member,
            start_date: item.start_date,
            end_date: item.end_date,
            start_transaction: item.start_transaction,
            end_transaction: item.end_transaction,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            is_active: item.is_active,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Campaign - Transaction - Activiti"), status_codes(200, 400, 500))]
pub async fn create_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ActivitiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateActivitiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        week_quantity: Set(payload.week_quantity),
        student_target: Set(payload.student_target),
        candidate_number: Set(payload.candidate_number),
        candidate_pass: Set(payload.candidate_pass),
        became_student: Set(payload.became_student),
        transfer_student: Set(payload.transfer_student),
        total_class_member: Set(payload.total_class_member),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        start_transaction: Set(payload.start_transaction),
        end_transaction: Set(payload.end_transaction),
        unit_id: Set(payload.unit_id),
        academic_year_id: Set(payload.academic_year_id),
        is_active: Set(payload.is_active),
        feeder_id: Set(payload.feeder_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ActivitiResponse {
            id: item.id,
            name: item.name.clone(),
            week_quantity: item.week_quantity,
            student_target: item.student_target,
            candidate_number: item.candidate_number,
            candidate_pass: item.candidate_pass,
            became_student: item.became_student,
            transfer_student: item.transfer_student,
            total_class_member: item.total_class_member,
            start_date: item.start_date,
            end_date: item.end_date,
            start_transaction: item.start_transaction,
            end_transaction: item.end_transaction,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            is_active: item.is_active,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Campaign - Transaction - Activiti"), status_codes(200, 400, 404, 500))]
pub async fn update_activitie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ActivitiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateActivitiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Activiti not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(week_quantity) = payload.week_quantity {
            active_model.week_quantity = Set(Some(week_quantity));
        }
    if let Some(student_target) = payload.student_target {
            active_model.student_target = Set(student_target);
        }
    if let Some(candidate_number) = payload.candidate_number {
            active_model.candidate_number = Set(candidate_number);
        }
    if let Some(candidate_pass) = payload.candidate_pass {
            active_model.candidate_pass = Set(candidate_pass);
        }
    if let Some(became_student) = payload.became_student {
            active_model.became_student = Set(became_student);
        }
    if let Some(transfer_student) = payload.transfer_student {
            active_model.transfer_student = Set(transfer_student);
        }
    if let Some(total_class_member) = payload.total_class_member {
            active_model.total_class_member = Set(Some(total_class_member));
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    if let Some(start_transaction) = payload.start_transaction {
            active_model.start_transaction = Set(Some(start_transaction));
        }
    if let Some(end_transaction) = payload.end_transaction {
            active_model.end_transaction = Set(Some(end_transaction));
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(unit_id);
        }
    if let Some(academic_year_id) = payload.academic_year_id {
            active_model.academic_year_id = Set(academic_year_id);
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(Some(is_active));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ActivitiResponse {
            id: item.id,
            name: item.name.clone(),
            week_quantity: item.week_quantity,
            student_target: item.student_target,
            candidate_number: item.candidate_number,
            candidate_pass: item.candidate_pass,
            became_student: item.became_student,
            transfer_student: item.transfer_student,
            total_class_member: item.total_class_member,
            start_date: item.start_date,
            end_date: item.end_date,
            start_transaction: item.start_transaction,
            end_transaction: item.end_transaction,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            is_active: item.is_active,
            feeder_id: item.feeder_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Campaign - Transaction - Activiti"), status_codes(200, 400, 404, 500))]
pub async fn delete_activitie(
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
            .ok_or_else(|| StatusError::not_found().brief("Activiti not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Activiti deleted successfully".to_string(),
        }))
}
