use std::env;

#[derive(Debug, Clone)]
pub struct EmailConfig {
    pub smtp_host: String,
    pub smtp_port: u16,
    pub smtp_user: String,
    pub smtp_password: Option<String>,
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
            app_url: env::var("APP_FRONTEND_URL")
                .map(|v| v.trim_end_matches('/').to_string())
                .unwrap_or(default_config.app_url),
            system_name: env::var("APP_SYSTEM_NAME").unwrap_or(default_config.system_name),
            institution_name: env::var("INSTITUTION_NAME").unwrap_or(default_config.institution_name),
            institution_address: env::var("INSTITUTION_ADDRESS").unwrap_or(default_config.institution_address),
        }
    }
}
