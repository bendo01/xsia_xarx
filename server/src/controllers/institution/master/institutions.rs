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

use crate::dtos::institution::master::institutions::{
    CreateInstitutionRequest, InstitutionDetailResponse, InstitutionQuery, InstitutionResponse,
    PaginatedInstitutionResponse, UpdateInstitutionRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::institution::master::institutions as entity_mod;

#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 500))]
pub async fn list_institutions(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedInstitutionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: InstitutionQuery = req.parse_queries().unwrap_or_default();
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
                    .add(Expr::col(entity_mod::Column::Code).ilike(search_pattern.clone()))
                    .add(Expr::col(entity_mod::Column::AlphabetCode).ilike(search_pattern)),
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
            select = select.filter(
                Condition::any()
                    .add(Expr::col(entity_mod::Column::Code).ilike(search_pattern.clone()))
                    .add(Expr::col(entity_mod::Column::AlphabetCode).ilike(search_pattern)),
            );
        }
    }

    let mut category_filter_uuids = Vec::new();
    if let Some(raw_cats) = query.category_ids.as_deref().or(query.category_id.as_deref()) {
        for val in raw_cats.split(',') {
            let val_trimmed = val.trim();
            if !val_trimmed.is_empty()
                && let Ok(u) = Uuid::parse_str(val_trimmed) {
                    category_filter_uuids.push(u);
            }
        }
    }
    if !category_filter_uuids.is_empty() {
        select = select.filter(entity_mod::Column::CategoryId.is_in(category_filter_uuids));
    }

    let mut variety_filter_uuids = Vec::new();
    if let Some(raw_vars) = query.variety_ids.as_deref().or(query.variety_id.as_deref()) {
        for val in raw_vars.split(',') {
            let val_trimmed = val.trim();
            if !val_trimmed.is_empty()
                && let Ok(u) = Uuid::parse_str(val_trimmed) {
                    variety_filter_uuids.push(u);
            }
        }
    }
    if !variety_filter_uuids.is_empty() {
        select = select.filter(entity_mod::Column::VarietyId.is_in(variety_filter_uuids));
    }

    let sort_by = query
        .sort_by
        .as_deref()
        .or(query.order_by.as_deref())
        .or(query.column.as_deref())
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

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedInstitutionResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 404, 500))]
pub async fn get_institution(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<InstitutionDetailResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Institution not found"))?;

    let variety = item
        .find_related(crate::models::institution::reference::varieties::Entity)
        .filter(crate::models::institution::reference::varieties::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|v| crate::dtos::common::reference::ReferenceResponse {
            id: v.id,
            code: v.code,
            alphabet_code: v.alphabet_code,
            name: v.name,
            created_at: v.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
            updated_at: v.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
            deleted_at: v.deleted_at.map(|dt| dt.naive_utc()),
            sync_at: v.sync_at,
            created_by: v.created_by,
            updated_by: v.updated_by,
        });

    let category = item
        .find_related(crate::models::institution::reference::categories::Entity)
        .filter(crate::models::institution::reference::categories::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|c| crate::dtos::common::reference::ReferenceResponse {
            id: c.id,
            code: c.code,
            alphabet_code: c.alphabet_code,
            name: c.name,
            created_at: c.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
            updated_at: c.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
            deleted_at: c.deleted_at.map(|dt| dt.naive_utc()),
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
        });

    let country = item
        .find_related(crate::models::location::countries::Entity)
        .filter(crate::models::location::countries::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|c| crate::dtos::location::countries::CountryResponse {
            id: c.id,
            code: c.code,
            name: c.name,
            alpha2_code: c.alpha2_code,
            alpha3_code: c.alpha3_code,
            iso3166_2_code: c.iso3166_2_code,
            dikti_code: c.dikti_code,
            continent_id: c.continent_id,
            region_id: c.region_id,
            slug: c.slug,
            created_at: c.created_at,
            updated_at: c.updated_at,
            sync_at: c.sync_at,
            deleted_at: c.deleted_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
        });

    let academic_year = if let Some(ay_id) = item.academic_year_id {
        crate::models::academic::general::reference::academic_years::Entity::find_by_id(ay_id)
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|a| crate::dtos::common::reference::ReferenceResponse {
                id: a.id,
                code: a.code,
                alphabet_code: a.feeder_name,
                name: a.name,
                created_at: a.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
                updated_at: a.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
                deleted_at: a.deleted_at,
                sync_at: a.sync_at,
                created_by: a.created_by,
                updated_by: a.updated_by,
            })
    } else {
        None
    };

    let parent = if let Some(p_id) = item.parent_id {
        entity_mod::Entity::find_by_id(p_id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|p| InstitutionResponse {
                id: p.id,
                code: p.code,
                name: p.name,
                alphabet_code: p.alphabet_code,
                is_active: p.is_active,
                variety_id: p.variety_id,
                category_id: p.category_id,
                country_id: p.country_id,
                parent_id: p.parent_id,
                feeder_id: p.feeder_id,
                academic_year_id: p.academic_year_id,
                created_at: p.created_at,
                updated_at: p.updated_at,
                deleted_at: p.deleted_at,
                sync_at: p.sync_at,
                created_by: p.created_by,
                updated_by: p.updated_by,
            })
    } else {
        None
    };

    let feeder = if let Some(f_id) = item.feeder_id {
        entity_mod::Entity::find_by_id(f_id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|f| InstitutionResponse {
                id: f.id,
                code: f.code,
                name: f.name,
                alphabet_code: f.alphabet_code,
                is_active: f.is_active,
                variety_id: f.variety_id,
                category_id: f.category_id,
                country_id: f.country_id,
                parent_id: f.parent_id,
                feeder_id: f.feeder_id,
                academic_year_id: f.academic_year_id,
                created_at: f.created_at,
                updated_at: f.updated_at,
                deleted_at: f.deleted_at,
                sync_at: f.sync_at,
                created_by: f.created_by,
                updated_by: f.updated_by,
            })
    } else {
        None
    };

    let units = item
        .find_related(crate::models::institution::master::units::Entity)
        .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
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
        })
        .collect();

    let employees = item
        .find_related(crate::models::institution::master::employees::Entity)
        .filter(crate::models::institution::master::employees::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|e| crate::dtos::institution::master::employees::EmployeeResponse {
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
        .collect();

    let lecturers = item
        .find_related(crate::models::academic::lecturer::master::lecturers::Entity)
        .filter(crate::models::academic::lecturer::master::lecturers::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|l| crate::dtos::academic::lecturer::master::lecturers::LecturerResponse {
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
        })
        .collect();

    let candidates = item
        .find_related(crate::models::academic::candidate::master::candidates::Entity)
        .filter(crate::models::academic::candidate::master::candidates::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| crate::dtos::academic::candidate::master::candidates::CandidateResponse {
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
        .collect();

    Ok(Json(InstitutionDetailResponse {
        institution: InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
        },
        variety,
        category,
        country,
        academic_year,
        parent,
        feeder,
        units,
        employees,
        lecturers,
        candidates,
    }))
}
#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 500))]
pub async fn create_institution(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<InstitutionResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateInstitutionRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        alphabet_code: Set(payload.alphabet_code),
        is_active: Set(payload.is_active),
        variety_id: Set(payload.variety_id),
        category_id: Set(payload.category_id),
        country_id: Set(payload.country_id),
        parent_id: Set(payload.parent_id),
        feeder_id: Set(payload.feeder_id),
        academic_year_id: Set(payload.academic_year_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 404, 500))]
pub async fn update_institution(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<InstitutionResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateInstitutionRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Institution not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(alphabet_code) = payload.alphabet_code {
            active_model.alphabet_code = Set(Some(alphabet_code));
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    if let Some(variety_id) = payload.variety_id {
            active_model.variety_id = Set(variety_id);
        }
    if let Some(category_id) = payload.category_id {
            active_model.category_id = Set(category_id);
        }
    if let Some(country_id) = payload.country_id {
            active_model.country_id = Set(country_id);
        }
    if let Some(parent_id) = payload.parent_id {
            active_model.parent_id = Set(Some(parent_id));
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(academic_year_id) = payload.academic_year_id {
            active_model.academic_year_id = Set(Some(academic_year_id));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(InstitutionResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            alphabet_code: item.alphabet_code,
            is_active: item.is_active,
            variety_id: item.variety_id,
            category_id: item.category_id,
            country_id: item.country_id,
            parent_id: item.parent_id,
            feeder_id: item.feeder_id,
            academic_year_id: item.academic_year_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Institution - Master - Institution"), status_codes(200, 400, 404, 500))]
pub async fn delete_institution(
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
            .ok_or_else(|| StatusError::not_found().brief("Institution not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Institution deleted successfully".to_string(),
        }))
}
