use std::env;

#[derive(Debug, Clone)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_password: Option<String>,
    pub from_email: String,
    pub from_name: String,
}

impl Default for EmailConfig {
    fn default() -> Self {
        Self {
            smtp_host: "localhost".to_string(),
            smtp_port: 1025, // Default mailhog/mailpit port
            smtp_user: "".to_string(),
            smtp_password: None,
            from_email: "noreply@xsia-xarx.com".to_string(),
            from_name: "Xsia Xarx".to_string(),
        }
    }
}

impl EmailConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();
        
        Self {
            smtp_host: env::var("SMTP_HOST").unwrap_or(default_config.smtp_host),
            smtp_port: env::var("SMTP_PORT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default_config.smtp_port),
            smtp_user: env::var("SMTP_USER").unwrap_or(default_config.smtp_user),
            smtp_password: env::var("SMTP_PASSWORD").ok(),
            from_email: env::var("SMTP_FROM_EMAIL").unwrap_or(default_config.from_email),
            from_name: env::var("SMTP_FROM_NAME").unwrap_or(default_config.from_name),
        }
    }
}
