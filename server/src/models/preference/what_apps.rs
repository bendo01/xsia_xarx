use sea_orm::entity::prelude::*;

/// OpenWA connection settings; keys and secrets are encrypted with `library::crypto`
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "preference", table_name = "what_apps")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub url: String,
    #[sea_orm(column_name = "openwa_api_key_seesion_id")]
    pub openwa_api_key_session_id: String,
    pub openwa_api_key_operator: String,
    pub miab_webhook_secret: String,
    pub openwa_webhook_secret: String,
    pub is_active: bool,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
