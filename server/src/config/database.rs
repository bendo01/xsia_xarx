use std::env;

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: u64,
    pub idle_timeout: u64,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        Self {
            url: "postgres://bendo01:qwerty@localhost:5432/xsia_xarx".to_string(),
            max_connections: 100,
            min_connections: 5,
            connect_timeout: 8000,
            idle_timeout: 8000,
        }
    }
}

impl DatabaseConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();
        
        Self {
            url: env::var("DATABASE_URL").unwrap_or(default_config.url),
            max_connections: env::var("DB_MAX_CONNECTIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default_config.max_connections),
            min_connections: env::var("DB_MIN_CONNECTIONS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default_config.min_connections),
            connect_timeout: env::var("DB_CONNECT_TIMEOUT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default_config.connect_timeout),
            idle_timeout: env::var("DB_IDLE_TIMEOUT")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default_config.idle_timeout),
        }
    }
}
