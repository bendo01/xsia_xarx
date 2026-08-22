use chrono::Utc;
use salvo::prelude::*;
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::sea_query::Expr;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, IntoActiveModel,
    ModelTrait, PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::candidate::master::candidates::CandidateResponse;
use crate::dtos::academic::lecturer::master::lecturers::LecturerResponse;
use crate::dtos::academic::prior_learning_recognition::transaction::evaluators::EvaluatorResponse;
use crate::dtos::academic::student::master::students::StudentResponse;
use crate::dtos::auth::user::UserResponse;
use crate::dtos::institution::master::employees::EmployeeResponse;
use crate::dtos::literate::educations::EducationResponse;
use crate::dtos::person::master::biodata::BiodataResponse;
use crate::dtos::person::master::individual::{
    CreateIndividualRequest, IndividualDetailResponse, IndividualQuery, IndividualResponse,
    PaginatedIndividualResponse, UpdateIndividualRequest,
};
use crate::dtos::common::reference::{MessageResponse, ReferenceResponse};
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

    if let Some(ref search) = query.search {
        let trimmed = search.trim();
        if !trimmed.is_empty() {
            let search_pattern = format!("%{}%", trimmed);
            select = select.filter(
                Condition::any()
                    .add(Expr::col(entity_mod::Column::Name).ilike(search_pattern.clone()))
                    .add(Expr::col(entity_mod::Column::Code).ilike(search_pattern)),
            );
        }
    }

    if let Some(ref name) = query.name {
        let trimmed = name.trim();
        if !trimmed.is_empty() {
            let search_pattern = format!("%{}%", trimmed);
            select = select.filter(Expr::col(entity_mod::Column::Name).ilike(search_pattern));
        }
    }

    if let Some(ref code) = query.code {
        let trimmed = code.trim();
        if !trimmed.is_empty() {
            let search_pattern = format!("%{}%", trimmed);
            select = select.filter(Expr::col(entity_mod::Column::Code).ilike(search_pattern));
        }
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
) -> Result<Json<IndividualDetailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Individual not found"))?;

    let gender = item
        .find_related(crate::models::person::reference::gender::Entity)
        .filter(crate::models::person::reference::gender::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let religion = item
        .find_related(crate::models::person::reference::religion::Entity)
        .filter(crate::models::person::reference::religion::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let occupation = item
        .find_related(crate::models::person::reference::occupation::Entity)
        .filter(crate::models::person::reference::occupation::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let income = item
        .find_related(crate::models::person::reference::income::Entity)
        .filter(crate::models::person::reference::income::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let identification_type = item
        .find_related(crate::models::person::reference::identification_type::Entity)
        .filter(crate::models::person::reference::identification_type::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let marital_status = item
        .find_related(crate::models::person::reference::marital_status::Entity)
        .filter(crate::models::person::reference::marital_status::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let profession = item
        .find_related(crate::models::person::reference::profession::Entity)
        .filter(crate::models::person::reference::profession::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let age_classification = item
        .find_related(crate::models::person::reference::age_classification::Entity)
        .filter(crate::models::person::reference::age_classification::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let education = item
        .find_related(crate::models::literate::educations::Entity)
        .filter(crate::models::literate::educations::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|e| EducationResponse {
            id: e.id,
            code: e.code,
            alphabet_code: e.alphabet_code,
            abbreviation: e.abbreviation,
            name: e.name,
            level_id: e.level_id,
            group_id: e.group_id,
            category_id: e.category_id,
            variety_id: e.variety_id,
            created_at: e.created_at,
            updated_at: e.updated_at,
            sync_at: e.sync_at,
            deleted_at: e.deleted_at,
            created_by: e.created_by,
            updated_by: e.updated_by,
        });

    let biodata = item
        .find_related(crate::models::person::master::biodata::Entity)
        .filter(crate::models::person::master::biodata::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|b| BiodataResponse {
            id: b.id,
            height: b.height,
            weight: b.weight,
            is_positive_blood_rhesus: b.is_positive_blood_rhesus,
            blood_type_id: b.blood_type_id,
            hair_type_id: b.hair_type_id,
            hair_color_id: b.hair_color_id,
            eye_color_id: b.eye_color_id,
            individual_id: b.individual_id,
            bust: b.bust,
            waist: b.waist,
            hip: b.hip,
            arm_circumference: b.arm_circumference,
            menarche_age: b.menarche_age,
            menopause_age: b.menopause_age,
            created_at: b.created_at,
            updated_at: b.updated_at,
            deleted_at: b.deleted_at,
            sync_at: b.sync_at,
            created_by: b.created_by,
            updated_by: b.updated_by,
        });

    let user = item
        .find_related(crate::models::auth::user::Entity)
        .filter(crate::models::auth::user::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|u| UserResponse {
            id: u.id,
            pid: u.pid,
            email: u.email,
            password: "".to_string(),
            api_key: u.api_key,
            name: u.name,
            individual_id: u.individual_id,
            is_active: u.is_active,
            current_role_id: u.current_role_id,
            reset_token: u.reset_token,
            reset_sent_at: u.reset_sent_at,
            email_verification_token: u.email_verification_token,
            email_verification_sent_at: u.email_verification_sent_at,
            email_verified_at: u.email_verified_at,
            magic_link_token: u.magic_link_token,
            magic_link_expiration: u.magic_link_expiration,
            created_at: u.created_at,
            updated_at: u.updated_at,
            deleted_at: u.deleted_at,
            created_by: u.created_by,
            updated_by: u.updated_by,
        });

    let lecturer = item
        .find_related(crate::models::academic::lecturer::master::lecturers::Entity)
        .filter(crate::models::academic::lecturer::master::lecturers::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|l| LecturerResponse {
            id: l.id,
            code: l.code,
            name: l.name,
            individual_id: l.individual_id,
            institution_id: l.institution_id,
            alternative_code: l.alternative_code,
            accessor_number: l.accessor_number,
            identification_number: l.identification_number,
            status_id: l.status_id,
            contract_id: l.contract_id,
            rank_id: l.rank_id,
            start_date: l.start_date,
            end_date: l.end_date,
            front_title: l.front_title,
            last_title: l.last_title,
            id_dosen: l.id_dosen,
            group_id: l.group_id,
            nuptk: l.nuptk,
            created_at: l.created_at,
            updated_at: l.updated_at,
            deleted_at: l.deleted_at,
            sync_at: l.sync_at,
            created_by: l.created_by,
            updated_by: l.updated_by,
        });

    let employees = item
        .find_related(crate::models::institution::master::employees::Entity)
        .filter(crate::models::institution::master::employees::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|e| EmployeeResponse {
            id: e.id,
            code: e.code,
            name: e.name,
            institution_id: e.institution_id,
            individual_id: e.individual_id,
            decree_number: e.decree_number,
            decree_date: e.decree_date,
            is_active: e.is_active,
            created_at: e.created_at,
            updated_at: e.updated_at,
            deleted_at: e.deleted_at,
            sync_at: e.sync_at,
            created_by: e.created_by,
            updated_by: e.updated_by,
        })
        .collect::<Vec<_>>();

    let candidates = item
        .find_related(crate::models::academic::candidate::master::candidates::Entity)
        .filter(crate::models::academic::candidate::master::candidates::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| CandidateResponse {
            id: c.id,
            thread: c.thread,
            code: c.code,
            name: c.name,
            student_national_number: c.student_national_number,
            school_name: c.school_name,
            school_regency_id: c.school_regency_id,
            state_smart_card_number: c.state_smart_card_number,
            individual_id: c.individual_id,
            academic_year_id: c.academic_year_id,
            student_id: c.student_id,
            user_id: c.user_id,
            registration_type_id: c.registration_type_id,
            institution_id: c.institution_id,
            guidence_name: c.guidence_name,
            guidence_phone_number: c.guidence_phone_number,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
        })
        .collect::<Vec<_>>();

    let evaluators = item
        .find_related(crate::models::academic::prior_learning_recognition::transaction::evaluators::Entity)
        .filter(crate::models::academic::prior_learning_recognition::transaction::evaluators::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|ev| EvaluatorResponse {
            id: ev.id,
            individual_id: ev.individual_id,
            evaluator_type_id: ev.evaluator_type_id,
            recognition_id: ev.recognition_id,
            created_at: ev.created_at,
            updated_at: ev.updated_at,
            deleted_at: ev.deleted_at,
            sync_at: ev.sync_at,
            created_by: ev.created_by,
            updated_by: ev.updated_by,
        })
        .collect::<Vec<_>>();

    let students = item
        .find_related(crate::models::academic::student::master::students::Entity)
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|s| StudentResponse {
            id: s.id,
            code: s.code,
            name: s.name,
            selection_type_id: s.selection_type_id,
            registered: s.registered,
            individual_id: s.individual_id,
            status_id: s.status_id,
            unit_id: s.unit_id,
            academic_year_id: s.academic_year_id,
            registration_id: s.registration_id,
            nisn: s.nisn,
            resign_status_id: s.resign_status_id,
            concentration_id: s.concentration_id,
            curriculum_id: s.curriculum_id,
            class_code_id: s.class_code_id,
            transfer_code: s.transfer_code,
            transfer_unit_id: s.transfer_unit_id,
            id_mahasiswa: s.id_mahasiswa,
            id_registrasi_mahasiswa: s.id_registrasi_mahasiswa,
            finance_fee: s.finance_fee,
            finance_id: s.finance_id,
            created_at: s.created_at,
            updated_at: s.updated_at,
            deleted_at: s.deleted_at,
            sync_at: s.sync_at,
            created_by: s.created_by,
            updated_by: s.updated_by,
        })
        .collect::<Vec<_>>();

    Ok(Json(IndividualDetailResponse {
        individual: IndividualResponse {
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
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
        },
        gender,
        religion,
        occupation,
        income,
        identification_type,
        marital_status,
        profession,
        education,
        age_classification,
        biodata,
        user,
        lecturer,
        employees,
        candidates,
        evaluators,
        students,
    }))
}
#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 500))]
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
