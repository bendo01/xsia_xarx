use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, Condition, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::candidate::transaction::candidate_unit_choices::{
    CreateCandidateUnitChoiceRequest, CandidateUnitChoiceQuery, CandidateUnitChoiceResponse,
    PaginatedCandidateUnitChoiceResponse, UpdateCandidateUnitChoiceRequest,
    CandidateUnitChoiceOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::candidate::transaction::candidate_unit_choices as entity_mod;
use crate::models::academic::candidate::master::candidates as candidate_mod;
use crate::models::institution::master::units as unit_mod;
use crate::middleware::auth::auth_user_id;

#[endpoint(tags("Academic - Candidate - Transaction - CandidateUnitChoice"), status_codes(200, 500))]
pub async fn list_candidate_unit_choices(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCandidateUnitChoiceResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CandidateUnitChoiceQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| CandidateUnitChoiceResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            unit_id: item.unit_id,
            student_registration_id: item.student_registration_id,
            registration_category_id: item.registration_category_id,
            phase_id: item.phase_id,
            priority: item.priority,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedCandidateUnitChoiceResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Candidate - Transaction - CandidateUnitChoice"), status_codes(200, 400, 404, 500))]
pub async fn get_candidate_unit_choice(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CandidateUnitChoiceResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("CandidateUnitChoice not found"))?;

    Ok(Json(CandidateUnitChoiceResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            unit_id: item.unit_id,
            student_registration_id: item.student_registration_id,
            registration_category_id: item.registration_category_id,
            phase_id: item.phase_id,
            priority: item.priority,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Candidate - Transaction - CandidateUnitChoice"), status_codes(200, 400, 500))]
pub async fn create_candidate_unit_choice(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CandidateUnitChoiceResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateCandidateUnitChoiceRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        candidate_id: Set(payload.candidate_id),
        unit_id: Set(payload.unit_id),
        student_registration_id: Set(payload.student_registration_id),
        registration_category_id: Set(payload.registration_category_id),
        phase_id: Set(payload.phase_id),
        priority: Set(payload.priority),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CandidateUnitChoiceResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            unit_id: item.unit_id,
            student_registration_id: item.student_registration_id,
            registration_category_id: item.registration_category_id,
            phase_id: item.phase_id,
            priority: item.priority,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Candidate - Transaction - CandidateUnitChoice"), status_codes(200, 400, 404, 500))]
pub async fn update_candidate_unit_choice(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CandidateUnitChoiceResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCandidateUnitChoiceRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("CandidateUnitChoice not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(candidate_id) = payload.candidate_id {
            active_model.candidate_id = Set(candidate_id);
        }
    if let Some(unit_id) = payload.unit_id {
            active_model.unit_id = Set(Some(unit_id));
        }
    if let Some(student_registration_id) = payload.student_registration_id {
            active_model.student_registration_id = Set(Some(student_registration_id));
        }
    if let Some(registration_category_id) = payload.registration_category_id {
            active_model.registration_category_id = Set(Some(registration_category_id));
        }
    if let Some(phase_id) = payload.phase_id {
            active_model.phase_id = Set(Some(phase_id));
        }
    if let Some(priority) = payload.priority {
            active_model.priority = Set(priority);
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CandidateUnitChoiceResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            unit_id: item.unit_id,
            student_registration_id: item.student_registration_id,
            registration_category_id: item.registration_category_id,
            phase_id: item.phase_id,
            priority: item.priority,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Candidate - Transaction - CandidateUnitChoice"), status_codes(200, 400, 404, 500))]
pub async fn delete_candidate_unit_choice(
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
            .ok_or_else(|| StatusError::not_found().brief("CandidateUnitChoice not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "CandidateUnitChoice deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Candidate - Transaction - CandidateUnitChoice"), status_codes(200, 500))]
pub async fn options_candidate_unit_choices(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CandidateUnitChoiceOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(candidate_id) = payload.candidate_id {
        select = select.filter(entity_mod::Column::CandidateId.eq(candidate_id));
        is_scoped = true;
    }

    if let Some(unit_id) = payload.unit_id {
        select = select.filter(entity_mod::Column::UnitId.eq(unit_id));
        is_scoped = true;
    }

    if let Some(phase_id) = payload.phase_id {
        select = select.filter(entity_mod::Column::PhaseId.eq(phase_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let candidate_ids: Vec<Uuid> = candidate_mod::Entity::find()
                .filter(candidate_mod::Column::DeletedAt.is_null())
                .filter(candidate_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(candidate_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let unit_ids: Vec<Uuid> = unit_mod::Entity::find()
                .filter(unit_mod::Column::DeletedAt.is_null())
                .filter(unit_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(unit_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(
                Condition::any()
                    .add(entity_mod::Column::CandidateId.is_in(candidate_ids))
                    .add(entity_mod::Column::UnitId.is_in(unit_ids)),
            );
        }
    }

    // Unscoped requests are capped; slim-select narrows the list through `search`.
    if !is_scoped {
        select = select.limit(100);
    }

    let items = select
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let candidate_names: HashMap<Uuid, String> = candidate_mod::Entity::find()
        .filter(candidate_mod::Column::Id.is_in(items.iter().map(|item| item.candidate_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let unit_names: HashMap<Uuid, String> = unit_mod::Entity::find()
        .filter(unit_mod::Column::Id.is_in(items.iter().filter_map(|item| item.unit_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name.unwrap_or_default()))
        .collect();

    let mut data: Vec<OptionItem> = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: [
                candidate_names.get(&item.candidate_id).cloned(),
                item.unit_id.and_then(|id| unit_names.get(&id).cloned()),
            ]
            .into_iter()
            .flatten()
            .collect::<Vec<_>>()
            .join(" - "),
        })
        .collect();
    data.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(Json(data))
}
