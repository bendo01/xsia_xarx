use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::sea_query::extension::postgres::PgExpr;
use sea_orm::sea_query::Expr;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, Condition, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, QuerySelect, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::master::students::{
    CreateStudentRequest, DistinctAcademicYearQuery, DistinctAcademicYearResponse,
    PaginatedStudentResponse, StudentQuery, StudentResponse, UpdateStudentRequest,
    StudentOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::student::master::students as entity_mod;
use crate::middleware::auth::auth_user_id;
use crate::services::auth::data_scope::DataScope;

struct UnitInfo {
    code: Option<String>,
    name: Option<String>,
}

async fn load_relations_for_students(
    db: &DatabaseConnection,
    items: &[entity_mod::Model],
) -> Result<(
    HashMap<Uuid, UnitInfo>,
    HashMap<Uuid, String>,
    HashMap<Uuid, String>,
    HashMap<Uuid, String>,
    HashMap<Uuid, String>,
), StatusError> {
    let unit_ids: Vec<Uuid> = items.iter().map(|i| i.unit_id).filter(|id| *id != Uuid::nil()).collect();
    let status_ids: Vec<Uuid> = items.iter().map(|i| i.status_id).filter(|id| *id != Uuid::nil()).collect();
    let academic_year_ids: Vec<Uuid> = items.iter().map(|i| i.academic_year_id).filter(|id| *id != Uuid::nil()).collect();
    let curriculum_ids: Vec<Uuid> = items.iter().map(|i| i.curriculum_id).filter(|id| *id != Uuid::nil()).collect();
    let selection_type_ids: Vec<Uuid> = items.iter().map(|i| i.selection_type_id).filter(|id| *id != Uuid::nil()).collect();

    let units_map: HashMap<Uuid, UnitInfo> = if unit_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::Id.is_in(unit_ids))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|u| (u.id, UnitInfo { code: u.code, name: u.name }))
            .collect()
    };

    let statuses_map: HashMap<Uuid, String> = if status_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::statuses::Entity::find()
            .filter(crate::models::academic::student::reference::statuses::Column::Id.is_in(status_ids))
            .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|s| (s.id, s.name))
            .collect()
    };

    let academic_years_map: HashMap<Uuid, String> = if academic_year_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::general::reference::academic_years::Entity::find()
            .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(academic_year_ids))
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|a| (a.id, a.name))
            .collect()
    };

    let curriculums_map: HashMap<Uuid, String> = if curriculum_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::course::master::curriculums::Entity::find()
            .filter(crate::models::academic::course::master::curriculums::Column::Id.is_in(curriculum_ids))
            .filter(crate::models::academic::course::master::curriculums::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|c| (c.id, c.name))
            .collect()
    };

    let selection_types_map: HashMap<Uuid, String> = if selection_type_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::selection_types::Entity::find()
            .filter(crate::models::academic::student::reference::selection_types::Column::Id.is_in(selection_type_ids))
            .filter(crate::models::academic::student::reference::selection_types::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|st| (st.id, st.name))
            .collect()
    };

    Ok((units_map, statuses_map, academic_years_map, curriculums_map, selection_types_map))
}

