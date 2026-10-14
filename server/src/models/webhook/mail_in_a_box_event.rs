use sea_orm::entity::prelude::*;

/// An event received from a Mail-in-a-Box server through the inbound webhook
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "webhook", table_name = "mail_in_a_box_events")]
pub struct Model {
    #[sea_orm(primary_key)]
    pub id: Uuid,
    /// Sender-assigned id, used to drop redeliveries of the same event
    #[sea_orm(unique)]
    pub event_id: Option<String>,
    pub event_type: String,
    pub hostname: Option<String>,
    pub occurred_at: Option<DateTime>,
    /// The full request body as received
    pub payload: Json,
    pub created_at: DateTime,
    pub updated_at: DateTime,
}


impl ActiveModelBehavior for ActiveModel {}
