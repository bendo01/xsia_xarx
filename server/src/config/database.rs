use std::env;

#[derive(Debug, Clone)]
pub struct DatabaseConfig {
    pub database_type: String,
    pub username: String,
    pub password: String,
    pub host: String,
    pub port: u16,
    pub database_name: String,
    pub url: String,
    pub max_connections: u32,
    pub min_connections: u32,
    pub connect_timeout: u64,
    pub idle_timeout: u64,
}

impl Default for DatabaseConfig {
    fn default() -> Self {
        let database_type = "postgres".to_string();
        let username = "bendo01".to_string();
        let password = "qwerty".to_string();
        let host = "localhost".to_string();
        let port = 5432;
        let database_name = "xsia_xarx".to_string();
        let url = format!("{database_type}://{username}:{password}@{host}:{port}/{database_name}");

        Self {
            database_type,
            username,
            password,
            host,
            port,
            database_name,
            url,
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

        let database_type = env::var("DATABASE_TYPE")
            .or_else(|_| env::var("DB_TYPE"))
            .unwrap_or(default_config.database_type);

        let username = env::var("DB_USER")
            .or_else(|_| env::var("DB_USERNAME"))
            .or_else(|_| env::var("DATABASE_USERNAME"))
            .or_else(|_| env::var("DATABASE_USER"))
            .unwrap_or(default_config.username);

        let password = env::var("DB_PASSWORD")
            .or_else(|_| env::var("DATABASE_PASSWORD"))
            .unwrap_or(default_config.password);

        let host = env::var("DB_HOST")
            .or_else(|_| env::var("DATABASE_HOST"))
            .unwrap_or(default_config.host);

        let port = env::var("DB_PORT")
            .or_else(|_| env::var("DATABASE_PORT"))
            .ok()
            .and_then(|v| v.parse().ok())
            .unwrap_or(default_config.port);

        let database_name = env::var("DB_NAME")
            .or_else(|_| env::var("DB_DATABASE"))
            .or_else(|_| env::var("DATABASE_NAME"))
            .unwrap_or(default_config.database_name);

        let url = env::var("DATABASE_URL").unwrap_or_else(|_| {
            format!("{database_type}://{username}:{password}@{host}:{port}/{database_name}")
        });

        Self {
            database_type,
            username,
            password,
            host,
            port,
            database_name,
            url,
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