fn to_response(
    item: entity_mod::Model,
    units_map: &HashMap<Uuid, UnitInfo>,
    statuses_map: &HashMap<Uuid, String>,
    academic_years_map: &HashMap<Uuid, String>,
    curriculums_map: &HashMap<Uuid, String>,
    selection_types_map: &HashMap<Uuid, String>,
) -> StudentResponse {
    let unit = units_map.get(&item.unit_id);
    StudentResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        selection_type_id: item.selection_type_id,
        registered: item.registered,
        individual_id: item.individual_id,
        status_id: item.status_id,
        unit_id: item.unit_id,
        academic_year_id: item.academic_year_id,
        registration_id: item.registration_id,
        nisn: item.nisn,
        resign_status_id: item.resign_status_id,
        concentration_id: item.concentration_id,
        curriculum_id: item.curriculum_id,
        class_code_id: item.class_code_id,
        transfer_code: item.transfer_code,
        transfer_unit_id: item.transfer_unit_id,
        id_mahasiswa: item.id_mahasiswa,
        id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
        finance_fee: item.finance_fee,
        finance_id: item.finance_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        unit_name: unit.and_then(|u| u.name.clone()),
        unit_code: unit.and_then(|u| u.code.clone()),
        status_name: statuses_map.get(&item.status_id).cloned(),
        academic_year_name: academic_years_map.get(&item.academic_year_id).cloned(),
        curriculum_name: curriculums_map.get(&item.curriculum_id).cloned(),
        selection_type_name: selection_types_map.get(&item.selection_type_id).cloned(),
        ..Default::default()
    }
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStudentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: StudentQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    // Requested unit / institution filters below only narrow this scope, never widen it
    let scope = DataScope::resolve(db, depot).await?;
    let mut select = scope.apply(entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null()));

    let search_term = query.search.as_ref().or(query.q.as_ref());
    if let Some(search) = search_term {
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

    if let Some(individual_id) = query.individual_id {
        select = select.filter(entity_mod::Column::IndividualId.eq(individual_id));
    }

    if let Some(unit_id) = query.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    } else if let Some(institution_id) = query.institution_id {
        let matching_unit_ids: Vec<Uuid> = crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::InstitutionId.eq(institution_id))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|u| u.id)
            .collect();

        if matching_unit_ids.is_empty() {
            select = select.filter(entity_mod::Column::UnitId.eq(Uuid::nil()));
        } else {
            select = select.filter(entity_mod::Column::UnitId.is_in(matching_unit_ids));
        }
    }

    let mut academic_year_filter_uuids = Vec::new();
    if let Some(raw_years) = query.academic_year_ids.as_deref().or(query.academic_year_id.as_deref()) {
        for val in raw_years.split(',') {
            let val_trimmed = val.trim();
            if !val_trimmed.is_empty()
                && let Ok(u) = Uuid::parse_str(val_trimmed) {
                    academic_year_filter_uuids.push(u);
                }
        }
    }
    if !academic_year_filter_uuids.is_empty() {
        if academic_year_filter_uuids.len() == 1 {
            select = select.filter(entity_mod::Column::AcademicYearId.eq(academic_year_filter_uuids[0]));
        } else {
            select = select.filter(entity_mod::Column::AcademicYearId.is_in(academic_year_filter_uuids));
        }
    }

    let mut status_filter_uuids = Vec::new();
    if let Some(raw_statuses) = query.status_ids.as_deref().or(query.status_id.as_deref()) {
        for val in raw_statuses.split(',') {
            let val_trimmed = val.trim();
            if !val_trimmed.is_empty()
                && let Ok(u) = Uuid::parse_str(val_trimmed) {
                    status_filter_uuids.push(u);
                }
        }
    }
    if !status_filter_uuids.is_empty() {
        if status_filter_uuids.len() == 1 {
            select = select.filter(entity_mod::Column::StatusId.eq(status_filter_uuids[0]));
        } else {
            select = select.filter(entity_mod::Column::StatusId.is_in(status_filter_uuids));
        }
    }

    let sort_by = query
        .sort_by
        .as_deref()
        .or(query.order_by.as_deref())
        .or(query.column.as_deref())
        .unwrap_or("code");
    let sort_dir = query
        .sort_dir
        .as_deref()
        .or(query.order_dir.as_deref())
        .unwrap_or("asc");

    let is_desc = sort_dir.eq_ignore_ascii_case("desc");

    select = match sort_by.trim().to_ascii_lowercase().as_str() {
        "code" | "nim" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::Code).order_by_asc(entity_mod::Column::Name)
            } else {
                select.order_by_asc(entity_mod::Column::Code).order_by_asc(entity_mod::Column::Name)
            }
        }
        "name" | "nama" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::Name).order_by_asc(entity_mod::Column::Code)
            } else {
                select.order_by_asc(entity_mod::Column::Name).order_by_asc(entity_mod::Column::Code)
            }
        }
        "registered" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::Registered)
            } else {
                select.order_by_asc(entity_mod::Column::Registered)
            }
        }
        "created_at" => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::CreatedAt)
            } else {
                select.order_by_asc(entity_mod::Column::CreatedAt)
            }
        }
        _ => {
            if is_desc {
                select.order_by_desc(entity_mod::Column::Code)
            } else {
                select.order_by_asc(entity_mod::Column::Code)
            }
        }
    };

    let paginator = select.paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let (units_map, statuses_map, academic_years_map, curriculums_map, selection_types_map) =
        load_relations_for_students(db, &items).await?;

    let data = items.into_iter().map(|item| {
        to_response(
            item,
            &units_map,
            &statuses_map,
            &academic_years_map,
            &curriculums_map,
            &selection_types_map,
        )
    }).collect();

    Ok(Json(PaginatedStudentResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 500))]
