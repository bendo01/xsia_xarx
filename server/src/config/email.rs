use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter};
use std::env;

use super::{ConfigResult, reveal};
use crate::models::preference::mail_servers;

#[derive(Debug, Clone)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_password: Option<String>,
    /// Use TLS: implicit TLS on port 465, STARTTLS on any other port
    pub smtp_secure: bool,
    pub from_email: String,
    pub from_name: String,
    /// Base URL of the web client, used to build links inside emails
    pub app_url: String,
    pub system_name: String,
    pub institution_name: String,
    pub institution_address: String,
}

impl Default for EmailConfig {
    fn default() -> Self {
        Self {
            smtp_host: "localhost".to_string(),
            smtp_port: 1025, // Default mailhog/mailpit port
            smtp_user: "".to_string(),
            smtp_password: None,
            smtp_secure: false,
            from_email: "noreply@xsia-xarx.com".to_string(),
            from_name: "Xsia Xarx".to_string(),
            app_url: "http://localhost:3000".to_string(),
            system_name: "Sistem Informasi Akademik".to_string(),
            institution_name: "".to_string(),
            institution_address: "".to_string(),
        }
    }
}

impl EmailConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();
        
        let smtp_port = env::var("SMTP_PORT")
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(default_config.smtp_port);

        Self {
            smtp_host: env::var("SMTP_HOST").unwrap_or(default_config.smtp_host),
            smtp_port,
            smtp_user: env::var("SMTP_USER").unwrap_or(default_config.smtp_user),
            smtp_password: env::var("SMTP_PASSWORD").ok(),
            smtp_secure: smtp_port == 465,
            from_email: env::var("SMTP_FROM_EMAIL").unwrap_or(default_config.from_email),
            from_name: env::var("SMTP_FROM_NAME").unwrap_or(default_config.from_name),
            app_url: env::var("APP_FRONTEND_URL")
                .map(|v| v.trim_end_matches('/').to_string())
                .unwrap_or(default_config.app_url),
            system_name: env::var("APP_SYSTEM_NAME").unwrap_or(default_config.system_name),
            institution_name: env::var("INSTITUTION_NAME").unwrap_or(default_config.institution_name),
            institution_address: env::var("INSTITUTION_ADDRESS").unwrap_or(default_config.institution_address),
        }
    }

    /// Uses the active `preference.mail_servers` record for the SMTP and sender
    /// settings, decrypting the password. The other fields come from the environment.
    /// Returns `Ok(None)` if no active mail server exists.
    pub async fn from_db<C: ConnectionTrait>(db: &C) -> ConfigResult<Option<Self>> {
        let Some(record) = mail_servers::Entity::find()
            .filter(mail_servers::Column::IsActive.eq(true))
            .filter(mail_servers::Column::DeletedAt.is_null())
            .one(db)
            .await?
        else {
            return Ok(None);
        };

        let smtp_port = record
            .port
            .trim()
            .parse()
            .map_err(|_| format!("Mail server port '{}' is not a valid port", record.port))?;
        let smtp_password = match record.password.as_deref() {
            Some(stored) if !stored.is_empty() => Some(reveal(stored, "SMTP password")?),
            _ => None,
        };

        Ok(Some(Self {
            smtp_host: record.host,
            smtp_port,
            smtp_user: record.user.unwrap_or_default(),
            smtp_password,
            smtp_secure: record.is_secure,
            from_email: record.mail_address,
            from_name: record.sender,
            ..Self::from_env()
        }))
    }

    /// Loads the settings from the database, falling back to `SMTP_*` environment variables.
    pub async fn load<C: ConnectionTrait>(db: &C) -> ConfigResult<Self> {
        match Self::from_db(db).await? {
            Some(config) => Ok(config),
            None => Ok(Self::from_env()),
        }
    }
}
