use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ApplicationPreferenceResponse {
    pub is_llm_enable: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UpdateApplicationPreferenceRequest {
    pub is_llm_enable: bool,
}