pub async fn list_distinct_academic_years(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<DistinctAcademicYearResponse>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DistinctAcademicYearQuery = req.parse_queries().unwrap_or_default();

    let scope = DataScope::resolve(db, depot).await?;
    let mut select = scope.apply(
        entity_mod::Entity::find()
            .filter(entity_mod::Column::DeletedAt.is_null())
            .filter(entity_mod::Column::AcademicYearId.ne(Uuid::nil())),
    );

    if let Some(unit_id) = query.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    } else if let Some(institution_id) = query.institution_id {
        let matching_unit_ids: Vec<Uuid> = crate::models::institution::master::units::Entity::find()
            .filter(crate::models::institution::master::units::Column::InstitutionId.eq(institution_id))
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|u| u.id)
            .collect();

        if matching_unit_ids.is_empty() {
            return Ok(Json(vec![]));
        }
        select = select.filter(entity_mod::Column::UnitId.is_in(matching_unit_ids));
    }

    let year_ids: Vec<Uuid> = select
        .select_only()
        .column(entity_mod::Column::AcademicYearId)
        .group_by(entity_mod::Column::AcademicYearId)
        .into_tuple::<(Uuid,)>()
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|(id,)| id)
        .collect();

    if year_ids.is_empty() {
        return Ok(Json(vec![]));
    }

    let items = crate::models::academic::general::reference::academic_years::Entity::find()
        .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(year_ids))
        .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
        .order_by_desc(crate::models::academic::general::reference::academic_years::Column::Code)
        .order_by_desc(crate::models::academic::general::reference::academic_years::Column::Name)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let response = items
        .into_iter()
        .map(|ay| DistinctAcademicYearResponse {
            id: ay.id,
            code: ay.code,
            year: ay.year,
            name: ay.name,
            feeder_name: Some(ay.feeder_name),
            is_active: ay.is_active,
        })
        .collect();

    Ok(Json(response))
}

pub async fn find_student_response_by_id(
    db: &DatabaseConnection,
    id: Uuid,
) -> Result<Option<StudentResponse>, StatusError> {
    find_student_response_by_id_ext(db, id, true).await
}

