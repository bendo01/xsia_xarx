use sea_orm::entity::prelude::*;

/// An event received from OpenWA through the inbound webhook
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "webhook", table_name = "open_wa_events")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    /// OpenWA `idempotencyKey`, used to drop redeliveries of the same event
    #[sea_orm(unique)]
    pub idempotency_key: String,
    pub delivery_id: Option<String>,
    pub event_type: String,
    pub session_id: String,
    pub occurred_at: Option<DateTime>,
    /// The full request body as received
    pub payload: Json,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}

impl ActiveModelBehavior for ActiveModel {}
