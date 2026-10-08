use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, TransactionTrait, Condition, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::adviser::counsellors::{
    CreateCounsellorRequest, CounsellorQuery, CounsellorResponse, PaginatedCounsellorResponse,
    UpdateCounsellorRequest, CounsellorOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::student::adviser::counsellors as entity_mod;
use crate::models::academic::student::master::students as student_mod;
use crate::models::academic::lecturer::master::lecturers as lecturer_mod;
use crate::middleware::auth::auth_user_id;
use crate::services::auth::data_scope::DataScope;

#[endpoint(tags("Academic - Student - Adviser - Counsellor"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCounsellorResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let scope = DataScope::resolve(db, depot).await?;

    let query: CounsellorQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = scope.apply(entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null()));

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| CounsellorResponse {
            id: item.id,
            decree_id: item.decree_id,
            student_id: item.student_id,
            lecturer_id: item.lecturer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedCounsellorResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Adviser - Counsellor"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CounsellorResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let scope = DataScope::resolve(db, depot).await?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = scope.apply(entity_mod::Entity::find_by_id(id))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Counsellor not found"))?;

    Ok(Json(CounsellorResponse {
            id: item.id,
            decree_id: item.decree_id,
            student_id: item.student_id,
            lecturer_id: item.lecturer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Student - Adviser - Counsellor"), status_codes(200, 400, 500))]
pub async fn store(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CounsellorResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;
        let scope = DataScope::resolve(db, depot).await?;

        let payload: CreateCounsellorRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        decree_id: Set(payload.decree_id),
        student_id: Set(payload.student_id),
        lecturer_id: Set(payload.lecturer_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

        let txn = db.begin().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        let item = active_model.insert(&txn).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        scope.ensure_visible::<entity_mod::Entity, _>(&txn, item.id).await?;
        txn.commit().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CounsellorResponse {
            id: item.id,
            decree_id: item.decree_id,
            student_id: item.student_id,
            lecturer_id: item.lecturer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Student - Adviser - Counsellor"), status_codes(200, 400, 404, 500))]
pub async fn update(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CounsellorResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;
        let scope = DataScope::resolve(db, depot).await?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCounsellorRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = scope.apply(entity_mod::Entity::find_by_id(id))
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Counsellor not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(decree_id) = payload.decree_id {
            active_model.decree_id = Set(decree_id);
        }
    if let Some(student_id) = payload.student_id {
            active_model.student_id = Set(student_id);
        }
    if let Some(lecturer_id) = payload.lecturer_id {
            active_model.lecturer_id = Set(lecturer_id);
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let txn = db.begin().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        let item = active_model.update(&txn).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        scope.ensure_visible::<entity_mod::Entity, _>(&txn, item.id).await?;
        txn.commit().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CounsellorResponse {
            id: item.id,
            decree_id: item.decree_id,
            student_id: item.student_id,
            lecturer_id: item.lecturer_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Student - Adviser - Counsellor"), status_codes(200, 400, 404, 500))]
pub async fn delete(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;
        let scope = DataScope::resolve(db, depot).await?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let existing = scope.apply(entity_mod::Entity::find_by_id(id))
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Counsellor not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Counsellor deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Student - Adviser - Counsellor"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CounsellorOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(decree_id) = payload.decree_id {
        select = select.filter(entity_mod::Column::DecreeId.eq(decree_id));
        is_scoped = true;
    }

    if let Some(student_id) = payload.student_id {
        select = select.filter(entity_mod::Column::StudentId.eq(student_id));
        is_scoped = true;
    }

    if let Some(lecturer_id) = payload.lecturer_id {
        select = select.filter(entity_mod::Column::LecturerId.eq(lecturer_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let student_ids: Vec<Uuid> = student_mod::Entity::find()
                .filter(student_mod::Column::DeletedAt.is_null())
                .filter(student_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(student_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let lecturer_ids: Vec<Uuid> = lecturer_mod::Entity::find()
                .filter(lecturer_mod::Column::DeletedAt.is_null())
                .filter(lecturer_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(lecturer_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(
                Condition::any()
                    .add(entity_mod::Column::StudentId.is_in(student_ids))
                    .add(entity_mod::Column::LecturerId.is_in(lecturer_ids)),
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

    let student_names: HashMap<Uuid, String> = student_mod::Entity::find()
        .filter(student_mod::Column::Id.is_in(items.iter().map(|item| item.student_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let lecturer_names: HashMap<Uuid, String> = lecturer_mod::Entity::find()
        .filter(lecturer_mod::Column::Id.is_in(items.iter().map(|item| item.lecturer_id).collect::<Vec<_>>()))
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
                student_names.get(&item.student_id).cloned(),
                lecturer_names.get(&item.lecturer_id).cloned(),
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
