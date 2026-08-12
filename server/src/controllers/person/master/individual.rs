use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::person::master::individual::{
    CreateIndividualRequest, IndividualQuery, IndividualResponse, PaginatedIndividualResponse,
    UpdateIndividualRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::person::master::individual as entity_mod;

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 500))]
pub async fn list_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedIndividualResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: IndividualQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| IndividualResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            front_title: item.front_title,
            last_title: item.last_title,
            birth_date: item.birth_date,
            birth_place: item.birth_place.clone(),
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
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedIndividualResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn get_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

    Ok(Json(IndividualResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            front_title: item.front_title,
            last_title: item.last_title,
            birth_date: item.birth_date,
            birth_place: item.birth_place.clone(),
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
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 500))]
pub async fn create_individual(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateIndividualRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
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

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(IndividualResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            front_title: item.front_title,
            last_title: item.last_title,
            birth_date: item.birth_date,
            birth_place: item.birth_place.clone(),
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
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn update_individual(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateIndividualRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
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
    if let Some(front_title) = payload.front_title {
            active_model.front_title = Set(Some(front_title));
        }
    if let Some(last_title) = payload.last_title {
            active_model.last_title = Set(Some(last_title));
        }
    if let Some(birth_date) = payload.birth_date {
            active_model.birth_date = Set(birth_date);
        }
    if let Some(birth_place) = payload.birth_place {
            active_model.birth_place = Set(birth_place);
        }
    if let Some(gender_id) = payload.gender_id {
            active_model.gender_id = Set(gender_id);
        }
    if let Some(religion_id) = payload.religion_id {
            active_model.religion_id = Set(religion_id);
        }
    if let Some(occupation_id) = payload.occupation_id {
            active_model.occupation_id = Set(occupation_id);
        }
    if let Some(education_id) = payload.education_id {
            active_model.education_id = Set(education_id);
        }
    if let Some(income_id) = payload.income_id {
            active_model.income_id = Set(income_id);
        }
    if let Some(identification_type_id) = payload.identification_type_id {
            active_model.identification_type_id = Set(identification_type_id);
        }
    if let Some(marital_status_id) = payload.marital_status_id {
            active_model.marital_status_id = Set(marital_status_id);
        }
    if let Some(profession_id) = payload.profession_id {
            active_model.profession_id = Set(profession_id);
        }
    if let Some(age_classification_id) = payload.age_classification_id {
            active_model.age_classification_id = Set(age_classification_id);
        }
    if let Some(is_special_need) = payload.is_special_need {
            active_model.is_special_need = Set(is_special_need);
        }
    if let Some(is_social_protection_card_recipient) = payload.is_social_protection_card_recipient {
            active_model.is_social_protection_card_recipient = Set(is_social_protection_card_recipient);
        }
    if let Some(is_deceased) = payload.is_deceased {
            active_model.is_deceased = Set(is_deceased);
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(IndividualResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            front_title: item.front_title,
            last_title: item.last_title,
            birth_date: item.birth_date,
            birth_place: item.birth_place.clone(),
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
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn delete_individual(
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
            .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Individual deleted successfully".to_string(),
        }))
}
