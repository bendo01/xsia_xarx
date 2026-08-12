use sea_orm::{ConnectOptions, Database, DatabaseConnection, DbErr};

use std::time::Duration;

use crate::config::database::DatabaseConfig;

/// Initializes environmental variables from `.env` and establishes a SeaORM database connection.
pub async fn connect_db() -> Result<DatabaseConnection, DbErr> {
    let config = DatabaseConfig::from_env();

    let mut opt = ConnectOptions::new(config.url);
    opt.max_connections(config.max_connections);
    opt.min_connections(config.min_connections);
    opt.connect_timeout(Duration::from_millis(config.connect_timeout));
    opt.idle_timeout(Duration::from_millis(config.idle_timeout));

    let db = Database::connect(opt).await?;
    tracing::info!("Database connection established successfully.");
    Ok(db)
}
