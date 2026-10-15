use sea_orm::entity::prelude::*;

/// SMTP server used to send outgoing mail
#[sea_orm::model]
#[derive(Clone, Debug, PartialEq, Eq, DeriveEntityModel)]
#[sea_orm(schema_name = "preference", table_name = "mail_servers")]
pub struct Model {
    #[sea_orm(primary_key, auto_increment = false)]
    pub id: Uuid,
    pub host: String,
    pub port: String,
    pub sender: String,
    pub mail_address: String,
    pub user: Option<String>,
    /// Encrypted with `library::crypto`
    pub password: Option<String>,
    pub is_secure: bool,
    pub is_active: bool,
    pub created_at: Option<DateTime>,
    pub updated_at: Option<DateTime>,
    pub deleted_at: Option<DateTime>,
    pub sync_at: Option<DateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

impl ActiveModelBehavior for ActiveModel {}
