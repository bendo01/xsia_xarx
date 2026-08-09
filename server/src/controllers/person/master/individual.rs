use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::person::master::individual::{
    CreateIndividualRequest, IndividualQuery, IndividualResponse, MessageResponse,
    PaginatedIndividualResponse, UpdateIndividualRequest,
};
use crate::models::person::master::individual as individual_mod;

#[endpoint(tags("Person Master - Individual"), status_codes(200, 500))]
pub async fn list_individuals(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedIndividualResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: IndividualQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        individual_mod::Entity::find().filter(individual_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(individual_mod::Column::Name.contains(name));
    }
    if let Some(ref code) = query.code {
        select = select.filter(individual_mod::Column::Code.contains(code));
    }
    if let Some(is_deceased) = query.is_deceased {
        select = select.filter(individual_mod::Column::IsDeceased.eq(is_deceased));
    }

    let paginator = select
        .order_by_asc(individual_mod::Column::Name)
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

    let data = items.into_iter().map(individual_to_response).collect();

    Ok(Json(PaginatedIndividualResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Person Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn get_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = individual_mod::Entity::find_by_id(id)
        .filter(individual_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

    Ok(Json(individual_to_response(item)))
}

#[endpoint(tags("Person Master - Individual"), status_codes(200, 400, 500))]
pub async fn create_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateIndividualRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = individual_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        front_title: Set(payload.front_title),
        last_title: Set(payload.last_title),
        birth_date: Set(payload.birth_date),
        birth_place: Set(payload.birth_place),
        gender_id: Set(payload.gender_id),
        religion_id: Set(payload.religion_id),
        occupation_id: Set(payload.occupation_id),
        education_id: Set(payload.education_id),
        income_id: Set(payload.income_id),
        identification_type_id: Set(payload.identification_type_id),
        marital_status_id: Set(payload.marital_status_id),
        profession_id: Set(payload.profession_id),
        age_classification_id: Set(payload.age_classification_id),
        is_special_need: Set(payload.is_special_need),
        is_social_protection_card_recipient: Set(payload.is_social_protection_card_recipient),
        is_deceased: Set(payload.is_deceased),
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

    Ok(Json(individual_to_response(item)))
}

#[endpoint(tags("Person Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn update_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateIndividualRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = individual_mod::Entity::find_by_id(id)
        .filter(individual_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
        active_model.code = Set(code);
    }
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(v) = payload.front_title {
        active_model.front_title = Set(Some(v));
    }
    if let Some(v) = payload.last_title {
        active_model.last_title = Set(Some(v));
    }
    if let Some(v) = payload.birth_date {
        active_model.birth_date = Set(v);
    }
    if let Some(v) = payload.birth_place {
        active_model.birth_place = Set(v);
    }
    if let Some(v) = payload.gender_id {
        active_model.gender_id = Set(v);
    }
    if let Some(v) = payload.religion_id {
        active_model.religion_id = Set(v);
    }
    if let Some(v) = payload.occupation_id {
        active_model.occupation_id = Set(v);
    }
    if let Some(v) = payload.education_id {
        active_model.education_id = Set(v);
    }
    if let Some(v) = payload.income_id {
        active_model.income_id = Set(v);
    }
    if let Some(v) = payload.identification_type_id {
        active_model.identification_type_id = Set(v);
    }
    if let Some(v) = payload.marital_status_id {
        active_model.marital_status_id = Set(v);
    }
    if let Some(v) = payload.profession_id {
        active_model.profession_id = Set(v);
    }
    if let Some(v) = payload.age_classification_id {
        active_model.age_classification_id = Set(v);
    }
    if let Some(v) = payload.is_special_need {
        active_model.is_special_need = Set(v);
    }
    if let Some(v) = payload.is_social_protection_card_recipient {
        active_model.is_social_protection_card_recipient = Set(v);
    }
    if let Some(v) = payload.is_deceased {
        active_model.is_deceased = Set(v);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(individual_to_response(item)))
}

#[endpoint(tags("Person Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn delete_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = individual_mod::Entity::find_by_id(id)
        .filter(individual_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    // individual.deleted_at is DateTimeWithTimeZone
    active_model.deleted_at = Set(Some(Utc::now().fixed_offset()));
    active_model.updated_at = Set(Some(now));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Individual deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn individual_to_response(item: individual_mod::Model) -> IndividualResponse {
    IndividualResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        front_title: item.front_title,
        last_title: item.last_title,
        birth_date: item.birth_date,
        birth_place: item.birth_place,
        gender_id: item.gender_id,
        religion_id: item.religion_id,
        occupation_id: item.occupation_id,
        education_id: item.education_id,
        income_id: item.income_id,
        identification_type_id: item.identification_type_id,
        marital_status_id: item.marital_status_id,
        profession_id: item.profession_id,
        age_classification_id: item.age_classification_id,
        is_special_need: item.is_special_need,
        is_social_protection_card_recipient: item.is_social_protection_card_recipient,
        is_deceased: item.is_deceased,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at.map(|dt| dt.naive_utc()),
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }
}
