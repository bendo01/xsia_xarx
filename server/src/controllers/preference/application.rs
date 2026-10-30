use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{ActiveModelTrait, IntoActiveModel, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::controllers::ai::require_administrator;
use crate::dtos::preference::application::{ApplicationPreferenceResponse, UpdateApplicationPreferenceRequest};
use crate::middleware::auth::auth_user_id;
use crate::models::preference::application as entity_mod;

async fn current(db: &DatabaseConnection) -> Result<Option<entity_mod::Model>, sea_orm::DbErr> {
    entity_mod::Entity::find()
        .filter(entity_mod::Column::DeletedAt.is_null())
        .order_by_asc(entity_mod::Column::CreatedAt)
        .one(db)
        .await
}

/// Whether the LLM and chatbot are switched on; false when there is no row yet or the lookup fails
pub async fn is_llm_enabled(db: &DatabaseConnection) -> bool {
    match current(db).await {
        Ok(row) => row.is_some_and(|r| r.is_llm_enable),
        Err(e) => {
            tracing::warn!("Could not read application preference: {e}");
            false
        }
    }
}

#[endpoint(tags("Preference - Application"), status_codes(200, 403, 500))]
pub async fn show(depot: &mut Depot) -> Result<Json<ApplicationPreferenceResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let row = current(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    Ok(Json(ApplicationPreferenceResponse { is_llm_enable: row.is_some_and(|r| r.is_llm_enable) }))
}

/// Saves the settings. Turning the LLM on loads it on the next server start (or on the first question).
#[endpoint(tags("Preference - Application"), status_codes(200, 400, 403, 500))]
pub async fn update(req: &mut Request, depot: &mut Depot) -> Result<Json<ApplicationPreferenceResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let payload: UpdateApplicationPreferenceRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    let now = Utc::now().naive_utc();
    let user = auth_user_id(depot);
    let existing = current(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let saved = match existing {
        Some(row) => {
            let mut active = row.into_active_model();
            active.is_llm_enable = Set(payload.is_llm_enable);
            active.updated_at = Set(Some(now));
            active.updated_by = Set(user);
            active.update(db).await
        }
        None => {
            entity_mod::ActiveModel {
                id: Set(Uuid::now_v7()),
                is_llm_enable: Set(payload.is_llm_enable),
                created_at: Set(Some(now)),
                updated_at: Set(Some(now)),
                created_by: Set(user),
                updated_by: Set(user),
                ..Default::default()
            }
            .insert(db)
            .await
        }
    }
    .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(ApplicationPreferenceResponse { is_llm_enable: saved.is_llm_enable }))
}
