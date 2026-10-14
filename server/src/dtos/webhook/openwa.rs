use chrono::{DateTime, Utc};
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Body OpenWA POSTs to `/api/v1/webhook/openwa`
///
/// ```json
/// {
///   "event": "message.received",
///   "timestamp": "2026-02-02T10:00:00.000Z",
///   "sessionId": "my-session",
///   "idempotencyKey": "msg_my-session_3EB0ABC123_f1e2d3c4-b5a6-7890-1234-567890abcdef",
///   "deliveryId": "dlv_550e8400-e29b-41d4-a716-446655440000",
///   "data": {}
/// }
/// ```
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
#[serde(rename_all = "camelCase")]
pub struct OpenWaEventPayload {
    /// Event name, e.g. `message.received`, `message.ack`, `session.status`, `test`
    #[validate(length(min = 1, max = 255), regex(path = *EVENT_NAME))]
    pub event: String,
    /// When OpenWA dispatched the event (ISO-8601)
    pub timestamp: Option<DateTime<Utc>>,
    /// OpenWA session the event belongs to
    #[validate(length(min = 1, max = 255))]
    pub session_id: String,
    /// Stable across retries of the same occurrence; used to drop redeliveries
    #[validate(length(min = 1, max = 255))]
    pub idempotency_key: String,
    /// `dlv_<uuid>`, the same on every automatic retry
    #[validate(length(max = 255))]
    pub delivery_id: Option<String>,
    /// Event-specific details, stored as-is
    #[serde(default)]
    pub data: serde_json::Value,
}

static EVENT_NAME: std::sync::LazyLock<regex::Regex> =
    std::sync::LazyLock::new(|| regex::Regex::new(r"^[a-z0-9_]+(\.[a-z0-9_]+)*$").unwrap());

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct OpenWaWebhookResponse {
    /// Id of the stored event row
    pub id: Uuid,
    /// True when an event with the same idempotency key had already been received
    pub duplicate: bool,
}
