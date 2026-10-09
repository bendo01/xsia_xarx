use chrono::Utc;
use salvo::fs::NamedFile;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, ConnectionTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    QueryFilter, QueryOrder, Set, TransactionTrait,
};
use std::path::PathBuf;
use uuid::Uuid;
use validator::Validate;

use crate::config::jwt::{create_token, JwtConfig};
use crate::controllers::auth::user::{fetch_user_roles, generate_random_token, hash_password};
use crate::dtos::academic::candidate::admission::{
    AdmissionArchiveStatus, AdmissionCandidateSummary, AdmissionFamilyCardRequest, AdmissionFamilyCardStatus,
    AdmissionFamilyMemberRequest, AdmissionFamilyMemberStatus, AdmissionRegisterRequest, AdmissionRegisterResponse,
    AdmissionRequirementStatus, AdmissionStatusResponse, AdmissionUnitOption, AdmissionUnitOptionsResponse,
    AdmissionUnitQuery, AdmissionUnitRequest, AdmissionUnitStatus,
};
use crate::dtos::auth::user::UserResponse;
use crate::middleware::auth::auth_user_id;
use crate::models::academic::candidate::master::{candidate_unit, candidates};
use crate::models::academic::candidate::reference::{registration_categories, registration_types};
use crate::models::auth::{role, user};
use crate::models::document::reference::archive_types;
use crate::models::document::transaction::archives;
use crate::models::institution::master::{institutions, units};
use crate::models::institution::reference::{position_type, unit_types};
use crate::models::person::master::{family_card, family_card_member, individual};
use crate::models::person::reference::relative_type;

const CANDIDATE_ROLEABLE_TYPE: &str = "App\\Models\\Academic\\Candidate\\Master\\Candidate";
const INDIVIDUAL_PHONEABLE_TYPE: &str = "App\\Models\\Person\\Master\\Individual";
const CANDIDATE_POSITION_TYPE: &str = "Kandidat Mahasiswa";
const STUDY_PROGRAM_UNIT_TYPE: &str = "Program Studi Perguruan Tinggi";

/// Archive types a candidate must upload, matched by `archive_types.name`
const REQUIRED_ARCHIVE_TYPES: [&str; 4] = ["Family Card", "Citizen Card", "Self Portrait", "High School Diploma"];

/// `relative_types.code` values used by the admission checklist
const RELATIVE_FATHER: i32 = 1;
const RELATIVE_MOTHER: i32 = 2;
const RELATIVE_GUARDIAN_FATHER: i32 = 10;
const RELATIVE_GUARDIAN_MOTHER: i32 = 11;
const ALLOWED_RELATIVE_CODES: [i32; 4] = [RELATIVE_FATHER, RELATIVE_MOTHER, RELATIVE_GUARDIAN_FATHER, RELATIVE_GUARDIAN_MOTHER];

const MAX_ARCHIVE_SIZE: usize = 5 * 1024 * 1024;
const ALLOWED_ARCHIVE_MIMES: [&str; 3] = ["image/jpeg", "image/png", "application/pdf"];

fn internal(e: impl ToString) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

fn get_db(depot: &Depot) -> Result<DatabaseConnection, StatusError> {
    depot
        .get_typed::<DatabaseConnection>()
        .cloned()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))
}

