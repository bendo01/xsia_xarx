use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::literate::education::{
    CreateEducationRequest, EducationQuery, EducationResponse, PaginatedEducationResponse,
    UpdateEducationRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::literate::educations as education_mod;

#[endpoint(tags("Literate - Education"), status_codes(200, 500))]
pub async fn list_educations(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEducationResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: EducationQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        education_mod::Entity::find().filter(education_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(education_mod::Column::Name.contains(name));
    }
    if let Some(code) = query.code {
        select = select.filter(education_mod::Column::Code.eq(code));
    }
    if let Some(level_id) = query.level_id {
        select = select.filter(education_mod::Column::LevelId.eq(level_id));
    }
    if let Some(group_id) = query.group_id {
        select = select.filter(education_mod::Column::GroupId.eq(group_id));
    }
    if let Some(category_id) = query.category_id {
        select = select.filter(education_mod::Column::CategoryId.eq(category_id));
    }
    if let Some(variety_id) = query.variety_id {
        select = select.filter(education_mod::Column::VarietyId.eq(variety_id));
    }

    let paginator = select
        .order_by_asc(education_mod::Column::Code)
        .paginate(db, page_size);

    let total = paginator
        .num_items()
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator
        .fetch_page(page.saturating_sub(1))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(education_to_response).collect();

    Ok(Json(PaginatedEducationResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Literate - Education"), status_codes(200, 400, 404, 500))]
pub async fn get_education(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EducationResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = education_mod::Entity::find_by_id(id)
        .filter(education_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Education not found"))?;

    Ok(Json(education_to_response(item)))
}

#[endpoint(tags("Literate - Education"), status_codes(200, 400, 500))]
pub async fn create_education(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EducationResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateEducationRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = education_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        alphabet_code: Set(payload.alphabet_code),
        abbreviation: Set(payload.abbreviation),
        name: Set(payload.name),
        level_id: Set(payload.level_id),
        group_id: Set(payload.group_id),
        category_id: Set(payload.category_id),
        variety_id: Set(payload.variety_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(education_to_response(item)))
}

#[endpoint(tags("Literate - Education"), status_codes(200, 400, 404, 500))]
pub async fn update_education(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EducationResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateEducationRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = education_mod::Entity::find_by_id(id)
        .filter(education_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Education not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
        active_model.code = Set(code);
    }
    if let Some(alphabet_code) = payload.alphabet_code {
        active_model.alphabet_code = Set(alphabet_code);
    }
    if let Some(abbreviation) = payload.abbreviation {
        active_model.abbreviation = Set(abbreviation);
    }
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(level_id) = payload.level_id {
        active_model.level_id = Set(level_id);
    }
    if let Some(group_id) = payload.group_id {
        active_model.group_id = Set(group_id);
    }
    if let Some(category_id) = payload.category_id {
        active_model.category_id = Set(category_id);
    }
    if let Some(variety_id) = payload.variety_id {
        active_model.variety_id = Set(variety_id);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(education_to_response(item)))
}

#[endpoint(tags("Literate - Education"), status_codes(200, 400, 404, 500))]
pub async fn delete_education(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = education_mod::Entity::find_by_id(id)
        .filter(education_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Education not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Education deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn education_to_response(item: education_mod::Model) -> EducationResponse {
    EducationResponse {
        id: item.id,
        code: item.code,
        alphabet_code: item.alphabet_code,
        abbreviation: item.abbreviation,
        name: item.name,
        level_id: item.level_id,
        group_id: item.group_id,
        category_id: item.category_id,
        variety_id: item.variety_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }
}
