use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// A PDF accepted for background conversion into embedded `ai.chunks`
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UploadChunkResponse {
    /// PGMQ message id of the queued embedding job
    pub msg_id: i64,
    pub chunkable_type: String,
    /// Shared by every chunk of the document; pass it back to re-upload (replace) the document
    pub chunkable_id: Uuid,
    pub file_name: String,
    pub file_size: u64,
}
