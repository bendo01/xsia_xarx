use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::services::compliance::rag::Hit;

/// Question for the RAG tester
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct AskRequest {
    pub question: String,
    /// Chunks put in the prompt (1 to 10, default 3)
    pub top_k: Option<usize>,
    /// Also search regulations that are no longer in force
    pub include_revoked: Option<bool>,
    /// Rerank the fused candidates (default true)
    pub rerank: Option<bool>,
    /// 0 to 1, default 0.2; 0 is deterministic
    pub temperature: Option<f64>,
    /// 16 to 1024, default 400
    pub max_new_tokens: Option<usize>,
    /// Continue a test conversation; a new one is created when missing
    pub conversation_id: Option<Uuid>,
}

/// A retrieved regulation chunk
#[derive(Serialize, ToSchema, Debug, Clone)]
pub struct HitResponse {
    pub chunk_id: Uuid,
    pub regulation_id: Uuid,
    pub regulation: String,
    pub number: Option<String>,
    pub year: Option<i16>,
    /// `active` or `revoked`
    pub status: String,
    pub heading: Option<String>,
    pub citation: String,
    /// Chunk text without its heading line
    pub body: String,
    pub score: f64,
}

impl From<&Hit> for HitResponse {
    fn from(hit: &Hit) -> Self {
        Self {
            chunk_id: hit.chunk_id,
            regulation_id: hit.regulation_id,
            regulation: hit.regulation.clone(),
            number: hit.number.clone(),
            year: hit.year,
            status: hit.status.clone(),
            heading: hit.heading.clone(),
            citation: hit.citation(),
            body: hit.body().to_owned(),
            score: hit.score,
        }
    }
}

/// Retrieval result without generation
#[derive(Serialize, ToSchema, Debug, Clone)]
pub struct RetrieveResponse {
    pub hits: Vec<HitResponse>,
    pub retrieval_ms: u128,
}

/// Feedback on an answer: 1 good, -1 bad, 0 cleared
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct FeedbackRequest {
    pub feedback: i32,
    pub note: Option<String>,
}

/// State of the pieces the RAG tester needs
#[derive(Serialize, ToSchema, Debug, Clone)]
pub struct RagStatusResponse {
    pub llm_model: String,
    pub llm_model_present: bool,
    pub llm_model_size: Option<u64>,
    pub tokenizer_present: bool,
    /// `CANDLE_DEQUANTIZE_ALL` is on: prompts are processed much faster, answers a bit slower
    pub fast_prompt: bool,
    /// The model is loaded into memory by the first question
    pub llm_loaded: bool,
    pub embedder_present: bool,
    /// Searchable chunks of regulations in force
    pub active_chunks: i64,
    /// Searchable chunks of revoked regulations
    pub revoked_chunks: i64,
}
