use std::env;

#[derive(Debug, Clone)]
pub struct FeederConfig {
    pub feeder_url: String,
    pub feeder_username: String,
    pub feeder_password: String,
}

impl Default for FeederConfig {
    fn default() -> Self {
        Self {
            feeder_url: "http://feeder.tritunas.ac.id/ws/live2.php".to_string(),
            feeder_username: "".to_string(),
            feeder_password: "".to_string(),
        }
    }
}

impl FeederConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();

        Self {
            feeder_url: env::var("FEEDER_URL").unwrap_or(default_config.feeder_url),
            feeder_username: env::var("FEEDER_USERNAME").unwrap_or(default_config.feeder_username),
            feeder_password: env::var("FEEDER_PASSWORD").unwrap_or(default_config.feeder_password),
        }
    }
}