fn path_uuid(req: &Request, name: &str) -> Result<Uuid, StatusError> {
    let raw = req
        .param::<String>(name)
        .ok_or_else(|| StatusError::bad_request().brief(format!("Missing parameter {}", name)))?;
    Uuid::parse_str(&raw).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

async fn find_institution_by_code<C: ConnectionTrait>(db: &C, code: &str) -> Result<institutions::Model, StatusError> {
    institutions::Entity::find()
        .filter(institutions::Column::Code.eq(code.trim()))
        .filter(institutions::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Institution not found"))
}

async fn study_program_unit_type_ids(db: &DatabaseConnection) -> Result<Vec<Uuid>, StatusError> {
    Ok(unit_types::Entity::find()
        .filter(unit_types::Column::Name.eq(STUDY_PROGRAM_UNIT_TYPE))
        .filter(unit_types::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(internal)?
        .into_iter()
        .map(|t| t.id)
        .collect())
}

/// Loads the candidate from the `{id}` path param, only if it belongs to the authenticated user
async fn owned_candidate(req: &Request, depot: &Depot, db: &DatabaseConnection) -> Result<candidates::Model, StatusError> {
    let id = path_uuid(req, "id")?;
    let user_id = auth_user_id(depot).ok_or_else(|| StatusError::unauthorized().brief("Not authenticated"))?;

    let candidate = candidates::Entity::find_by_id(id)
        .filter(candidates::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Candidate not found"))?;

    if candidate.user_id != user_id {
        return Err(StatusError::forbidden().brief("Access denied: candidate belongs to another user"));
    }
    Ok(candidate)
}

fn candidate_individual_id(candidate: &candidates::Model) -> Result<Uuid, StatusError> {
    candidate
        .individual_id
        .filter(|id| !id.is_nil())
        .ok_or_else(|| StatusError::bad_request().brief("Candidate has no linked individual"))
}

async fn find_family_card(db: &DatabaseConnection, individual_id: Uuid) -> Result<Option<family_card::Model>, StatusError> {
    family_card::Entity::find()
        .filter(family_card::Column::IndividualId.eq(individual_id))
        .filter(family_card::Column::DeletedAt.is_null())
        .order_by_desc(family_card::Column::CreatedAt)
        .one(db)
        .await
        .map_err(internal)
}

async fn build_status(db: &DatabaseConnection, candidate: &candidates::Model) -> Result<AdmissionStatusResponse, StatusError> {
    let individual = match candidate.individual_id {
        Some(id) => individual::Entity::find_by_id(id).one(db).await.map_err(internal)?,
        None => None,
    };
    let email = user::Entity::find_by_id(candidate.user_id)
        .one(db)
        .await
        .map_err(internal)?
        .map(|u| u.email);

    // Unit choice
    let unit = match candidate_unit::Entity::find()
        .filter(candidate_unit::Column::CandidateId.eq(candidate.id))
        .filter(candidate_unit::Column::DeletedAt.is_null())
        .order_by_desc(candidate_unit::Column::CreatedAt)
        .one(db)
        .await
        .map_err(internal)?
    {
        Some(cu) => {
            let unit_name = units::Entity::find_by_id(cu.unit_id).one(db).await.map_err(internal)?.and_then(|u| u.name);
            let category_name = registration_categories::Entity::find_by_id(cu.registration_category_id)
                .one(db)
                .await
                .map_err(internal)?
                .map(|c| c.name);
            Some(AdmissionUnitStatus {
                id: cu.id,
                unit_id: cu.unit_id,
                unit_name,
                registration_category_id: cu.registration_category_id,
                registration_category_name: category_name,
            })
        }
        None => None,
    };

    // Family card & members
    let card = match candidate.individual_id {
        Some(id) => find_family_card(db, id).await?,
        None => None,
    };

    let relative_types = relative_type::Entity::find().all(db).await.map_err(internal)?;
    let relative_code = |id: Uuid| relative_types.iter().find(|t| t.id == id).map(|t| t.code);

    let mut family_members = Vec::new();
    let mut member_codes: Vec<(i32, bool)> = Vec::new();
    if let Some(ref card) = card {
        let members = family_card_member::Entity::find()
            .filter(family_card_member::Column::FamilyCardId.eq(card.id))
            .filter(family_card_member::Column::DeletedAt.is_null())
            .order_by_asc(family_card_member::Column::CreatedAt)
            .all(db)
            .await
            .map_err(internal)?;

        for member in members {
            let relative = individual::Entity::find_by_id(member.relative_id).one(db).await.map_err(internal)?;
            let is_deceased = relative.as_ref().map(|r| r.is_deceased).unwrap_or(false);
            if let Some(code) = relative_code(member.relative_type_id) {
                member_codes.push((code, is_deceased));
            }
            family_members.push(AdmissionFamilyMemberStatus {
                id: member.id,
                relative_id: member.relative_id,
                relative_type_id: member.relative_type_id,
                relative_type_name: relative_types.iter().find(|t| t.id == member.relative_type_id).map(|t| t.name.clone()),
                name: relative.as_ref().map(|r| r.name.clone()),
                nik: relative.as_ref().map(|r| r.code.clone()),
                birth_place: relative.as_ref().map(|r| r.birth_place.clone()),
                birth_date: relative.as_ref().map(|r| r.birth_date),
                is_deceased,
            });
        }
    }

    let find_member = |code: i32| member_codes.iter().find(|(c, _)| *c == code).copied();
    let mother = find_member(RELATIVE_MOTHER);
    let father = find_member(RELATIVE_FATHER);
    let mother_deceased = mother.map(|(_, d)| d).unwrap_or(false);
    let father_absent_or_deceased = father.map(|(_, d)| d).unwrap_or(true);
    // Orphan: mother deceased and father either deceased or not recorded
    let guardian_required = mother_deceased && father_absent_or_deceased;
    let guardian = member_codes
        .iter()
        .any(|(c, d)| (*c == RELATIVE_GUARDIAN_FATHER || *c == RELATIVE_GUARDIAN_MOTHER) && !d);
    let parents = mother.is_some() && (!guardian_required || guardian);

    // Archives
    let types = archive_types::Entity::find()
        .filter(archive_types::Column::Name.is_in(REQUIRED_ARCHIVE_TYPES))
        .filter(archive_types::Column::DeletedAt.is_null())
        .order_by_asc(archive_types::Column::Code)
        .all(db)
        .await
        .map_err(internal)?;

    let uploaded = archives::Entity::find()
        .filter(archives::Column::ArchiveableId.eq(candidate.id))
        .filter(archives::Column::ArchiveableType.eq(CANDIDATE_ROLEABLE_TYPE))
        .filter(archives::Column::DeletedAt.is_null())
        .order_by_desc(archives::Column::CreatedAt)
        .all(db)
        .await
        .map_err(internal)?;

    let archive_statuses: Vec<AdmissionArchiveStatus> = types
        .iter()
        .map(|t| {
            let latest = uploaded.iter().find(|a| a.archive_type_id == t.id);
            AdmissionArchiveStatus {
                archive_type_id: t.id,
                archive_type_name: t.name.clone(),
                archive_id: latest.map(|a| a.id),
                file_name: latest.and_then(|a| a.description.clone()).or_else(|| latest.map(|a| a.name.clone())),
                mimetype: latest.map(|a| a.mimetype.clone()),
                size: latest.and_then(|a| a.size),
                uploaded_at: latest.and_then(|a| a.created_at),
            }
        })
        .collect();
    let archives_complete = types.len() == REQUIRED_ARCHIVE_TYPES.len() && archive_statuses.iter().all(|a| a.archive_id.is_some());

    let unit_choice = unit.is_some();
    let has_card = card.as_ref().and_then(|c| c.code.as_ref()).is_some_and(|c| !c.trim().is_empty());

    Ok(AdmissionStatusResponse {
        candidate: AdmissionCandidateSummary {
            id: candidate.id,
            name: candidate.name.clone(),
            code: candidate.code.clone(),
            nik: individual.as_ref().map(|i| i.code.clone()),
            email,
            student_national_number: candidate.student_national_number.clone(),
            school_name: candidate.school_name.clone(),
            institution_id: candidate.institution_id,
            individual_id: candidate.individual_id,
            created_at: candidate.created_at,
        },
        unit,
        family_card: card.map(|c| AdmissionFamilyCardStatus { id: c.id, code: c.code }),
        family_members,
        archives: archive_statuses,
        requirements: AdmissionRequirementStatus {
            unit_choice,
            family_card: has_card,
            mother: mother.is_some(),
            father: father.is_some(),
            guardian_required,
            guardian,
            parents,
            archives: archives_complete,
            is_complete: unit_choice && has_card && parents && archives_complete,
        },
    })
}

// ==============================================
// Public Endpoints
// ==============================================

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 404, 500))]
pub async fn register(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<Json<AdmissionRegisterResponse>, StatusError> {
    let db = get_db(depot)?;

    let payload: AdmissionRegisterRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let email = payload.email.trim().to_lowercase();
    let nik = payload.nik.trim().to_string();
    if !nik.chars().all(|c| c.is_ascii_digit()) {
        return Err(StatusError::bad_request().brief("NIK must contain digits only"));
    }

    let institution = find_institution_by_code(&db, &payload.institution_code).await?;

    if user::Entity::find()
        .filter(user::Column::Email.eq(&email))
        .filter(user::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .is_some()
    {
        return Err(StatusError::bad_request().brief("Email sudah terdaftar, silakan masuk menggunakan akun tersebut"));
    }

    // Reuse the individual registered under this NIK, unless it already owns an account
    let existing_individual = individual::Entity::find()
        .filter(individual::Column::Code.eq(&nik))
        .filter(individual::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?;

    if let Some(ref ind) = existing_individual {
        let owned = user::Entity::find()
            .filter(user::Column::IndividualId.eq(ind.id))
            .filter(user::Column::DeletedAt.is_null())
            .one(&db)
            .await
            .map_err(internal)?;
        if owned.is_some() {
            return Err(StatusError::bad_request().brief("NIK sudah memiliki akun, silakan masuk atau gunakan fasilitas lupa kata sandi"));
        }
    }

    let position = position_type::Entity::find()
        .filter(position_type::Column::Name.eq(CANDIDATE_POSITION_TYPE))
        .filter(position_type::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Candidate position type not found"))?;

    let now = Utc::now().naive_utc();
    let hashed_password = hash_password(&payload.password)?;

    let txn = db.begin().await.map_err(internal)?;

    let individual_id = match existing_individual {
        Some(ind) => ind.id,
        None => {
            let created = individual::ActiveModel {
                id: Set(Uuid::now_v7()),
                code: Set(nik.clone()),
                name: Set(payload.name.trim().to_string()),
                birth_date: Set(payload.birth_date),
                birth_place: Set(payload.birth_place.trim().to_string()),
                gender_id: Set(payload.gender_id),
                religion_id: Set(payload.religion_id),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                ..Default::default()
            }
            .insert(&txn)
            .await
            .map_err(internal)?;
            created.id
        }
    };

    let user_id = Uuid::now_v7();
    user::ActiveModel {
        id: Set(user_id),
        pid: Set(Uuid::new_v4()),
        email: Set(email.clone()),
        password: Set(hashed_password),
        api_key: Set(generate_random_token(32)),
        name: Set(payload.name.trim().to_string()),
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
        created_by: Set(Some(user_id)),
        updated_by: Set(Some(user_id)),
    }
    .insert(&txn)
    .await
    .map_err(internal)?;

    let candidate_id = Uuid::now_v7();
    candidates::ActiveModel {
        id: Set(candidate_id),
        thread: Set(None),
        code: Set(None),
        name: Set(payload.name.trim().to_string()),
        student_national_number: Set(payload.student_national_number.clone().filter(|s| !s.trim().is_empty())),
        school_name: Set(payload.school_name.clone().filter(|s| !s.trim().is_empty())),
        school_regency_id: Set(None),
        state_smart_card_number: Set(None),
        individual_id: Set(Some(individual_id)),
        academic_year_id: Set(payload.academic_year_id.filter(|id| !id.is_nil())),
        student_id: Set(None),
        user_id: Set(user_id),
        // Assigned once the candidate picks a study program on the dashboard
        registration_type_id: Set(Uuid::nil()),
        institution_id: Set(institution.id),
        guidence_name: Set(None),
        guidence_phone_number: Set(None),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(Some(user_id)),
        updated_by: Set(Some(user_id)),
    }
    .insert(&txn)
    .await
    .map_err(internal)?;

    let role_id = Uuid::now_v7();
    role::ActiveModel {
        id: Set(role_id),
        name: Set(CANDIDATE_POSITION_TYPE.to_string()),
        user_id: Set(Some(user_id)),
        position_type_id: Set(Some(position.id)),
        roleable_id: Set(Some(candidate_id)),
        roleable_type: Set(Some(CANDIDATE_ROLEABLE_TYPE.to_string())),
        created_at: Set(now),
        updated_at: Set(now),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(Some(user_id)),
        updated_by: Set(Some(user_id)),
    }
    .insert(&txn)
    .await
    .map_err(internal)?;

    let mut user_active = user::Entity::find_by_id(user_id)
        .one(&txn)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::internal_server_error().brief("User not created"))?
        .into_active_model();
    user_active.current_role_id = Set(Some(role_id));
    let saved_user = user_active.update(&txn).await.map_err(internal)?;

    let phone_number = payload.phone_number.trim().to_string();
    let phone_exists = crate::models::contact::master::phones::Entity::find()
        .filter(crate::models::contact::master::phones::Column::PhoneNumber.eq(&phone_number))
        .filter(crate::models::contact::master::phones::Column::PhoneableType.eq(INDIVIDUAL_PHONEABLE_TYPE))
        .filter(crate::models::contact::master::phones::Column::PhoneableId.eq(individual_id))
        .filter(crate::models::contact::master::phones::Column::DeletedAt.is_null())
        .one(&txn)
        .await
        .map_err(internal)?;
    if phone_exists.is_none() {
        crate::models::contact::master::phones::ActiveModel {
            id: Set(Uuid::now_v7()),
            phone_number: Set(phone_number),
            phone_type_id: Set(None),
            phoneable_id: Set(individual_id),
            phoneable_type: Set(INDIVIDUAL_PHONEABLE_TYPE.to_string()),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            deleted_at: Set(None),
            sync_at: Set(None),
            created_by: Set(Some(user_id)),
            updated_by: Set(Some(user_id)),
        }
        .insert(&txn)
        .await
        .map_err(internal)?;
    }

    txn.commit().await.map_err(internal)?;

    // Start a session exactly like `login_with_session`
    let token = create_token(user_id, &JwtConfig::from_env()).map_err(internal)?;
    let session_id = Uuid::new_v4().to_string();
    let cookie = salvo::http::cookie::Cookie::build(("session_id", session_id.clone()))
        .path("/")
        .http_only(true)
        .same_site(salvo::http::cookie::SameSite::Lax)
        .build();
    res.add_cookie(cookie);

    let user_roles = fetch_user_roles(&db, user_id).await;

    Ok(Json(AdmissionRegisterResponse {
        session_id,
        token,
        user: UserResponse {
            id: saved_user.id,
            pid: saved_user.pid,
            email: saved_user.email,
            password: "".to_string(),
            api_key: saved_user.api_key,
            name: saved_user.name,
            individual_id: saved_user.individual_id,
            is_active: saved_user.is_active,
            current_role_id: saved_user.current_role_id,
            reset_token: None,
            reset_sent_at: None,
            email_verification_token: None,
            email_verification_sent_at: None,
            email_verified_at: saved_user.email_verified_at,
            magic_link_token: None,
            magic_link_expiration: None,
            created_at: saved_user.created_at,
            updated_at: saved_user.updated_at,
            deleted_at: None,
            created_by: saved_user.created_by,
            updated_by: saved_user.updated_by,
            roles: Some(user_roles),
        },
        expires_in: 86400,
        candidate_id,
    }))
}

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 404, 500))]
pub async fn unit_options(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionUnitOptionsResponse>, StatusError> {
    let db = get_db(depot)?;
    let query: AdmissionUnitQuery = req.parse_queries().unwrap_or_default();
    let code = query
        .institution_code
        .filter(|c| !c.trim().is_empty())
        .ok_or_else(|| StatusError::bad_request().brief("institution_code is required"))?;

    let institution = find_institution_by_code(&db, &code).await?;
    let unit_type_ids = study_program_unit_type_ids(&db).await?;

    let unit_items = units::Entity::find()
        .filter(units::Column::InstitutionId.eq(institution.id))
        .filter(units::Column::UnitTypeId.is_in(unit_type_ids))
        .filter(units::Column::DeletedAt.is_null())
        .order_by_asc(units::Column::Name)
        .all(&db)
        .await
        .map_err(internal)?;

    let categories = registration_categories::Entity::find()
        .filter(registration_categories::Column::DeletedAt.is_null())
        .order_by_asc(registration_categories::Column::Code)
        .all(&db)
        .await
        .map_err(internal)?;

    Ok(Json(AdmissionUnitOptionsResponse {
        units: unit_items
            .into_iter()
            .map(|u| AdmissionUnitOption { id: u.id, code: u.code, name: u.name.unwrap_or_default() })
            .collect(),
        registration_categories: categories
            .into_iter()
            .map(|c| AdmissionUnitOption { id: c.id, code: c.alphabet_code, name: c.name })
            .collect(),
    }))
}

// ==============================================
// Authenticated candidate self-service endpoints
// ==============================================

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 403, 404, 500))]
pub async fn status(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionStatusResponse>, StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;
    Ok(Json(build_status(&db, &candidate).await?))
}

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 403, 404, 500))]
pub async fn save_unit(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionStatusResponse>, StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;

    let payload: AdmissionUnitRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    let unit_type_ids = study_program_unit_type_ids(&db).await?;
    let unit = units::Entity::find_by_id(payload.unit_id)
        .filter(units::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;
    if unit.institution_id != candidate.institution_id || !unit_type_ids.contains(&unit.unit_type_id) {
        return Err(StatusError::bad_request().brief("Unit is not a study program of the candidate's institution"));
    }

    registration_categories::Entity::find_by_id(payload.registration_category_id)
        .filter(registration_categories::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Registration category not found"))?;

    let now = Utc::now().naive_utc();
    let user_id = auth_user_id(depot);
    let txn = db.begin().await.map_err(internal)?;

    let existing = candidate_unit::Entity::find()
        .filter(candidate_unit::Column::CandidateId.eq(candidate.id))
        .filter(candidate_unit::Column::DeletedAt.is_null())
        .order_by_desc(candidate_unit::Column::CreatedAt)
        .one(&txn)
        .await
        .map_err(internal)?;

    match existing {
        Some(cu) => {
            let mut active = cu.into_active_model();
            active.unit_id = Set(payload.unit_id);
            active.registration_category_id = Set(payload.registration_category_id);
            active.updated_at = Set(Some(now));
            active.updated_by = Set(user_id);
            active.update(&txn).await.map_err(internal)?;
        }
        None => {
            candidate_unit::ActiveModel {
                id: Set(Uuid::now_v7()),
                candidate_id: Set(candidate.id),
                unit_id: Set(payload.unit_id),
                registration_category_id: Set(payload.registration_category_id),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(user_id),
                updated_by: Set(user_id),
            }
            .insert(&txn)
            .await
            .map_err(internal)?;
        }
    }

    // Keep the candidate's registration type in sync when one matches the chosen unit & category
    let registration_type = registration_types::Entity::find()
        .filter(registration_types::Column::UnitId.eq(payload.unit_id))
        .filter(registration_types::Column::RegistrationCategoryId.eq(payload.registration_category_id))
        .filter(registration_types::Column::DeletedAt.is_null())
        .order_by_asc(registration_types::Column::Code)
        .one(&txn)
        .await
        .map_err(internal)?;

    let mut candidate_active = candidate.clone().into_active_model();
    candidate_active.registration_type_id = Set(registration_type.map(|t| t.id).unwrap_or_else(Uuid::nil));
    candidate_active.updated_at = Set(Some(now));
    candidate_active.updated_by = Set(user_id);
    let candidate = candidate_active.update(&txn).await.map_err(internal)?;

    txn.commit().await.map_err(internal)?;

    Ok(Json(build_status(&db, &candidate).await?))
}

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 403, 404, 500))]
pub async fn save_family_card(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionStatusResponse>, StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;
    let individual_id = candidate_individual_id(&candidate)?;

    let payload: AdmissionFamilyCardRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    let payload = AdmissionFamilyCardRequest { code: payload.code.trim().to_string() };
    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;
    if !payload.code.chars().all(|c| c.is_ascii_digit()) {
        return Err(StatusError::bad_request().brief("Family card number must contain digits only"));
    }

    let now = Utc::now().naive_utc();
    let user_id = auth_user_id(depot);

    match find_family_card(&db, individual_id).await? {
        Some(card) => {
            let mut active = card.into_active_model();
            active.code = Set(Some(payload.code));
            active.updated_at = Set(Some(now));
            active.updated_by = Set(user_id);
            active.update(&db).await.map_err(internal)?;
        }
        None => {
            family_card::ActiveModel {
                id: Set(Uuid::now_v7()),
                code: Set(Some(payload.code)),
                individual_id: Set(Some(individual_id)),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                deleted_at: Set(None),
                sync_at: Set(None),
                created_by: Set(user_id),
                updated_by: Set(user_id),
            }
            .insert(&db)
            .await
            .map_err(internal)?;
        }
    }

    Ok(Json(build_status(&db, &candidate).await?))
}

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 403, 404, 500))]
pub async fn store_family_member(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionStatusResponse>, StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;
    let individual_id = candidate_individual_id(&candidate)?;

    let payload: AdmissionFamilyMemberRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let nik = payload.nik.trim().to_string();
    if !nik.chars().all(|c| c.is_ascii_digit()) {
        return Err(StatusError::bad_request().brief("NIK must contain digits only"));
    }

    let card = find_family_card(&db, individual_id)
        .await?
        .ok_or_else(|| StatusError::bad_request().brief("Isi nomor kartu keluarga terlebih dahulu"))?;

    let relative_type = relative_type::Entity::find_by_id(payload.relative_type_id)
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Relative type not found"))?;
    if !ALLOWED_RELATIVE_CODES.contains(&relative_type.code) {
        return Err(StatusError::bad_request().brief("Only parents or guardians can be added"));
    }

    let existing_members = family_card_member::Entity::find()
        .filter(family_card_member::Column::FamilyCardId.eq(card.id))
        .filter(family_card_member::Column::DeletedAt.is_null())
        .all(&db)
        .await
        .map_err(internal)?;
    if existing_members.iter().any(|m| m.relative_type_id == relative_type.id) {
        return Err(StatusError::bad_request().brief(format!("{} sudah terdaftar, hapus terlebih dahulu untuk mengganti", relative_type.name)));
    }

    let now = Utc::now().naive_utc();
    let user_id = auth_user_id(depot);
    let txn = db.begin().await.map_err(internal)?;

    let existing_relative = individual::Entity::find()
        .filter(individual::Column::Code.eq(&nik))
        .filter(individual::Column::DeletedAt.is_null())
        .one(&txn)
        .await
        .map_err(internal)?;

    let relative_id = match existing_relative {
        Some(rel) => {
            if rel.id == individual_id {
                return Err(StatusError::bad_request().brief("NIK keluarga tidak boleh sama dengan NIK kandidat"));
            }
            if existing_members.iter().any(|m| m.relative_id == rel.id) {
                return Err(StatusError::bad_request().brief("Anggota keluarga dengan NIK ini sudah terdaftar"));
            }
            let id = rel.id;
            if rel.is_deceased != payload.is_deceased {
                let mut active = rel.into_active_model();
                active.is_deceased = Set(payload.is_deceased);
                active.updated_at = Set(Some(now));
                active.updated_by = Set(user_id);
                active.update(&txn).await.map_err(internal)?;
            }
            id
        }
        None => {
            individual::ActiveModel {
                id: Set(Uuid::now_v7()),
                code: Set(nik),
                name: Set(payload.name.trim().to_string()),
                birth_date: Set(payload.birth_date),
                birth_place: Set(payload.birth_place.trim().to_string()),
                gender_id: Set(payload.gender_id.unwrap_or_else(Uuid::nil)),
                religion_id: Set(payload.religion_id.unwrap_or_else(Uuid::nil)),
                is_deceased: Set(payload.is_deceased),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                created_by: Set(user_id),
                updated_by: Set(user_id),
                ..Default::default()
            }
            .insert(&txn)
            .await
            .map_err(internal)?
            .id
        }
    };

    family_card_member::ActiveModel {
        id: Set(Uuid::now_v7()),
        family_card_id: Set(card.id),
        individual_id: Set(individual_id),
        relative_id: Set(relative_id),
        relative_type_id: Set(relative_type.id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(user_id),
        updated_by: Set(user_id),
    }
    .insert(&txn)
    .await
    .map_err(internal)?;

    txn.commit().await.map_err(internal)?;

    Ok(Json(build_status(&db, &candidate).await?))
}

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 403, 404, 500))]
pub async fn delete_family_member(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionStatusResponse>, StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;
    let individual_id = candidate_individual_id(&candidate)?;
    let member_id = path_uuid(req, "member_id")?;

    let member = family_card_member::Entity::find_by_id(member_id)
        .filter(family_card_member::Column::IndividualId.eq(individual_id))
        .filter(family_card_member::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Family member not found"))?;

    let mut active = member.into_active_model();
    active.deleted_at = Set(Some(Utc::now().fixed_offset()));
    active.updated_at = Set(Some(Utc::now().naive_utc()));
    active.updated_by = Set(auth_user_id(depot));
    active.update(&db).await.map_err(internal)?;

    Ok(Json(build_status(&db, &candidate).await?))
}

#[endpoint(tags("Academic - Candidate - Admission"), status_codes(200, 400, 403, 404, 500))]
pub async fn upload_archive(req: &mut Request, depot: &mut Depot) -> Result<Json<AdmissionStatusResponse>, StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;
    let archive_type_id = path_uuid(req, "archive_type_id")?;

    let archive_type = archive_types::Entity::find_by_id(archive_type_id)
        .filter(archive_types::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Archive type not found"))?;
    if !REQUIRED_ARCHIVE_TYPES.contains(&archive_type.name.as_str()) {
        return Err(StatusError::bad_request().brief("Archive type is not part of the admission documents"));
    }

    // Multipart overhead on top of the file itself
    req.set_secure_max_size(MAX_ARCHIVE_SIZE + 64 * 1024);
    let file = req
        .file("file")
        .await
        .ok_or_else(|| StatusError::bad_request().brief("File is required (max 5 MB)"))?;

    let size = file.size() as usize;
    if size == 0 || size > MAX_ARCHIVE_SIZE {
        return Err(StatusError::bad_request().brief("File size must be between 1 byte and 5 MB"));
    }

    let mimetype = file
        .content_type()
        .map(|m| m.essence_str().to_string())
        .unwrap_or_default();
    if !ALLOWED_ARCHIVE_MIMES.contains(&mimetype.as_str()) {
        return Err(StatusError::bad_request().brief("Only JPG, PNG or PDF files are allowed"));
    }
    if archive_type.name == "Self Portrait" && !mimetype.starts_with("image/") {
        return Err(StatusError::bad_request().brief("Self portrait must be a JPG or PNG image"));
    }

    let extension = match mimetype.as_str() {
        "image/jpeg" => "jpg",
        "image/png" => "png",
        _ => "pdf",
    };
    let original_name = file.name().map(|n| n.to_string());
    let dir = format!("public/upload/academic/candidate/{}/", candidate.id);
    let file_name = format!("{}-{}.{}", archive_type.code, Uuid::now_v7(), extension);

    tokio::fs::create_dir_all(&dir).await.map_err(internal)?;
    tokio::fs::copy(file.path(), PathBuf::from(&dir).join(&file_name))
        .await
        .map_err(internal)?;

    let now = Utc::now().naive_utc();
    let user_id = auth_user_id(depot);
    let txn = db.begin().await.map_err(internal)?;

    // Replace the previous upload of the same type
    let previous = archives::Entity::find()
        .filter(archives::Column::ArchiveableId.eq(candidate.id))
        .filter(archives::Column::ArchiveableType.eq(CANDIDATE_ROLEABLE_TYPE))
        .filter(archives::Column::ArchiveTypeId.eq(archive_type.id))
        .filter(archives::Column::DeletedAt.is_null())
        .all(&txn)
        .await
        .map_err(internal)?;
    for old in previous {
        let mut active = old.into_active_model();
        active.deleted_at = Set(Some(Utc::now().fixed_offset()));
        active.updated_at = Set(Some(now));
        active.updated_by = Set(user_id);
        active.update(&txn).await.map_err(internal)?;
    }

    archives::ActiveModel {
        id: Set(Uuid::now_v7()),
        name: Set(file_name),
        dir: Set(dir),
        mimetype: Set(mimetype),
        size: Set(Some(size as i32)),
        archiveable_id: Set(Some(candidate.id)),
        archiveable_type: Set(Some(CANDIDATE_ROLEABLE_TYPE.to_string())),
        archive_type_id: Set(archive_type.id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(user_id),
        updated_by: Set(user_id),
        description: Set(original_name),
        is_knowledge: Set(false),
    }
    .insert(&txn)
    .await
    .map_err(internal)?;

    txn.commit().await.map_err(internal)?;

    Ok(Json(build_status(&db, &candidate).await?))
}

#[handler]
pub async fn archive_file(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    let db = get_db(depot)?;
    let candidate = owned_candidate(req, depot, &db).await?;
    let archive_id = path_uuid(req, "archive_id")?;

    let archive = archives::Entity::find_by_id(archive_id)
        .filter(archives::Column::ArchiveableId.eq(candidate.id))
        .filter(archives::Column::ArchiveableType.eq(CANDIDATE_ROLEABLE_TYPE))
        .filter(archives::Column::DeletedAt.is_null())
        .one(&db)
        .await
        .map_err(internal)?
        .ok_or_else(|| StatusError::not_found().brief("Archive not found"))?;

    let path = PathBuf::from(&archive.dir).join(&archive.name);
    let named = NamedFile::builder(path)
        .content_type(archive.mimetype.parse().unwrap_or(salvo::http::mime::APPLICATION_OCTET_STREAM))
        .build()
        .await
        .map_err(|_| StatusError::not_found().brief("File not found"))?;
    named.send(req.headers(), res).await;
    Ok(())
}
