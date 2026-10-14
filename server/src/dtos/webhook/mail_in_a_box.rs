use chrono::{DateTime, Utc};
use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use validator::Validate;

/// Body a Mail-in-a-Box server POSTs to `/api/v1/webhook/mail-in-a-box`
///
/// ```json
/// {
///   "event": "mail.bounced",
///   "id": "box-1697289600-42",
///   "occurred_at": "2026-10-14T12:00:00Z",
///   "hostname": "box.example.com",
///   "data": { "from": "noreply@example.com", "to": "user@example.org", "reason": "550 5.1.1 user unknown" }
/// }
/// ```
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct MailInABoxEventPayload {
    /// Dotted lowercase event name, e.g. `mail.received`, `mail.bounced`, `mailbox.created`, `status_check.failed`
    #[validate(length(min = 1, max = 100), regex(path = *EVENT_NAME))]
    pub event: String,
    /// Optional sender-assigned unique id; a repeated id is acknowledged but not stored twice
    #[validate(length(min = 1, max = 255))]
    pub id: Option<String>,
    /// When the event happened on the box (RFC 3339)
    pub occurred_at: Option<DateTime<Utc>>,
    /// Hostname of the Mail-in-a-Box server that sent the event
    #[validate(length(min = 1, max = 255))]
    pub hostname: Option<String>,
    /// Event-specific details, stored as-is
    #[serde(default)]
    pub data: serde_json::Value,
}

static EVENT_NAME: std::sync::LazyLock<regex::Regex> =
    std::sync::LazyLock::new(|| regex::Regex::new(r"^[a-z0-9_]+(\.[a-z0-9_]+)*$").unwrap());

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct MailInABoxWebhookResponse {
    /// Id of the stored event row
    pub id: Uuid,
    /// True when an event with the same `id` had already been received
    pub duplicate: bool,
}
