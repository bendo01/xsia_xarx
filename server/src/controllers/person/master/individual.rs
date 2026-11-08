use chrono::Utc;
use salvo::prelude::*;
use sea_orm::sea_query::Expr;
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, IntoActiveModel,
    ModelTrait, PaginatorTrait, QueryFilter, QueryOrder, Set, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::candidate::master::candidates::CandidateResponse;
use crate::dtos::academic::lecturer::master::lecturers::LecturerResponse;
use crate::dtos::academic::prior_learning_recognition::transaction::evaluators::EvaluatorResponse;
use crate::dtos::academic::student::master::students::StudentResponse;
use crate::dtos::auth::user::UserResponse;
use crate::dtos::common::reference::{MessageResponse, ReferenceResponse, OptionItem, OptionRequest};
use crate::dtos::institution::master::employees::EmployeeResponse;
use crate::dtos::literate::educations::EducationResponse;
use crate::dtos::person::master::biodata::BiodataResponse;
use crate::dtos::person::master::individual::{
    CreateIndividualRequest, IndividualDetailResponse, IndividualQuery, IndividualResponse,
    IndividualStatisticDistribution, IndividualStatisticItem, IndividualStatisticsResponse,
    PaginatedIndividualResponse, UpdateIndividualRequest,
};
use crate::middleware::auth::auth_user_id;
use crate::models::person::master::individual as entity_mod;

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedIndividualResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

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

    let sort_by = query
        .sort_by
        .as_deref()
        .or(query.order_by.as_deref())
        .unwrap_or("name");
    let sort_dir = query
        .sort_dir
        .as_deref()
        .or(query.order_dir.as_deref())
        .unwrap_or("asc");
    let is_desc = sort_dir.eq_ignore_ascii_case("desc");

    select = match sort_by {
        "code" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::Code)
            } else {
                select.order_by_asc(entity_mod::Column::Code)
            }
        }
        "created_at" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::CreatedAt)
            } else {
                select.order_by_asc(entity_mod::Column::CreatedAt)
            }
        }
        "updated_at" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::UpdatedAt)
            } else {
                select.order_by_asc(entity_mod::Column::UpdatedAt)
            }
        }
        _ => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::Name)
            } else {
                select.order_by_asc(entity_mod::Column::Name)
            }
        }
    };

    let paginator = select.paginate(db, page_size);

    let total = paginator
        .num_items()
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator
        .fetch_page(page.saturating_sub(1))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items
        .into_iter()
        .map(|item| IndividualResponse {
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
        })
        .collect();

    Ok(Json(PaginatedIndividualResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

fn db_err(e: sea_orm::DbErr) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

/// Loads phones, e-mails, residences and family cards owned by an individual.
async fn load_contacts_and_family(
    db: &DatabaseConnection,
    individual_id: Uuid,
) -> Result<
    (
        Vec<crate::dtos::person::master::individual::IndividualContactItem>,
        Vec<crate::dtos::person::master::individual::IndividualContactItem>,
        Vec<crate::dtos::person::master::individual::IndividualResidenceItem>,
        Vec<crate::dtos::person::master::individual::IndividualFamilyCardItem>,
    ),
    StatusError,
> {
    use crate::dtos::person::master::individual::*;
    use crate::models::contact::master::{electronic_mails, owner_types, phones, residences};
    use crate::models::contact::reference::{electronic_mail_types, phone_types, residence_types};
    use crate::models::location::{provinces, regencies, sub_districts, villages};
    use crate::models::person::master::{family_card, family_card_member};
    use std::collections::HashMap;

    // id -> name lookup for a set of ids
    use crate::models::person::reference::relative_type;
    macro_rules! names {
        ($module:ident, $ids:expr, $opt:expr) => {{
            let ids: Vec<Uuid> = $ids;
            let mut map: HashMap<Uuid, String> = HashMap::new();
            if !ids.is_empty() {
                for m in $module::Entity::find()
                    .filter($module::Column::Id.is_in(ids))
                    .all(db)
                    .await
                    .map_err(db_err)?
                {
                    if let Some(n) = $opt(m.name.clone()) {
                        map.insert(m.id, n);
                    }
                }
            }
            map
        }};
    }
    fn some(n: String) -> Option<String> { Some(n) }
    fn same(n: Option<String>) -> Option<String> { n }

    // Phones
    let phone_rows = phones::Entity::find()
        .filter(phones::Column::PhoneableId.eq(individual_id))
        .filter(phones::Column::PhoneableType.eq(owner_types::INDIVIDUAL))
        .filter(phones::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(db_err)?;
    let phone_types_map = names!(phone_types, phone_rows.iter().filter_map(|r| r.phone_type_id).collect(), some);
    let phones_out = phone_rows
        .into_iter()
        .map(|r| IndividualContactItem {
            id: r.id,
            value: r.phone_number,
            type_name: r.phone_type_id.and_then(|t| phone_types_map.get(&t).cloned()),
        })
        .collect();

    // E-mails
    let mail_rows = electronic_mails::Entity::find()
        .filter(electronic_mails::Column::ElectronicMailableId.eq(individual_id))
        .filter(electronic_mails::Column::ElectronicMailableType.eq(owner_types::INDIVIDUAL))
        .filter(electronic_mails::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(db_err)?;
    let mail_types_map = names!(electronic_mail_types, mail_rows.iter().filter_map(|r| r.electronic_mail_type_id).collect(), some);
    let mails_out = mail_rows
        .into_iter()
        .map(|r| IndividualContactItem {
            id: r.id,
            value: r.email_address,
            type_name: r.electronic_mail_type_id.and_then(|t| mail_types_map.get(&t).cloned()),
        })
        .collect();

    // Residences
    let res_rows = residences::Entity::find()
        .filter(residences::Column::ResidenceableId.eq(individual_id))
        .filter(residences::Column::ResidenceableType.eq(owner_types::INDIVIDUAL))
        .filter(residences::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(db_err)?;
    let rtypes = names!(residence_types, res_rows.iter().filter_map(|r| r.residence_type_id).collect(), some);
    let provs = names!(provinces, res_rows.iter().filter_map(|r| r.province_id).collect(), same);
    let regs = names!(regencies, res_rows.iter().filter_map(|r| r.regency_id).collect(), same);
    let subs = names!(sub_districts, res_rows.iter().filter_map(|r| r.sub_district_id).collect(), some);
    let vils = names!(villages, res_rows.iter().filter_map(|r| r.village_id).collect(), some);
    let residences_out = res_rows
        .into_iter()
        .map(|r| IndividualResidenceItem {
            id: r.id,
            street: r.street,
            citizens_association: r.citizens_association,
            neighborhood_association: r.neighborhood_association,
            residence_type_name: r.residence_type_id.and_then(|i| rtypes.get(&i).cloned()),
            province_name: r.province_id.and_then(|i| provs.get(&i).cloned()),
            regency_name: r.regency_id.and_then(|i| regs.get(&i).cloned()),
            sub_district_name: r.sub_district_id.and_then(|i| subs.get(&i).cloned()),
            village_name: r.village_id.and_then(|i| vils.get(&i).cloned()),
            latitude: r.latitude,
            longitude: r.longitude,
        })
        .collect();

    // Family cards: cards headed by the individual, or where they are a member
    let member_card_ids: Vec<Uuid> = family_card_member::Entity::find()
        .filter(family_card_member::Column::IndividualId.eq(individual_id))
        .filter(family_card_member::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(db_err)?
        .into_iter()
        .map(|m| m.family_card_id)
        .collect();
    let cards = family_card::Entity::find()
        .filter(family_card::Column::DeletedAt.is_null())
        .filter(
            Condition::any()
                .add(family_card::Column::IndividualId.eq(individual_id))
                .add(family_card::Column::Id.is_in(member_card_ids)),
        )
        .all(db)
        .await
        .map_err(db_err)?;
    let card_ids: Vec<Uuid> = cards.iter().map(|c| c.id).collect();
    let members = if card_ids.is_empty() {
        Vec::new()
    } else {
        family_card_member::Entity::find()
            .filter(family_card_member::Column::FamilyCardId.is_in(card_ids))
            .filter(family_card_member::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(db_err)?
    };
    let mut person_ids: Vec<Uuid> = members.iter().flat_map(|m| [m.individual_id, m.relative_id]).collect();
    person_ids.extend(cards.iter().filter_map(|c| c.individual_id));
    let people = names!(entity_mod, person_ids, some);
    let rel_types = names!(
        relative_type,
        members.iter().map(|m| m.relative_type_id).collect(),
        some
    );
    let family_out = cards
        .into_iter()
        .map(|c| IndividualFamilyCardItem {
            id: c.id,
            code: c.code,
            head_individual_id: c.individual_id,
            head_name: c.individual_id.and_then(|i| people.get(&i).cloned()),
            members: members
                .iter()
                .filter(|m| m.family_card_id == c.id)
                .map(|m| IndividualFamilyCardMemberItem {
                    id: m.id,
                    individual_id: m.individual_id,
                    individual_name: people.get(&m.individual_id).cloned(),
                    relative_id: m.relative_id,
                    relative_name: people.get(&m.relative_id).cloned(),
                    relative_type_name: rel_types.get(&m.relative_type_id).cloned(),
                })
                .collect(),
        })
        .collect();

    Ok((phones_out, mails_out, residences_out, family_out))
}

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<IndividualDetailResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

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
            roles: None,
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
            ..Default::default()
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
            ..Default::default()
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

    let raw_students = item
        .find_related(crate::models::academic::student::master::students::Entity)
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let student_unit_ids: Vec<Uuid> = raw_students
        .iter()
        .map(|s| s.unit_id)
        .filter(|id| *id != Uuid::nil())
        .collect();
    let student_status_ids: Vec<Uuid> = raw_students
        .iter()
        .map(|s| s.status_id)
        .filter(|id| *id != Uuid::nil())
        .collect();
    let student_academic_year_ids: Vec<Uuid> = raw_students
        .iter()
        .map(|s| s.academic_year_id)
        .filter(|id| *id != Uuid::nil())
        .collect();

    let student_units_map: std::collections::HashMap<Uuid, (Option<String>, Option<String>)> =
        if student_unit_ids.is_empty() {
            std::collections::HashMap::new()
        } else {
            crate::models::institution::master::units::Entity::find()
                .filter(
                    crate::models::institution::master::units::Column::Id.is_in(student_unit_ids),
                )
                .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .into_iter()
                .map(|u| (u.id, (u.code, u.name)))
                .collect()
        };

    let student_statuses_map: std::collections::HashMap<Uuid, String> = if student_status_ids
        .is_empty()
    {
        std::collections::HashMap::new()
    } else {
        crate::models::academic::student::reference::statuses::Entity::find()
            .filter(
                crate::models::academic::student::reference::statuses::Column::Id
                    .is_in(student_status_ids),
            )
            .filter(
                crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null(),
            )
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|s| (s.id, s.name))
            .collect()
    };

    let student_academic_years_map: std::collections::HashMap<Uuid, String> =
        if student_academic_year_ids.is_empty() {
            std::collections::HashMap::new()
        } else {
            crate::models::academic::general::reference::academic_years::Entity::find()
                .filter(
                    crate::models::academic::general::reference::academic_years::Column::Id
                        .is_in(student_academic_year_ids),
                )
                .filter(
                    crate::models::academic::general::reference::academic_years::Column::DeletedAt
                        .is_null(),
                )
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .into_iter()
                .map(|a| (a.id, a.name))
                .collect()
        };

    let students = raw_students
        .into_iter()
        .map(|s| {
            let u_info = student_units_map.get(&s.unit_id);
            StudentResponse {
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
                unit_name: u_info.and_then(|u| u.1.clone()),
                unit_code: u_info.and_then(|u| u.0.clone()),
                status_name: student_statuses_map.get(&s.status_id).cloned(),
                academic_year_name: student_academic_years_map.get(&s.academic_year_id).cloned(),
                curriculum_name: None,
                selection_type_name: None,
                ..Default::default()
            }
        })
        .collect::<Vec<_>>();

    // Contacts & family cards
    let (phones, electronic_mails, residences, family_cards) =
        load_contacts_and_family(db, item.id).await?;

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
        phones,
        electronic_mails,
        residences,
        family_cards,
    }))
}

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 400, 500))]
pub async fn store(
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
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

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
pub async fn update(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<IndividualResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateIndividualRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

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
    active_model.updated_by = Set(auth_user_id(depot));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

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
pub async fn delete(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

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
    active_model.updated_by = Set(auth_user_id(depot));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Individual deleted successfully".to_string(),
    }))
}

