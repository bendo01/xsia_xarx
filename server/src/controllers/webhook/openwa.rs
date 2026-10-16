use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set, SqlErr};
use uuid::Uuid;
use validator::Validate;

use crate::config::openwa::OpenwaConfig;
use crate::dtos::webhook::openwa::{OpenWaEventPayload, OpenWaWebhookResponse};
use crate::models::webhook::open_wa_event as entity_mod;

use super::signature::verify_hmac;
pub use super::signature::sign;

/// Header carrying `sha256=<hex HMAC-SHA256 of the raw body, keyed with the webhook secret>`
pub const SIGNATURE_HEADER: &str = "x-openwa-signature";

async fn find_by_idempotency_key(
    db: &DatabaseConnection,
    key: &str,
) -> Result<Option<entity_mod::Model>, StatusError> {
    entity_mod::Entity::find()
        .filter(entity_mod::Column::IdempotencyKey.eq(key))
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))
}

/// Receive an event from OpenWA and store it
#[endpoint(tags("Webhook - OpenWA"), status_codes(200, 400, 401, 500, 503))]
pub async fn receive(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<OpenWaWebhookResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    // Settings injected by `router_with_config` win; otherwise read the active
    // `preference.what_apps` record, falling back to the environment.
    let config = match depot.get_typed::<OpenwaConfig>() {
        Ok(config) => config.clone(),
        Err(_) => OpenwaConfig::load(db).await.map_err(|e| {
            tracing::error!("Failed to load OpenWA webhook settings: {e}");
            StatusError::internal_server_error().brief("Webhook settings unavailable")
        })?,
    };

    if config.webhook_secret.is_empty() {
        tracing::warn!("OpenWA webhook called but no secret is set (preference.what_apps or OPENWA_WEBHOOK_SECRET)");
        return Err(StatusError::service_unavailable().brief("Webhook is not configured"));
    }

    let signature = req.header::<String>(SIGNATURE_HEADER);

    let body = req
        .payload()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Unable to read body: {}", e)))?
        .clone();

    let verified = signature
        .as_deref()
        .is_some_and(|sig| verify_hmac(&config.webhook_secret, sig, &body));
    if !verified {
        tracing::warn!("OpenWA webhook rejected: bad or missing signature");
        return Err(StatusError::unauthorized().brief("Invalid webhook signature"));
    }

    let raw: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    let payload: OpenWaEventPayload = serde_json::from_value(raw.clone())
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    // OpenWA retries with the same idempotency key, so a repeat is acknowledged without storing it again
    if let Some(existing) = find_by_idempotency_key(db, &payload.idempotency_key).await? {
        tracing::info!(event = %payload.event, idempotency_key = %payload.idempotency_key, "OpenWA webhook duplicate ignored");
        return Ok(Json(OpenWaWebhookResponse { id: existing.id, duplicate: true }));
    }

    let now = Utc::now().naive_utc();
    let new_model = entity_mod::ActiveModel {
        id: Set(Uuid::now_v7()),
        idempotency_key: Set(payload.idempotency_key.clone()),
        delivery_id: Set(payload.delivery_id.clone()),
        event_type: Set(payload.event.clone()),
        session_id: Set(payload.session_id.clone()),
        occurred_at: Set(payload.timestamp.map(|t| t.naive_utc())),
        payload: Set(raw),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let saved = match new_model.insert(db).await {
        Ok(saved) => saved,
        // A concurrent delivery of the same event won the insert
        Err(e) if matches!(e.sql_err(), Some(SqlErr::UniqueConstraintViolation(_))) => {
            let existing = find_by_idempotency_key(db, &payload.idempotency_key)
                .await?
                .ok_or_else(|| StatusError::internal_server_error().brief(e.to_string()))?;
            return Ok(Json(OpenWaWebhookResponse { id: existing.id, duplicate: true }));
        }
        Err(e) => return Err(StatusError::internal_server_error().brief(e.to_string())),
    };

    tracing::info!(
        event = %saved.event_type,
        session_id = %saved.session_id,
        id = %saved.id,
        "OpenWA webhook received"
    );

    Ok(Json(OpenWaWebhookResponse { id: saved.id, duplicate: false }))
}
