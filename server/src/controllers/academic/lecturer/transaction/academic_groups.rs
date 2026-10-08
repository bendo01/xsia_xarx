use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, Condition, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::lecturer::transaction::academic_groups::{
    CreateAcademicGroupRequest, AcademicGroupQuery, AcademicGroupResponse,
    PaginatedAcademicGroupResponse, UpdateAcademicGroupRequest, AcademicGroupOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::lecturer::transaction::academic_groups as entity_mod;
use crate::models::academic::lecturer::master::lecturers as lecturer_mod;
use crate::models::academic::lecturer::reference::groups as group_mod;
use crate::middleware::auth::auth_user_id;

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicGroup"), status_codes(200, 500))]
pub async fn list_academic_groups(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedAcademicGroupResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: AcademicGroupQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(lecturer_id) = query.lecturer_id {
        select = select.filter(entity_mod::Column::LecturerId.eq(lecturer_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| AcademicGroupResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            group_id: item.group_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            ..Default::default()
    }).collect();

    Ok(Json(PaginatedAcademicGroupResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicGroup"), status_codes(200, 400, 404, 500))]
pub async fn get_academic_group(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<AcademicGroupResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("AcademicGroup not found"))?;

    Ok(Json(AcademicGroupResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            group_id: item.group_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            ..Default::default()
    }))
}#[endpoint(tags("Academic - Lecturer - Transaction - AcademicGroup"), status_codes(200, 400, 500))]
pub async fn create_academic_group(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AcademicGroupResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateAcademicGroupRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        decree_number: Set(payload.decree_number),
        decree_date: Set(payload.decree_date),
        lecturer_id: Set(payload.lecturer_id),
        group_id: Set(payload.group_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AcademicGroupResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            group_id: item.group_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            ..Default::default()
        }))
}

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicGroup"), status_codes(200, 400, 404, 500))]
pub async fn update_academic_group(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<AcademicGroupResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateAcademicGroupRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("AcademicGroup not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(decree_number) = payload.decree_number {
            active_model.decree_number = Set(Some(decree_number));
        }
    if let Some(decree_date) = payload.decree_date {
            active_model.decree_date = Set(Some(decree_date));
        }
    if let Some(lecturer_id) = payload.lecturer_id {
            active_model.lecturer_id = Set(lecturer_id);
        }
    if let Some(group_id) = payload.group_id {
            active_model.group_id = Set(group_id);
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(AcademicGroupResponse {
            id: item.id,
            decree_number: item.decree_number,
            decree_date: item.decree_date,
            lecturer_id: item.lecturer_id,
            group_id: item.group_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            start_date: item.start_date,
            end_date: item.end_date,
            ..Default::default()
        }))
}
#[endpoint(tags("Academic - Lecturer - Transaction - AcademicGroup"), status_codes(200, 400, 404, 500))]
pub async fn delete_academic_group(
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
            .ok_or_else(|| StatusError::not_found().brief("AcademicGroup not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "AcademicGroup deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Lecturer - Transaction - AcademicGroup"), status_codes(200, 500))]
pub async fn options_academic_groups(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: AcademicGroupOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(lecturer_id) = payload.lecturer_id {
        select = select.filter(entity_mod::Column::LecturerId.eq(lecturer_id));
        is_scoped = true;
    }

    if let Some(group_id) = payload.group_id {
        select = select.filter(entity_mod::Column::GroupId.eq(group_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let lecturer_ids: Vec<Uuid> = lecturer_mod::Entity::find()
                .filter(lecturer_mod::Column::DeletedAt.is_null())
                .filter(lecturer_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(lecturer_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let group_ids: Vec<Uuid> = group_mod::Entity::find()
                .filter(group_mod::Column::DeletedAt.is_null())
                .filter(group_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(group_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(
                Condition::any()
                    .add(entity_mod::Column::LecturerId.is_in(lecturer_ids))
                    .add(entity_mod::Column::GroupId.is_in(group_ids)),
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

    let lecturer_names: HashMap<Uuid, String> = lecturer_mod::Entity::find()
        .filter(lecturer_mod::Column::Id.is_in(items.iter().map(|item| item.lecturer_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name.unwrap_or_default()))
        .collect();

    let group_names: HashMap<Uuid, String> = group_mod::Entity::find()
        .filter(group_mod::Column::Id.is_in(items.iter().map(|item| item.group_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let mut data: Vec<OptionItem> = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: [
                lecturer_names.get(&item.lecturer_id).cloned(),
                group_names.get(&item.group_id).cloned(),
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
