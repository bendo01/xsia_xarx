use std::env;

#[derive(Debug, Clone)]
pub struct RedisConfig {
    pub url: String,
}

impl Default for RedisConfig {
    fn default() -> Self {
        Self {
            url: "redis://127.0.0.1:6379".to_string(),
        }
    }
}

impl RedisConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();
        
        Self {
            url: env::var("REDIS_URL").unwrap_or(default_config.url),
        }
    }
}