pub async fn find_student_response_by_id_ext(
    db: &DatabaseConnection,
    id: Uuid,
    include_activities: bool,
) -> Result<Option<StudentResponse>, StatusError> {
    let item = match entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    {
        Some(item) => item,
        None => return Ok(None),
    };

    // 1. Belongs to: individual
    let individual = if item.individual_id != Uuid::nil() {
        crate::models::person::master::individual::Entity::find_by_id(item.individual_id)
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
            }))
    } else {
        None
    };

    // 2. Belongs to: unit
    let unit = if item.unit_id != Uuid::nil() {
        crate::models::institution::master::units::Entity::find_by_id(item.unit_id)
            .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|u| crate::dtos::institution::master::units::UnitResponse {
                id: u.id,
                code: u.code,
                name: u.name,
                is_active: u.is_active,
                unit_type_id: u.unit_type_id,
                institution_id: u.institution_id,
                parent_id: u.parent_id,
                education_id: u.education_id,
                feeder_id: u.feeder_id,
                lft: u.lft,
                rght: u.rght,
                created_at: u.created_at,
                updated_at: u.updated_at,
                sync_at: u.sync_at,
                deleted_at: u.deleted_at,
                created_by: u.created_by,
                updated_by: u.updated_by,
                ..Default::default()
            })
    } else {
        None
    };
    let unit_name = unit.as_ref().and_then(|u| u.name.clone());
    let unit_code = unit.as_ref().and_then(|u| u.code.clone());

    // 3. Belongs to: status
    let status = if item.status_id != Uuid::nil() {
        crate::models::academic::student::reference::statuses::Entity::find_by_id(item.status_id)
            .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|s| crate::dtos::common::reference::ReferenceResponse {
                id: s.id,
                code: s.code,
                alphabet_code: s.alphabet_code.unwrap_or_default(),
                name: s.name,
                created_at: s.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: s.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: s.deleted_at.map(|d| d.naive_utc()),
                sync_at: s.sync_at,
                created_by: s.created_by,
                updated_by: s.updated_by,
            })
    } else {
        None
    };
    let status_name = status.as_ref().map(|s| s.name.clone());

    // 4. Belongs to: academic_year
    let academic_year = if item.academic_year_id != Uuid::nil() {
        crate::models::academic::general::reference::academic_years::Entity::find_by_id(item.academic_year_id)
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|a| crate::dtos::common::reference::ReferenceResponse {
                id: a.id,
                code: a.code,
                alphabet_code: String::new(),
                name: a.name,
                created_at: a.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: a.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: a.deleted_at,
                sync_at: a.sync_at,
                created_by: a.created_by,
                updated_by: a.updated_by,
            })
    } else {
        None
    };
    let academic_year_name = academic_year.as_ref().map(|a| a.name.clone());

    // 5. Belongs to: selection_type
    let selection_type = if item.selection_type_id != Uuid::nil() {
        crate::models::academic::student::reference::selection_types::Entity::find_by_id(item.selection_type_id)
            .filter(crate::models::academic::student::reference::selection_types::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|st| crate::dtos::common::reference::ReferenceResponse {
                id: st.id,
                code: st.code,
                alphabet_code: st.alphabet_code.unwrap_or_default(),
                name: st.name,
                created_at: st.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: st.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: st.deleted_at.map(|d| d.naive_utc()),
                sync_at: st.sync_at,
                created_by: st.created_by,
                updated_by: st.updated_by,
            })
    } else {
        None
    };
    let selection_type_name = selection_type.as_ref().map(|st| st.name.clone());

    // 6. Belongs to: registration
    let registration = if item.registration_id != Uuid::nil() {
        crate::models::academic::student::reference::registrations::Entity::find_by_id(item.registration_id)
            .filter(crate::models::academic::student::reference::registrations::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|r| crate::dtos::common::reference::ReferenceResponse {
                id: r.id,
                code: r.code,
                alphabet_code: r.alphabet_code.unwrap_or_default(),
                name: r.name,
                created_at: r.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: r.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: r.deleted_at.map(|d| d.naive_utc()),
                sync_at: r.sync_at,
                created_by: r.created_by,
                updated_by: r.updated_by,
            })
    } else {
        None
    };

    // 7. Belongs to: resign_status
    let resign_status = if item.resign_status_id != Uuid::nil() {
        crate::models::academic::student::reference::resign_statuses::Entity::find_by_id(item.resign_status_id)
            .filter(crate::models::academic::student::reference::resign_statuses::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|rs| crate::dtos::common::reference::ReferenceResponse {
                id: rs.id,
                code: rs.code,
                alphabet_code: rs.alphabet_code.unwrap_or_default(),
                name: rs.name,
                created_at: rs.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                updated_at: rs.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                deleted_at: rs.deleted_at.map(|d| d.naive_utc()),
                sync_at: rs.sync_at,
                created_by: rs.created_by,
                updated_by: rs.updated_by,
            })
    } else {
        None
    };

    // 8. Belongs to: concentration
    let concentration = if item.concentration_id != Uuid::nil() {
        crate::models::academic::course::master::concentrations::Entity::find_by_id(item.concentration_id)
            .filter(crate::models::academic::course::master::concentrations::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|c| crate::dtos::academic::course::master::concentrations::ConcentrationResponse {
                id: c.id,
                code: c.code,
                name: c.name,
                unit_id: c.unit_id,
                created_at: c.created_at,
                updated_at: c.updated_at,
                deleted_at: c.deleted_at,
                sync_at: c.sync_at,
                created_by: c.created_by,
                updated_by: c.updated_by,
            })
    } else {
        None
    };

    // 9. Belongs to: curriculum
    let curriculum = if item.curriculum_id != Uuid::nil() {
        crate::models::academic::course::master::curriculums::Entity::find_by_id(item.curriculum_id)
            .filter(crate::models::academic::course::master::curriculums::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|c| crate::dtos::academic::course::master::curriculums::CurriculumResponse {
                id: c.id,
                name: c.name,
                unit_id: c.unit_id,
                academic_year_id: c.academic_year_id,
                curriculum_type_id: c.curriculum_type_id,
                total_credit: c.total_credit,
                mandatory_course_credit: c.mandatory_course_credit,
                optional_course_credit: c.optional_course_credit,
                feeder_id: c.feeder_id,
                created_at: c.created_at,
                updated_at: c.updated_at,
                deleted_at: c.deleted_at,
                sync_at: c.sync_at,
                created_by: c.created_by,
                updated_by: c.updated_by,
                start_date: c.start_date,
                end_date: c.end_date,
                is_active: c.is_active,
                unit: None,
                academic_year: None,
                curriculum_type: None,
                curriculum_details: None,
                recognitions: None,
                students: None,
            })
    } else {
        None
    };
    let curriculum_name = curriculum.as_ref().map(|c| c.name.clone());

    // 10. Belongs to: class_code
    let class_code = if item.class_code_id != Uuid::nil() {
        crate::models::academic::campaign::transaction::class_codes::Entity::find_by_id(item.class_code_id)
            .filter(crate::models::academic::campaign::transaction::class_codes::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|cc| crate::dtos::academic::campaign::transaction::class_codes::ClassCodeResponse {
                id: cc.id,
                code: cc.code,
                alphabet_code: cc.alphabet_code,
                name: cc.name,
                activity_id: cc.activity_id,
                start_effective_date: cc.start_effective_date,
                end_effective_date: cc.end_effective_date,
                created_at: cc.created_at,
                updated_at: cc.updated_at,
                deleted_at: cc.deleted_at,
                sync_at: cc.sync_at,
                created_by: cc.created_by,
                updated_by: cc.updated_by,
                unit_id: cc.unit_id,
                capacity: cc.capacity,
            })
    } else {
        None
    };

    // 11. Belongs to: finance
    let finance = if let Some(fid) = item.finance_id {
        if fid != Uuid::nil() {
            crate::models::academic::student::reference::finances::Entity::find_by_id(fid)
                .filter(crate::models::academic::student::reference::finances::Column::DeletedAt.is_null())
                .one(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
                .map(|f| crate::dtos::common::reference::ReferenceResponse {
                    id: f.id,
                    code: f.code,
                    alphabet_code: f.alphabet_code.unwrap_or_default(),
                    name: f.name,
                    created_at: f.created_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                    updated_at: f.updated_at.unwrap_or_else(|| chrono::Utc::now().naive_utc()),
                    deleted_at: f.deleted_at.map(|d| d.naive_utc()),
                    sync_at: f.sync_at,
                    created_by: f.created_by,
                    updated_by: f.updated_by,
                })
        } else {
            None
        }
    } else {
        None
    };

    // 12. Has many: student_activities
    let student_activities = if include_activities {
        Some(crate::controllers::academic::student::campaign::student_activities::find_student_activities_by_student_id(db, item.id).await?)
    } else {
        None
    };

    Ok(Some(StudentResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        selection_type_id: item.selection_type_id,
        registered: item.registered,
        individual_id: item.individual_id,
        status_id: item.status_id,
        unit_id: item.unit_id,
        academic_year_id: item.academic_year_id,
        registration_id: item.registration_id,
        nisn: item.nisn,
        resign_status_id: item.resign_status_id,
        concentration_id: item.concentration_id,
        curriculum_id: item.curriculum_id,
        class_code_id: item.class_code_id,
        transfer_code: item.transfer_code,
        transfer_unit_id: item.transfer_unit_id,
        id_mahasiswa: item.id_mahasiswa,
        id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
        finance_fee: item.finance_fee,
        finance_id: item.finance_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        unit_name,
        unit_code,
        status_name,
        academic_year_name,
        curriculum_name,
        selection_type_name,
        selection_type,
        individual,
        status,
        unit,
        academic_year,
        registration,
        resign_status,
        concentration,
        curriculum,
        class_code,
        finance,
        student_activities,
    }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let scope = DataScope::resolve(db, depot).await?;
    if !scope.is_visible::<entity_mod::Entity, _>(db, id).await? {
        return Err(StatusError::not_found().brief("Student not found"));
    }
    let res = find_student_response_by_id(db, id)
        .await?
        .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

    Ok(Json(res))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 403, 500))]
