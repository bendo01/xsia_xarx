use std::env;
use jsonwebtoken::{encode, decode, Header, Validation, EncodingKey, DecodingKey, errors::Result as JwtResult};
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{Utc, Duration};

#[derive(Debug, Clone)]
pub struct JwtConfig {
    pub secret: String,
    pub expiration_hours: i64,
}

impl Default for JwtConfig {
    fn default() -> Self {
        Self {
            secret: "default_secret_key_change_me_in_production".to_string(),
            expiration_hours: 24,
        }
    }
}

impl JwtConfig {
    pub fn from_env() -> Self {
        dotenv::dotenv().ok();
        let default_config = Self::default();
        
        Self {
            secret: env::var("JWT_SECRET").unwrap_or(default_config.secret),
            expiration_hours: env::var("JWT_EXPIRATION_HOURS")
                .ok()
                .and_then(|v| v.parse().ok())
                .unwrap_or(default_config.expiration_hours),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct Claims {
    pub sub: Uuid,
    pub exp: usize,
    pub iat: usize,
}

pub fn create_token(user_id: Uuid, config: &JwtConfig) -> JwtResult<String> {
    let now = Utc::now();
    let exp = (now + Duration::hours(config.expiration_hours)).timestamp() as usize;
    let iat = now.timestamp() as usize;

    let claims = Claims {
        sub: user_id,
        exp,
        iat,
    };

    encode(
        &Header::default(),
        &claims,
        &EncodingKey::from_secret(config.secret.as_bytes()),
    )
}

pub fn verify_token(token: &str, config: &JwtConfig) -> JwtResult<Claims> {
    let token_data = decode::<Claims>(
        token,
        &DecodingKey::from_secret(config.secret.as_bytes()),
        &Validation::default(),
    )?;

    Ok(token_data.claims)
}
