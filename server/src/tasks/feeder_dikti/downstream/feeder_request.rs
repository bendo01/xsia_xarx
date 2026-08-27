use crate::config::feeder::FeederConfig;
use crate::services::feeder_dikti::requester::token::Token;
use reqwest::Client;
use serde::{Deserialize, Serialize};
use std::fmt;
use std::time::Duration;

#[derive(Clone, Debug, Serialize, Deserialize)]
#[serde(untagged)]
pub enum StringOrInt {
    Int(i32),
    Str(String),
}

impl fmt::Display for StringOrInt {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            StringOrInt::Int(i) => write!(f, "{i}"),
            StringOrInt::Str(s) => write!(f, "{s}"),
        }
    }
}

impl StringOrInt {
    pub fn to_i32(&self) -> Result<i32, std::num::ParseIntError> {
        match self {
            StringOrInt::Int(i) => Ok(*i),
            StringOrInt::Str(s) => s.parse::<i32>(),
        }
    }
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct InputRequestData {
    pub act: String,
    pub filter: Option<String>,
    pub order: Option<String>,
    pub limit: Option<i32>,
    pub offset: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RequestData {
    pub act: String,
    pub token: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub filter: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub order: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub limit: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offset: Option<i32>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReturnData<T> {
    pub error_code: i32,
    pub error_desc: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub jumlah: Option<i32>,
    pub data: Option<Vec<T>>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ReturnDataScalar {
    pub error_code: i32,
    pub error_desc: Option<String>,
    pub data: StringOrInt,
}

impl RequestData {
    pub async fn get<T>(input: InputRequestData) -> Result<ReturnData<T>, Box<dyn std::error::Error + Send + Sync>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let config = FeederConfig::from_env();
        Self::get_with_config(&config, input).await
    }

    pub async fn get_with_config<T>(
        config: &FeederConfig,
        input: InputRequestData,
    ) -> Result<ReturnData<T>, Box<dyn std::error::Error + Send + Sync>>
    where
        T: for<'de> Deserialize<'de>,
    {
        let token = Token::get_with_config(config).await?;
        let request_data = Self {
            act: input.act,
            token,
            filter: input.filter,
            order: input.order,
            limit: input.limit,
            offset: input.offset,
        };

        let http_client = Client::new();
        let res = http_client
            .post(&config.feeder_url)
            .timeout(Duration::from_secs(30))
            .json(&request_data)
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(format!("HTTP request failed with status: {}", res.status()).into());
        }

        let response_text = res.text().await?;
        let data = serde_json::from_str::<ReturnData<T>>(&response_text)
            .map_err(|err| format!("JSON parsing failed for action: {}. Error: {}. Response: {}", request_data.act, err, response_text))?;

        Ok(data)
    }

    pub async fn get_scalar(
        input: InputRequestData,
    ) -> Result<ReturnDataScalar, Box<dyn std::error::Error + Send + Sync>> {
        let config = FeederConfig::from_env();
        Self::get_scalar_with_config(&config, input).await
    }

    pub async fn get_scalar_with_config(
        config: &FeederConfig,
        input: InputRequestData,
    ) -> Result<ReturnDataScalar, Box<dyn std::error::Error + Send + Sync>> {
        let token = Token::get_with_config(config).await?;
        let request_data = Self {
            act: input.act,
            token,
            filter: input.filter,
            order: input.order,
            limit: input.limit,
            offset: input.offset,
        };

        let http_client = Client::new();
        let res = http_client
            .post(&config.feeder_url)
            .timeout(Duration::from_secs(30))
            .json(&request_data)
            .send()
            .await?;

        if !res.status().is_success() {
            return Err(format!("HTTP request failed with status: {}", res.status()).into());
        }

        let response_text = res.text().await?;
        let data = serde_json::from_str::<ReturnDataScalar>(&response_text)
            .map_err(|err| format!("JSON parsing failed for scalar action: {}. Error: {}. Response: {}", request_data.act, err, response_text))?;

        Ok(data)
    }
}
