use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set};
use uuid::Uuid;
use validator::Validate;

use crate::config::mail_in_a_box::MailInABoxConfig;
use crate::dtos::webhook::mail_in_a_box::{MailInABoxEventPayload, MailInABoxWebhookResponse};
use crate::models::webhook::mail_in_a_box_event as entity_mod;

use super::signature::{constant_time_eq, verify_hmac};
pub use super::signature::sign;

/// Header carrying `sha256=<hex HMAC-SHA256 of the raw body, keyed with the shared secret>`
pub const SIGNATURE_HEADER: &str = "x-webhook-signature";
/// Header carrying the shared secret itself, for senders that cannot compute an HMAC
pub const SECRET_HEADER: &str = "x-webhook-secret";

/// Check the request against the shared secret: an HMAC signature header wins over a plain secret header
pub fn verify(secret: &str, signature: Option<&str>, plain_secret: Option<&str>, body: &[u8]) -> bool {
    if secret.is_empty() {
        return false;
    }

    if let Some(signature) = signature {
        return verify_hmac(secret, signature, body);
    }

    match plain_secret {
        Some(given) => constant_time_eq(given.trim().as_bytes(), secret.as_bytes()),
        None => false,
    }
}

/// Receive an event from a Mail-in-a-Box server and store it
#[endpoint(tags("Webhook - Mail-in-a-Box"), status_codes(200, 400, 401, 500, 503))]
pub async fn receive(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MailInABoxWebhookResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    // Settings injected by `router_with_config` win; otherwise read the active
    // `preference.what_apps` record, falling back to the environment.
    let config = match depot.get_typed::<MailInABoxConfig>() {
        Ok(config) => config.clone(),
        Err(_) => MailInABoxConfig::load(db).await.map_err(|e| {
            tracing::error!("Failed to load Mail-in-a-Box webhook settings: {e}");
            StatusError::internal_server_error().brief("Webhook settings unavailable")
        })?,
    };

    if config.webhook_secret.is_empty() {
        tracing::warn!("Mail-in-a-Box webhook called but no secret is set (preference.what_apps or MIAB_WEBHOOK_SECRET)");
        return Err(StatusError::service_unavailable().brief("Webhook is not configured"));
    }

    let signature = req.header::<String>(SIGNATURE_HEADER);
    let plain_secret = req.header::<String>(SECRET_HEADER);

    let body = req
        .payload()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Unable to read body: {}", e)))?
        .clone();

    if !verify(&config.webhook_secret, signature.as_deref(), plain_secret.as_deref(), &body) {
        tracing::warn!("Mail-in-a-Box webhook rejected: bad or missing secret");
        return Err(StatusError::unauthorized().brief("Invalid webhook secret"));
    }

    let raw: serde_json::Value = serde_json::from_slice(&body)
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;
    let payload: MailInABoxEventPayload = serde_json::from_value(raw.clone())
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    if let Some(ref event_id) = payload.id {
        let existing = entity_mod::Entity::find()
            .filter(entity_mod::Column::EventId.eq(event_id.clone()))
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        if let Some(existing) = existing {
            tracing::info!(event = %payload.event, event_id = %event_id, "Mail-in-a-Box webhook duplicate ignored");
            return Ok(Json(MailInABoxWebhookResponse { id: existing.id, duplicate: true }));
        }
    }

    let now = Utc::now().naive_utc();
    let new_model = entity_mod::ActiveModel {
        id: Set(Uuid::now_v7()),
        event_id: Set(payload.id.clone()),
        event_type: Set(payload.event.clone()),
        hostname: Set(payload.hostname.clone()),
        occurred_at: Set(payload.occurred_at.map(|t| t.naive_utc())),
        payload: Set(raw),
        created_at: Set(now),
        updated_at: Set(now),
    };

    let saved = new_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    tracing::info!(
        event = %saved.event_type,
        hostname = saved.hostname.as_deref().unwrap_or("-"),
        id = %saved.id,
        "Mail-in-a-Box webhook received"
    );

    Ok(Json(MailInABoxWebhookResponse { id: saved.id, duplicate: false }))
}
