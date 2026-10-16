use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter};
use std::env;

use super::{ConfigResult, reveal};
use crate::models::preference::what_apps;

#[derive(Debug, Clone)]
pub struct OpenwaConfig {
    pub base_url: String,
    pub session_id: String,
    pub operator_key: String,
    /// HMAC secret OpenWA signs webhook deliveries with. Empty disables the inbound webhook.
    pub webhook_secret: String,
}

impl Default for OpenwaConfig {
    fn default() -> Self {
        Self {
            base_url: "http://localhost:2785".to_string(),
            session_id: String::new(),
            operator_key: String::new(),
            webhook_secret: String::new(),
        }
    }
}

impl OpenwaConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();
        
        Self {
            base_url: env::var("OPENWA_URL").unwrap_or(default_config.base_url),
            session_id: env::var("OPENWA_API_KEY_SESSION_ID").unwrap_or(default_config.session_id),
            operator_key: env::var("OPENWA_API_KEY_OPERATOR").unwrap_or(default_config.operator_key),
            webhook_secret: env::var("OPENWA_WEBHOOK_SECRET").unwrap_or(default_config.webhook_secret),
        }
    }

    /// Loads the active `preference.what_apps` record, decrypting the operator key
    /// and webhook secret. Returns `Ok(None)` if no active record exists.
    pub async fn from_db<C: ConnectionTrait>(db: &C) -> ConfigResult<Option<Self>> {
        let Some(record) = what_apps::Entity::find()
            .filter(what_apps::Column::IsActive.eq(true))
            .filter(what_apps::Column::DeletedAt.is_null())
            .one(db)
            .await?
        else {
            return Ok(None);
        };

        Ok(Some(Self {
            base_url: record.url.trim_end_matches('/').to_string(),
            session_id: record.openwa_api_key_session_id,
            operator_key: reveal(&record.openwa_api_key_operator, "OpenWA operator API key")?,
            webhook_secret: reveal(&record.openwa_webhook_secret, "OpenWA webhook secret")?,
        }))
    }

    /// Loads the settings from the database, falling back to `OPENWA_*` environment variables.
    pub async fn load<C: ConnectionTrait>(db: &C) -> ConfigResult<Self> {
        match Self::from_db(db).await? {
            Some(config) => Ok(config),
            None => Ok(Self::from_env()),
        }
    }

    /// Like [`load`](Self::load), but logs a database or decryption error and uses
    /// the environment instead. For best-effort sends where an error must not fail the request.
    pub async fn load_or_env<C: ConnectionTrait>(db: &C) -> Self {
        Self::load(db).await.unwrap_or_else(|e| {
            tracing::error!("Failed to load OpenWA settings from the database: {e}");
            Self::from_env()
        })
    }
}
