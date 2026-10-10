use std::collections::HashSet;

use chrono::Utc;
use salvo::prelude::*;
use sea_orm::sea_query::Expr;
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, IntoActiveModel, ModelTrait,
    PaginatorTrait, QueryFilter, QueryOrder, Set, QuerySelect, TransactionTrait,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::institution::master::employees::{
    CreateEmployeeRequest, EmployeeQuery, EmployeeResponse, PaginatedEmployeeResponse,
    UpdateEmployeeRequest, EmployeeOptionRequest, EmployeeIndividualLookupItem,
    EmployeeIndividualLookupRequest, RegisterEmployeeRequest,
};
use crate::controllers::auth::user::{generate_random_token, hash_password};
use crate::models::auth::user;
use crate::models::contact::master::{electronic_mails, phones, residences};
use crate::models::person::master::individual;
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::institution::master::employees as entity_mod;
use crate::middleware::auth::auth_user_id;

// Morph type shared by individual-owned phones, emails and residences
const INDIVIDUAL_MORPHABLE_TYPE: &str = "App\\Models\\Person\\Master\\Individual";

fn internal(e: impl ToString) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

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
pub async fn index(
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
pub async fn show(
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
pub async fn store(
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
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
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
pub async fn update(
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
    active_model.updated_by = Set(auth_user_id(depot));

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
pub async fn delete(
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
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Employee deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: EmployeeOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            select = select.filter(entity_mod::Column::Name.contains(search_trimmed));
        }
    }

    if let Some(institution_id) = payload.institution_id {
        select = select.filter(entity_mod::Column::InstitutionId.eq(institution_id));
    }

    let items = select
        .order_by_asc(entity_mod::Column::Name)
        .limit(100)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: item.name,
        })
        .collect();

    Ok(Json(data))
}