#[endpoint(tags("Person - Master - Individual"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: OptionRequest = req
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

/// Aggregated individual counts grouped by each person reference, for dashboard charts.
#[endpoint(tags("Person - Master - Individual"), status_codes(200, 500))]
pub async fn statistics(
    depot: &mut Depot,
) -> Result<Json<IndividualStatisticsResponse>, StatusError> {
    use sea_orm::{ConnectionTrait, DbBackend, Statement};

    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let fetch_items = |sql: String| async move {
        let rows = db
            .query_all_raw(Statement::from_string(DbBackend::Postgres, sql))
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        Ok::<_, StatusError>(
            rows.into_iter()
                .map(|row| IndividualStatisticItem {
                    name: row.try_get("", "name").unwrap_or_default(),
                    count: row.try_get("", "count").unwrap_or(0),
                })
                .collect::<Vec<_>>(),
        )
    };

    let summary = db
        .query_one_raw(Statement::from_string(
            DbBackend::Postgres,
            r#"
            SELECT
                COUNT(*)::bigint AS total,
                COUNT(*) FILTER (WHERE is_deceased)::bigint AS deceased,
                COUNT(*) FILTER (WHERE is_special_need)::bigint AS special_need,
                COUNT(*) FILTER (WHERE is_social_protection_card_recipient)::bigint AS social_protection_card_recipient
            FROM person_master.individuals
            WHERE deleted_at IS NULL
            "#,
        ))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let summary_value = |col: &str| -> i64 {
        summary
            .as_ref()
            .and_then(|row| row.try_get::<i64>("", col).ok())
            .unwrap_or(0)
    };

    // (key, label, reference table, foreign key column) — static identifiers only, never user input
    let references: [(&str, &str, &str, &str); 9] = [
        ("gender", "Jenis Kelamin", "person_reference.genders", "gender_id"),
        ("marital_status", "Status Pernikahan", "person_reference.marital_statuses", "marital_status_id"),
        ("religion", "Agama", "person_reference.religions", "religion_id"),
        ("education", "Pendidikan", "literate.educations", "education_id"),
        ("occupation", "Pekerjaan", "person_reference.occupations", "occupation_id"),
        ("profession", "Profesi", "person_reference.professions", "profession_id"),
        ("income", "Penghasilan", "person_reference.incomes", "income_id"),
        ("identification_type", "Jenis Identitas", "person_reference.identification_types", "identification_type_id"),
        ("age_classification", "Klasifikasi Usia", "person_reference.age_classifications", "age_classification_id"),
    ];

    let mut distributions = Vec::with_capacity(references.len());
    for (key, label, table, column) in references {
        let sql = format!(
            r#"
            SELECT COALESCE(r.name, 'Tidak Diketahui') AS name, COUNT(*)::bigint AS count
            FROM person_master.individuals i
            LEFT JOIN {table} r ON r.id = i.{column} AND r.deleted_at IS NULL
            WHERE i.deleted_at IS NULL
            GROUP BY COALESCE(r.name, 'Tidak Diketahui')
            ORDER BY count DESC, name ASC
            "#
        );
        distributions.push(IndividualStatisticDistribution {
            key: key.to_string(),
            label: label.to_string(),
            items: fetch_items(sql).await?,
        });
    }

    let age_groups = fetch_items(
        r#"
        SELECT bucket AS name, COUNT(*)::bigint AS count
        FROM (
            SELECT CASE
                WHEN age < 17 THEN '< 17'
                WHEN age < 25 THEN '17-24'
                WHEN age < 35 THEN '25-34'
                WHEN age < 45 THEN '35-44'
                WHEN age < 55 THEN '45-54'
                WHEN age < 65 THEN '55-64'
                ELSE '65+'
            END AS bucket,
            CASE
                WHEN age < 17 THEN 0
                WHEN age < 25 THEN 1
                WHEN age < 35 THEN 2
                WHEN age < 45 THEN 3
                WHEN age < 55 THEN 4
                WHEN age < 65 THEN 5
                ELSE 6
            END AS sort_order
            FROM (
                SELECT EXTRACT(YEAR FROM AGE(CURRENT_DATE, birth_date))::int AS age
                FROM person_master.individuals
                WHERE deleted_at IS NULL AND NOT is_deceased
            ) ages
        ) buckets
        GROUP BY bucket, sort_order
        ORDER BY sort_order
        "#
        .to_string(),
    )
    .await?;

    Ok(Json(IndividualStatisticsResponse {
        total: summary_value("total"),
        deceased: summary_value("deceased"),
        special_need: summary_value("special_need"),
        social_protection_card_recipient: summary_value("social_protection_card_recipient"),
        distributions,
        age_groups,
    }))
}
