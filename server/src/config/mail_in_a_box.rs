use std::env;

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
}