/// Search individuals that can be registered as employees, with their linked user account
#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 500))]
pub async fn individual_lookup(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<EmployeeIndividualLookupItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: EmployeeIndividualLookupRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let search = payload.search.as_deref().map(str::trim).unwrap_or_default();
    if search.len() < 3 {
        return Ok(Json(Vec::new()));
    }
    let pattern = format!("%{}%", search);

    // Individuals whose user account email matches the search
    let email_matches: Vec<Uuid> = user::Entity::find()
        .select_only()
        .column(user::Column::IndividualId)
        .filter(Expr::col(user::Column::Email).ilike(pattern.clone()))
        .filter(user::Column::DeletedAt.is_null())
        .limit(20)
        .into_tuple()
        .all(db)
        .await
        .map_err(internal)?;

    let individuals = individual::Entity::find()
        .filter(individual::Column::DeletedAt.is_null())
        .filter(
            Condition::any()
                .add(Expr::col(individual::Column::Name).ilike(pattern.clone()))
                .add(Expr::col(individual::Column::Code).ilike(pattern))
                .add(individual::Column::Id.is_in(email_matches)),
        )
        .order_by_asc(individual::Column::Name)
        .limit(20)
        .all(db)
        .await
        .map_err(internal)?;

    let ids: Vec<Uuid> = individuals.iter().map(|i| i.id).collect();

    let users = user::Entity::find()
        .filter(user::Column::IndividualId.is_in(ids.clone()))
        .filter(user::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?;

    let employee_individual_ids: HashSet<Uuid> = match payload.institution_id {
        Some(institution_id) => entity_mod::Entity::find()
            .select_only()
            .column(entity_mod::Column::IndividualId)
            .filter(entity_mod::Column::IndividualId.is_in(ids))
            .filter(entity_mod::Column::InstitutionId.eq(institution_id))
            .filter(entity_mod::Column::DeletedAt.is_null())
            .into_tuple::<Uuid>()
            .all(db)
            .await
            .map_err(internal)?
            .into_iter()
            .collect(),
        None => HashSet::new(),
    };

    let data = individuals
        .into_iter()
        .map(|ind| {
            let account = users.iter().find(|u| u.individual_id == ind.id);
            EmployeeIndividualLookupItem {
                id: ind.id,
                code: ind.code,
                name: ind.name,
                front_title: ind.front_title,
                last_title: ind.last_title,
                birth_place: ind.birth_place,
                birth_date: ind.birth_date,
                user_id: account.map(|u| u.id),
                user_email: account.map(|u| u.email.clone()),
                is_employee: employee_individual_ids.contains(&ind.id),
            }
        })
        .collect();

    Ok(Json(data))
}

/// Register an employee either from an existing individual, or by creating the individual,
/// user account, phone, email and residence in one transaction
#[endpoint(tags("Institution - Master - Employee"), status_codes(200, 400, 404, 500))]
pub async fn register(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<EmployeeResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: RegisterEmployeeRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;
    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let actor = auth_user_id(depot);
    let code = payload.code.trim().to_string();

    crate::models::institution::master::institutions::Entity::find_by_id(payload.institution_id)
        .filter(crate::models::institution::master::institutions::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Institusi tidak ditemukan"))?;

    let code_taken = entity_mod::Entity::find()
        .filter(entity_mod::Column::Code.eq(&code))
        .filter(entity_mod::Column::InstitutionId.eq(payload.institution_id))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?;
    if code_taken.is_some() {
        return Err(StatusError::bad_request().brief("Kode pegawai sudah digunakan di institusi ini"));
    }

    let now = Utc::now().naive_utc();
    let txn = db.begin().await.map_err(internal)?;

    let (individual_id, employee_name) = match (payload.individual_id, payload.new_individual) {
        (Some(individual_id), None) => {
            let ind = individual::Entity::find_by_id(individual_id)
                .filter(individual::Column::DeletedAt.is_null())
                .one(&txn)
                .await
                .map_err(internal)?
                .ok_or_else(|| StatusError::not_found().brief("Data individu tidak ditemukan"))?;
            (ind.id, ind.name)
        }
        (None, Some(new)) => {
            let nik = new.code.trim().to_string();
            let email = new.email.trim().to_lowercase();
            let name = new.name.trim().to_string();

            let nik_taken = individual::Entity::find()
                .filter(individual::Column::Code.eq(&nik))
                .filter(individual::Column::DeletedAt.is_null())
                .one(&txn)
                .await
                .map_err(internal)?;
            if nik_taken.is_some() {
                return Err(StatusError::bad_request().brief("NIK sudah terdaftar, gunakan opsi individu yang sudah ada"));
            }

            let email_taken = user::Entity::find()
                .filter(user::Column::Email.eq(&email))
                .filter(user::Column::DeletedAt.is_null())
                .one(&txn)
                .await
                .map_err(internal)?;
            if email_taken.is_some() {
                return Err(StatusError::bad_request().brief("Email sudah digunakan oleh akun lain"));
            }

            let individual_id = Uuid::now_v7();
            individual::ActiveModel {
                id: Set(individual_id),
                code: Set(nik),
                name: Set(name.clone()),
                front_title: Set(new.front_title.filter(|s| !s.trim().is_empty())),
                last_title: Set(new.last_title.filter(|s| !s.trim().is_empty())),
                birth_date: Set(new.birth_date),
                birth_place: Set(new.birth_place.trim().to_string()),
                gender_id: Set(new.gender_id),
                religion_id: Set(new.religion_id),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                created_by: Set(actor),
                updated_by: Set(actor),
                ..Default::default()
            }
            .insert(&txn)
            .await
            .map_err(internal)?;

            user::ActiveModel {
                id: Set(Uuid::now_v7()),
                pid: Set(Uuid::new_v4()),
                email: Set(email.clone()),
                password: Set(hash_password(&new.password)?),
                api_key: Set(generate_random_token(32)),
                name: Set(name.clone()),
                individual_id: Set(individual_id),
                is_active: Set(true),
                current_role_id: Set(None),
                reset_token: Set(None),
                reset_sent_at: Set(None),
                email_verification_token: Set(None),
                email_verification_sent_at: Set(None),
                email_verified_at: Set(Some(now)),
                magic_link_token: Set(None),
                magic_link_expiration: Set(None),
                created_at: Set(now),
                updated_at: Set(now),
                deleted_at: Set(None),
                created_by: Set(actor),
                updated_by: Set(actor),
            }
            .insert(&txn)
            .await
            .map_err(internal)?;

            phones::ActiveModel {
                id: Set(Uuid::now_v7()),
                phone_number: Set(new.phone_number.trim().to_string()),
                phone_type_id: Set(None),
                phoneable_id: Set(individual_id),
                phoneable_type: Set(INDIVIDUAL_MORPHABLE_TYPE.to_string()),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(actor),
                updated_by: Set(actor),
            }
            .insert(&txn)
            .await
            .map_err(internal)?;

            electronic_mails::ActiveModel {
                id: Set(Uuid::now_v7()),
                email_address: Set(email),
                electronic_mail_type_id: Set(None),
                electronic_mailable_id: Set(individual_id),
                electronic_mailable_type: Set(INDIVIDUAL_MORPHABLE_TYPE.to_string()),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(actor),
                updated_by: Set(actor),
            }
            .insert(&txn)
            .await
            .map_err(internal)?;

            residences::ActiveModel {
                id: Set(Uuid::now_v7()),
                street: Set(new.street.trim().to_string()),
                citizens_association: Set(new.citizens_association),
                neighborhood_association: Set(new.neighborhood_association),
                province_id: Set(new.province_id),
                regency_id: Set(new.regency_id),
                sub_district_id: Set(new.sub_district_id),
                village_id: Set(new.village_id),
                residence_type_id: Set(None),
                residenceable_type: Set(Some(INDIVIDUAL_MORPHABLE_TYPE.to_string())),
                residenceable_id: Set(Some(individual_id)),
                latitude: Set(None),
                longitude: Set(None),
                zoom: Set(None),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(actor),
                updated_by: Set(actor),
            }
            .insert(&txn)
            .await
            .map_err(internal)?;

            (individual_id, name)
        }
        _ => {
            return Err(StatusError::bad_request().brief("Pilih individu yang sudah ada atau isi data individu baru"));
        }
    };

    let already_employee = entity_mod::Entity::find()
        .filter(entity_mod::Column::IndividualId.eq(individual_id))
        .filter(entity_mod::Column::InstitutionId.eq(payload.institution_id))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(&txn)
        .await
        .map_err(internal)?;
    if already_employee.is_some() {
        return Err(StatusError::bad_request().brief("Individu ini sudah terdaftar sebagai pegawai di institusi ini"));
    }

    let item = entity_mod::ActiveModel {
        id: Set(Uuid::now_v7()),
        code: Set(code),
        name: Set(employee_name),
        institution_id: Set(payload.institution_id),
        individual_id: Set(individual_id),
        decree_number: Set(payload.decree_number.filter(|s| !s.trim().is_empty())),
        decree_date: Set(payload.decree_date),
        is_active: Set(payload.is_active),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(actor),
        updated_by: Set(actor),
    }
    .insert(&txn)
    .await
    .map_err(internal)?;

    txn.commit().await.map_err(internal)?;

    let response = load_employee_with_relations(&item, db).await?;
    Ok(Json(response))
}
