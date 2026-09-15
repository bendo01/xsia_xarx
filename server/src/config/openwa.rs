use std::env;

#[derive(Debug, Clone)]
pub struct OpenwaConfig {
    pub base_url: String,
    pub session_id: String,
    pub operator_key: String,
}

impl Default for OpenwaConfig {
    fn default() -> Self {
        Self {
            base_url: "http://localhost:2785".to_string(),
            session_id: String::new(),
            operator_key: String::new(),
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
        }
    }
}
