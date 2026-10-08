use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, Condition, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::survey::master::bundle_question::{
    CreateBundleQuestionRequest, BundleQuestionQuery, BundleQuestionResponse,
    PaginatedBundleQuestionResponse, UpdateBundleQuestionRequest, BundleQuestionOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::academic::survey::master::bundle_question as entity_mod;
use crate::models::academic::survey::master::bundles as bundle_mod;
use crate::models::academic::survey::master::questions as question_mod;
use crate::middleware::auth::auth_user_id;

#[endpoint(tags("Academic - Survey - Master - BundleQuestion"), status_codes(200, 500))]
pub async fn list_bundle_question(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBundleQuestionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BundleQuestionQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| BundleQuestionResponse {
            id: item.id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedBundleQuestionResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Survey - Master - BundleQuestion"), status_codes(200, 400, 404, 500))]
pub async fn get_bundle_question(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BundleQuestionResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("BundleQuestion not found"))?;

    Ok(Json(BundleQuestionResponse {
            id: item.id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Survey - Master - BundleQuestion"), status_codes(200, 400, 500))]
pub async fn create_bundle_question(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BundleQuestionResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateBundleQuestionRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        bundle_id: Set(payload.bundle_id),
        question_id: Set(payload.question_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BundleQuestionResponse {
            id: item.id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Survey - Master - BundleQuestion"), status_codes(200, 400, 404, 500))]
pub async fn update_bundle_question(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BundleQuestionResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateBundleQuestionRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("BundleQuestion not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(bundle_id) = payload.bundle_id {
            active_model.bundle_id = Set(bundle_id);
        }
    if let Some(question_id) = payload.question_id {
            active_model.question_id = Set(question_id);
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BundleQuestionResponse {
            id: item.id,
            bundle_id: item.bundle_id,
            question_id: item.question_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Survey - Master - BundleQuestion"), status_codes(200, 400, 404, 500))]
pub async fn delete_bundle_question(
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
            .ok_or_else(|| StatusError::not_found().brief("BundleQuestion not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "BundleQuestion deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Academic - Survey - Master - BundleQuestion"), status_codes(200, 500))]
pub async fn options_bundle_question(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: BundleQuestionOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(bundle_id) = payload.bundle_id {
        select = select.filter(entity_mod::Column::BundleId.eq(bundle_id));
        is_scoped = true;
    }

    if let Some(question_id) = payload.question_id {
        select = select.filter(entity_mod::Column::QuestionId.eq(question_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let bundle_ids: Vec<Uuid> = bundle_mod::Entity::find()
                .filter(bundle_mod::Column::DeletedAt.is_null())
                .filter(bundle_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(bundle_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            let question_ids: Vec<Uuid> = question_mod::Entity::find()
                .filter(question_mod::Column::DeletedAt.is_null())
                .filter(question_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(question_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(
                Condition::any()
                    .add(entity_mod::Column::BundleId.is_in(bundle_ids))
                    .add(entity_mod::Column::QuestionId.is_in(question_ids)),
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

    let bundle_names: HashMap<Uuid, String> = bundle_mod::Entity::find()
        .filter(bundle_mod::Column::Id.is_in(items.iter().map(|item| item.bundle_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let question_names: HashMap<Uuid, String> = question_mod::Entity::find()
        .filter(question_mod::Column::Id.is_in(items.iter().map(|item| item.question_id).collect::<Vec<_>>()))
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
                bundle_names.get(&item.bundle_id).cloned(),
                question_names.get(&item.question_id).cloned(),
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
