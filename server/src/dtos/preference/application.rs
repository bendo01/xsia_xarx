use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ApplicationPreferenceResponse {
    pub is_llm_enable: bool,
    /// `cpu`, `cuda` or `vulkan`
    pub llm_backend: String,
    /// Backends this server build contains
    pub available_backends: Vec<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UpdateApplicationPreferenceRequest {
    pub is_llm_enable: bool,
    #[serde(default = "default_backend")]
    pub llm_backend: String,
}

fn default_backend() -> String {
    "cpu".to_owned()
}
