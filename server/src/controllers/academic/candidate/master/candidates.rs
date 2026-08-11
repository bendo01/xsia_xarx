use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::candidate::master::candidates::{
    CreateCandidatRequest, CandidatQuery, CandidatResponse, PaginatedCandidatResponse,
    UpdateCandidatRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::candidate::master::candidates as entity_mod;

#[endpoint(tags("Academic - Candidate - Master - Candidat"), status_codes(200, 500))]
pub async fn list_candidates(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCandidatResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CandidatQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| CandidatResponse {
            id: item.id,
            thread: item.thread,
            code: item.code,
            name: item.name.clone(),
            student_national_number: item.student_national_number,
            school_name: item.school_name,
            school_regency_id: item.school_regency_id,
            state_smart_card_number: item.state_smart_card_number,
            individual_id: item.individual_id,
            academic_year_id: item.academic_year_id,
            student_id: item.student_id,
            user_id: item.user_id,
            registration_type_id: item.registration_type_id,
            institution_id: item.institution_id,
            guidence_name: item.guidence_name,
            guidence_phone_number: item.guidence_phone_number,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedCandidatResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Candidate - Master - Candidat"), status_codes(200, 400, 404, 500))]
pub async fn get_candidate(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CandidatResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Candidat not found"))?;

    Ok(Json(CandidatResponse {
            id: item.id,
            thread: item.thread,
            code: item.code,
            name: item.name.clone(),
            student_national_number: item.student_national_number,
            school_name: item.school_name,
            school_regency_id: item.school_regency_id,
            state_smart_card_number: item.state_smart_card_number,
            individual_id: item.individual_id,
            academic_year_id: item.academic_year_id,
            student_id: item.student_id,
            user_id: item.user_id,
            registration_type_id: item.registration_type_id,
            institution_id: item.institution_id,
            guidence_name: item.guidence_name,
            guidence_phone_number: item.guidence_phone_number,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Candidate - Master - Candidat"), status_codes(200, 400, 500))]
pub async fn create_candidate(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CandidatResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateCandidatRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        thread: Set(payload.thread),
        code: Set(payload.code),
        name: Set(payload.name),
        student_national_number: Set(payload.student_national_number),
        school_name: Set(payload.school_name),
        school_regency_id: Set(payload.school_regency_id),
        state_smart_card_number: Set(payload.state_smart_card_number),
        individual_id: Set(payload.individual_id),
        academic_year_id: Set(payload.academic_year_id),
        student_id: Set(payload.student_id),
        user_id: Set(payload.user_id),
        registration_type_id: Set(payload.registration_type_id),
        institution_id: Set(payload.institution_id),
        guidence_name: Set(payload.guidence_name),
        guidence_phone_number: Set(payload.guidence_phone_number),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CandidatResponse {
            id: item.id,
            thread: item.thread,
            code: item.code,
            name: item.name.clone(),
            student_national_number: item.student_national_number,
            school_name: item.school_name,
            school_regency_id: item.school_regency_id,
            state_smart_card_number: item.state_smart_card_number,
            individual_id: item.individual_id,
            academic_year_id: item.academic_year_id,
            student_id: item.student_id,
            user_id: item.user_id,
            registration_type_id: item.registration_type_id,
            institution_id: item.institution_id,
            guidence_name: item.guidence_name,
            guidence_phone_number: item.guidence_phone_number,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Candidate - Master - Candidat"), status_codes(200, 400, 404, 500))]
pub async fn update_candidate(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CandidatResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateCandidatRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Candidat not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(thread) = payload.thread {
        active_model.thread = Set(Some(thread));
    }
    if let Some(code) = payload.code {
        active_model.code = Set(Some(code));
    }
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(student_national_number) = payload.student_national_number {
        active_model.student_national_number = Set(Some(student_national_number));
    }
    if let Some(school_name) = payload.school_name {
        active_model.school_name = Set(Some(school_name));
    }
    if let Some(school_regency_id) = payload.school_regency_id {
        active_model.school_regency_id = Set(Some(school_regency_id));
    }
    if let Some(state_smart_card_number) = payload.state_smart_card_number {
        active_model.state_smart_card_number = Set(Some(state_smart_card_number));
    }
    if let Some(individual_id) = payload.individual_id {
        active_model.individual_id = Set(Some(individual_id));
    }
    if let Some(academic_year_id) = payload.academic_year_id {
        active_model.academic_year_id = Set(Some(academic_year_id));
    }
    if let Some(student_id) = payload.student_id {
        active_model.student_id = Set(Some(student_id));
    }
    if let Some(user_id) = payload.user_id {
        active_model.user_id = Set(user_id);
    }
    if let Some(registration_type_id) = payload.registration_type_id {
        active_model.registration_type_id = Set(registration_type_id);
    }
    if let Some(institution_id) = payload.institution_id {
        active_model.institution_id = Set(institution_id);
    }
    if let Some(guidence_name) = payload.guidence_name {
        active_model.guidence_name = Set(Some(guidence_name));
    }
    if let Some(guidence_phone_number) = payload.guidence_phone_number {
        active_model.guidence_phone_number = Set(Some(guidence_phone_number));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(CandidatResponse {
            id: item.id,
            thread: item.thread,
            code: item.code,
            name: item.name.clone(),
            student_national_number: item.student_national_number,
            school_name: item.school_name,
            school_regency_id: item.school_regency_id,
            state_smart_card_number: item.state_smart_card_number,
            individual_id: item.individual_id,
            academic_year_id: item.academic_year_id,
            student_id: item.student_id,
            user_id: item.user_id,
            registration_type_id: item.registration_type_id,
            institution_id: item.institution_id,
            guidence_name: item.guidence_name,
            guidence_phone_number: item.guidence_phone_number,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Candidate - Master - Candidat"), status_codes(200, 400, 404, 500))]
pub async fn delete_candidate(
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
        .ok_or_else(|| StatusError::not_found().brief("Candidat not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Candidat deleted successfully".to_string(),
    }))
}