pub async fn store(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateStudentRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let scope = DataScope::resolve(db, depot).await?;
        if !scope.allows_unit(payload.unit_id) {
            return Err(StatusError::forbidden().brief("Cannot create a student outside your unit"));
        }

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        selection_type_id: Set(payload.selection_type_id),
        registered: Set(payload.registered),
        individual_id: Set(payload.individual_id),
        status_id: Set(payload.status_id),
        unit_id: Set(payload.unit_id),
        academic_year_id: Set(payload.academic_year_id),
        registration_id: Set(payload.registration_id),
        nisn: Set(payload.nisn),
        resign_status_id: Set(payload.resign_status_id),
        concentration_id: Set(payload.concentration_id),
        curriculum_id: Set(payload.curriculum_id),
        class_code_id: Set(payload.class_code_id),
        transfer_code: Set(payload.transfer_code),
        transfer_unit_id: Set(payload.transfer_unit_id),
        id_mahasiswa: Set(payload.id_mahasiswa),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        finance_fee: Set(payload.finance_fee),
        finance_id: Set(payload.finance_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let res = find_student_response_by_id(db, item.id)
            .await?
            .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

        Ok(Json(res))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 403, 404, 500))]
pub async fn update(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<StudentResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateStudentRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

        let scope = DataScope::resolve(db, depot).await?;
        if !scope.is_visible::<entity_mod::Entity, _>(db, existing.id).await? {
            return Err(StatusError::not_found().brief("Student not found"));
        }
        if let Some(unit_id) = payload.unit_id
            && unit_id != existing.unit_id
            && !scope.allows_unit(unit_id)
        {
            return Err(StatusError::forbidden().brief("Cannot move a student outside your unit"));
        }

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(selection_type_id) = payload.selection_type_id {
            active_model.selection_type_id = Set(selection_type_id);
        }
    if let Some(registered) = payload.registered {
            active_model.registered = Set(registered);
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(status_id) = payload.status_id {
            active_model.status_id = Set(status_id);
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(unit_id);
        }
    if let Some(academic_year_id) = payload.academic_year_id {
            active_model.academic_year_id = Set(academic_year_id);
        }
    if let Some(registration_id) = payload.registration_id {
            active_model.registration_id = Set(registration_id);
        }
    if let Some(nisn) = payload.nisn {
            active_model.nisn = Set(Some(nisn));
        }
    if let Some(resign_status_id) = payload.resign_status_id {
            active_model.resign_status_id = Set(resign_status_id);
        }
    if let Some(concentration_id) = payload.concentration_id {
            active_model.concentration_id = Set(concentration_id);
        }
    if let Some(curriculum_id) = payload.curriculum_id {
            active_model.curriculum_id = Set(curriculum_id);
        }
    if let Some(class_code_id) = payload.class_code_id {
            active_model.class_code_id = Set(class_code_id);
        }
    if let Some(transfer_code) = payload.transfer_code {
            active_model.transfer_code = Set(Some(transfer_code));
        }
    if let Some(transfer_unit_id) = payload.transfer_unit_id {
            active_model.transfer_unit_id = Set(transfer_unit_id);
        }
    if let Some(id_mahasiswa) = payload.id_mahasiswa {
            active_model.id_mahasiswa = Set(Some(id_mahasiswa));
        }
    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
            active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
        }
    if let Some(finance_fee) = payload.finance_fee {
            active_model.finance_fee = Set(Some(finance_fee));
        }
    if let Some(finance_id) = payload.finance_id {
            active_model.finance_id = Set(Some(finance_id));
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        let res = find_student_response_by_id(db, item.id)
            .await?
            .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

        Ok(Json(res))
}
#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 404, 500))]
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
            .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

        let scope = DataScope::resolve(db, depot).await?;
        if !scope.is_visible::<entity_mod::Entity, _>(db, existing.id).await? {
            return Err(StatusError::not_found().brief("Student not found"));
        }

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Student deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 500))]
pub async fn get_students_by_unit(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<StudentResponse>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .or_else(|| req.query::<String>("unit_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;

    let unit_id = Uuid::parse_str(&id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let scope = DataScope::resolve(db, depot).await?;
    let all_in_unit = crate::dtos::academic::student::master::students::list_students_by_unit(db, unit_id)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let visible_ids: std::collections::HashSet<Uuid> = scope
        .apply(entity_mod::Entity::find().filter(entity_mod::Column::UnitId.eq(unit_id)))
        .select_only()
        .column(entity_mod::Column::Id)
        .into_tuple::<Uuid>()
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .collect();
    let data: Vec<StudentResponse> = all_in_unit.into_iter().filter(|student| visible_ids.contains(&student.id)).collect();

    Ok(Json(data))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: StudentOptionRequest = req
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

    if let Some(unit_id) = payload.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
    }

    if let Some(academic_year_id) = payload.academic_year_id {
        select = select.filter(entity_mod::Column::AcademicYearId.eq(academic_year_id));
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
