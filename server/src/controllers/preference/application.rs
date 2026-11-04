use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder, Set};
use uuid::Uuid;

use crate::controllers::ai::require_administrator;
use crate::dtos::preference::application::{ApplicationPreferenceResponse, UpdateApplicationPreferenceRequest};
use crate::middleware::auth::auth_user_id;
use crate::models::preference::application as entity_mod;
use crate::services::ai::generation::{self, LlmBackend};

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

/// The backend the LLM should run on; the CPU when there is no row yet, the lookup fails or the value is unknown
async fn llm_backend(db: &DatabaseConnection) -> LlmBackend {
    match current(db).await {
        Ok(row) => row.and_then(|r| LlmBackend::parse(&r.llm_backend)).unwrap_or_default(),
        Err(e) => {
            tracing::warn!("Could not read application preference: {e}");
            LlmBackend::default()
        }
    }
}

/// Hands the backend preference to the generator; call before a model can be loaded (it applies to loads only)
pub async fn apply_backend_preference(db: &DatabaseConnection) {
    generation::set_backend(llm_backend(db).await);
}

fn response(row: Option<&entity_mod::Model>) -> ApplicationPreferenceResponse {
    ApplicationPreferenceResponse {
        is_llm_enable: row.is_some_and(|r| r.is_llm_enable),
        llm_backend: row.map_or(LlmBackend::default(), |r| LlmBackend::parse(&r.llm_backend).unwrap_or_default()).id().to_owned(),
        available_backends: LlmBackend::available().into_iter().map(|b| b.id().to_owned()).collect(),
    }
}

#[endpoint(tags("Preference - Application"), status_codes(200, 403, 500))]
pub async fn show(depot: &mut Depot) -> Result<Json<ApplicationPreferenceResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let row = current(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    Ok(Json(response(row.as_ref())))
}

/// Saves the settings. Turning the LLM on loads it on the next server start (or on the first question); the backend
/// setting applies to models loaded after that, so a model already in memory keeps its device until a restart.
#[endpoint(tags("Preference - Application"), status_codes(200, 400, 403, 500))]
pub async fn update(req: &mut Request, depot: &mut Depot) -> Result<Json<ApplicationPreferenceResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let payload: UpdateApplicationPreferenceRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    let backend = LlmBackend::parse(&payload.llm_backend)
        .ok_or_else(|| StatusError::bad_request().brief("Unknown LLM backend; use cpu, cuda or vulkan"))?;
    if !backend.supported() {
        return Err(StatusError::bad_request().brief(format!("This server build has no {} backend", backend.id())));
    }

    let now = Utc::now().naive_utc();
    let user = auth_user_id(depot);
    let existing = current(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let saved = match existing {
        Some(row) => {
            let mut active = entity_mod::ActiveModel::from(row);
            active.is_llm_enable = Set(payload.is_llm_enable);
            active.llm_backend = Set(backend.id().to_owned());
            active.updated_at = Set(Some(now));
            active.updated_by = Set(user);
            active.update(db).await
        }
        None => {
            entity_mod::ActiveModel {
                id: Set(Uuid::now_v7()),
                is_llm_enable: Set(payload.is_llm_enable),
                llm_backend: Set(backend.id().to_owned()),
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

    Ok(Json(response(Some(&saved))))
}
