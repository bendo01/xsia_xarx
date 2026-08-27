use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::time::Duration;

use crate::config::feeder::FeederConfig;

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct RequestToken {
    pub act: String,
    pub username: String,
    pub password: String,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct Token {
    pub token: String,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub struct TokenResponse {
    pub error_code: i64,
    pub error_desc: Option<String>,
    pub data: Option<Token>,
}

impl Token {
    /// Fetches authentication token from the Feeder API using default environment configuration.
    ///
    /// # Errors
    ///
    /// Returns an error if the HTTP request fails, times out, or the response cannot be parsed.
    pub async fn get() -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let config = FeederConfig::from_env();
        Self::get_with_config(&config).await
    }

    /// Fetches authentication token using a specific `FeederConfig`.
    pub async fn get_with_config(
        config: &FeederConfig,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        Self::get_with_credentials(
            &config.feeder_url,
            &config.feeder_username,
            &config.feeder_password,
        )
        .await
    }

    /// Fetches authentication token from the Feeder API with explicit URL and credentials.
    pub async fn get_with_credentials(
        feeder_url: &str,
        feeder_username: &str,
        feeder_password: &str,
    ) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let request_token = RequestToken {
            act: "GetToken".to_string(),
            username: feeder_username.to_string(),
            password: feeder_password.to_string(),
        };

        let http_client = Client::new();
        let http_result = http_client
            .post(feeder_url)
            .timeout(Duration::from_secs(10))
            .json(&request_token)
            .send()
            .await?;

        let token_response: TokenResponse = http_result.json().await?;

        if let Some(token_data) = token_response.data {
            Ok(token_data.token)
        } else {
            let error_desc = token_response
                .error_desc
                .unwrap_or_else(|| "Token data not found in response".to_string());
            Err(format!("Feeder API Error (code {}): {}", token_response.error_code, error_desc).into())
        }
    }
}
