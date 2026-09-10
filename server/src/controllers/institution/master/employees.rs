use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, ModelTrait,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::institution::master::employees::{
    CreateEmployeeRequest, EmployeeQuery, EmployeeResponse, PaginatedEmployeeResponse,
    UpdateEmployeeRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::institution::master::employees as entity_mod;

pub async fn load_employee_with_relations(
    item: &entity_mod::Model,
    db: &DatabaseConnection,
) -> Result<EmployeeResponse, StatusError> {
    // 1. Belongs to: individual
    let individual = item
        .find_related(crate::models::person::master::individual::Entity)
        .filter(crate::models::person::master::individual::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| Box::new(crate::dtos::person::master::individual::IndividualResponse {
            id: m.id,
            code: m.code,
            name: m.name,
            front_title: m.front_title,
            last_title: m.last_title,
            birth_date: m.birth_date,
            birth_place: m.birth_place,
            gender_id: m.gender_id,
            religion_id: m.religion_id,
            occupation_id: m.occupation_id,
            education_id: m.education_id,
            income_id: m.income_id,
            identification_type_id: m.identification_type_id,
            marital_status_id: m.marital_status_id,
            profession_id: m.profession_id,
            age_classification_id: m.age_classification_id,
            is_special_need: m.is_special_need,
            is_social_protection_card_recipient: m.is_social_protection_card_recipient,
            is_deceased: m.is_deceased,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        }));

    // 2. Belongs to: institution
    let institution = item
        .find_related(crate::models::institution::master::institutions::Entity)
        .filter(crate::models::institution::master::institutions::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::institution::master::institutions::InstitutionResponse {
            id: m.id,
            code: m.code,
            name: m.name,
            alphabet_code: m.alphabet_code,
            is_active: m.is_active,
            variety_id: m.variety_id,
            category_id: m.category_id,
            country_id: m.country_id,
            parent_id: m.parent_id,
            feeder_id: m.feeder_id,
            academic_year_id: m.academic_year_id,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    // 3. Has many: staffes
    // Check both employee.id and employee.individual_id to gracefully handle records where individual_id was used
    let raw_staffes = crate::models::institution::master::staffes::Entity::find()
        .filter(crate::models::institution::master::staffes::Column::EmployeeId.is_in(vec![item.id, item.individual_id]))
        .filter(crate::models::institution::master::staffes::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let staffes: Vec<crate::dtos::institution::master::staffes::StaffResponse> = raw_staffes
        .into_iter()
        .map(|s| crate::dtos::institution::master::staffes::StaffResponse {
            id: s.id,
            code: s.code,
            name: s.name,
            decree_number: s.decree_number,
            decree_date: s.decree_date,
            start_date: s.start_date,
            end_date: s.end_date,
            employee_id: s.employee_id,
            unit_id: s.unit_id,
            position_type_id: s.position_type_id,
            created_at: s.created_at,
            updated_at: s.updated_at,
            deleted_at: s.deleted_at,
            sync_at: s.sync_at,
            created_by: s.created_by,
            updated_by: s.updated_by,
        })
        .collect();

    Ok(EmployeeResponse {
        id: item.id,
        code: item.code.clone(),
        name: item.name.clone(),
        institution_id: item.institution_id,
        individual_id: item.individual_id,
        decree_number: item.decree_number.clone(),
        decree_date: item.decree_date,
        is_active: item.is_active,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        individual,
        institution,
        staffes: Some(staffes),
    })
}

#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 500))]
pub async fn list_employees(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedEmployeeResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: EmployeeQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    if let Some(individual_id) = query.individual_id {
        select = select.filter(entity_mod::Column::IndividualId.eq(individual_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data: Vec<EmployeeResponse> = if query.with_relations.unwrap_or(false) {
        let mut full_items = Vec::new();
        for item in &items {
            full_items.push(load_employee_with_relations(item, db).await?);
        }
        full_items
    } else {
        items.into_iter().map(|item| EmployeeResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            individual_id: item.individual_id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }).collect()
    };

    Ok(Json(PaginatedEmployeeResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 400, 404, 500))]
pub async fn get_employee(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EmployeeResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let mut item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    if item.is_none() {
        item = entity_mod::Entity::find()
            .filter(entity_mod::Column::IndividualId.eq(id))
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    }

    let item = item.ok_or_else(|| StatusError::not_found().brief("Employee not found"))?;

    let response = load_employee_with_relations(&item, db).await?;
    Ok(Json(response))
}

#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 400, 500))]
pub async fn create_employee(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EmployeeResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateEmployeeRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        institution_id: Set(payload.institution_id),
        individual_id: Set(payload.individual_id),
        decree_number: Set(payload.decree_number),
        decree_date: Set(payload.decree_date),
        is_active: Set(payload.is_active),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EmployeeResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            individual_id: item.individual_id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }))
}

#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 400, 404, 500))]
pub async fn update_employee(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<EmployeeResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateEmployeeRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Employee not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(institution_id) = payload.institution_id {
            active_model.institution_id = Set(institution_id);
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(decree_number) = payload.decree_number {
            active_model.decree_number = Set(Some(decree_number));
        }
    if let Some(decree_date) = payload.decree_date {
            active_model.decree_date = Set(Some(decree_date));
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(EmployeeResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            institution_id: item.institution_id,
            individual_id: item.individual_id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            is_active: item.is_active,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }))
}
#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 400, 404, 500))]
pub async fn delete_employee(
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
            .ok_or_else(|| StatusError::not_found().brief("Employee not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Employee deleted successfully".to_string(),
        }))
}
