use std::env;
use std::time::Duration;
use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};

/// Initializes environmental variables from `.env` and establishes a SeaORM database connection.
pub async fn connect_db() -> Result<DatabaseConnection, DbErr> {
    // Read environment variables from .env file
    dotenv::dotenv().ok();

    let database_url = env::var("DATABASE_URL").expect("DATABASE_URL must be set in .env file");

    let mut opt = ConnectOptions::new(database_url);

    if let Ok(val) = env::var("DB_MAX_CONNECTIONS") {
        if let Ok(max) = val.parse::<u32>() {
            opt.max_connections(max);
        }
    }

    if let Ok(val) = env::var("DB_MIN_CONNECTIONS") {
        if let Ok(min) = val.parse::<u32>() {
            opt.min_connections(min);
        }
    }

    if let Ok(val) = env::var("DB_CONNECT_TIMEOUT") {
        if let Ok(ms) = val.parse::<u64>() {
            opt.connect_timeout(Duration::from_millis(ms));
        }
    }

    if let Ok(val) = env::var("DB_IDLE_TIMEOUT") {
        if let Ok(ms) = val.parse::<u64>() {
            opt.idle_timeout(Duration::from_millis(ms));
        }
    }

    let db = Database::connect(opt).await?;
    tracing::info!("Database connection established successfully.");
    Ok(db)
}
