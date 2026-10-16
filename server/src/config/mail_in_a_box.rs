use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter};
use std::env;

use super::{ConfigResult, reveal};
use crate::models::preference::what_apps;

/// Settings for the inbound Mail-in-a-Box webhook
#[derive(Debug, Clone, Default)]
pub struct MailInABoxConfig {
    /// Shared secret used to authenticate webhook calls. Empty disables the endpoint.
    pub webhook_secret: String,
}

impl MailInABoxConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();

        Self {
            webhook_secret: env::var("MIAB_WEBHOOK_SECRET").unwrap_or_default(),
        }
    }

    /// Loads the secret from the active `preference.what_apps` record, decrypting it.
    /// Returns `Ok(None)` if there is no active record or its secret is empty.
    pub async fn from_db<C: ConnectionTrait>(db: &C) -> ConfigResult<Option<Self>> {
        let Some(record) = what_apps::Entity::find()
            .filter(what_apps::Column::IsActive.eq(true))
            .filter(what_apps::Column::DeletedAt.is_null())
            .one(db)
            .await?
        else {
            return Ok(None);
        };

        let webhook_secret = reveal(&record.miab_webhook_secret, "Mail-in-a-Box webhook secret")?;
        if webhook_secret.is_empty() {
            return Ok(None);
        }
        Ok(Some(Self { webhook_secret }))
    }

    /// Loads the settings from the database, falling back to `MIAB_WEBHOOK_SECRET`.
    pub async fn load<C: ConnectionTrait>(db: &C) -> ConfigResult<Self> {
        match Self::from_db(db).await? {
            Some(config) => Ok(config),
            None => Ok(Self::from_env()),
        }
    }
}
