use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDateTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ArchiveQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ArchiveResponse {
    pub id: Uuid,
    pub name: String,
    pub dir: String,
    pub mimetype: String,
    pub size: Option<i32>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub archive_type_id: Uuid,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub description: Option<String>,
    pub is_knowledge: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateArchiveRequest {
    pub name: String,
    pub dir: String,
    pub mimetype: String,
    pub size: Option<i32>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub archive_type_id: Uuid,
    pub description: Option<String>,
    pub is_knowledge: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateArchiveRequest {
    pub name: Option<String>,
    pub dir: Option<String>,
    pub mimetype: Option<String>,
    pub size: Option<i32>,
    pub archiveable_id: Option<Uuid>,
    pub archiveable_type: Option<String>,
    pub archive_type_id: Option<Uuid>,
    pub description: Option<String>,
    pub is_knowledge: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedArchiveResponse {
    pub data: Vec<ArchiveResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ArchiveOptionRequest {
    pub search: Option<String>,
    pub archive_type_id: Option<Uuid>,
}

/// Result of uploading a file as an archive
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UploadArchiveResponse {
    pub archive: ArchiveResponse,
    /// `queued` when the document was sent for embedding, `skipped` when it was requested but could not be
    pub knowledge_status: Option<String>,
    /// Why the document was not added to the knowledge base
    pub warning: Option<String>,
}

/// Result of (re-)queueing an archive for the knowledge base
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ReindexArchiveResponse {
    pub msg_id: i64,
    pub message: String,
}

/// Which knowledge archives to rebuild; all of them when `ids` is empty or missing
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ReindexAllRequest {
    pub ids: Option<Vec<Uuid>>,
}

/// An archive that could not be queued while rebuilding the knowledge base
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ReindexSkipped {
    pub id: Uuid,
    pub name: String,
    pub reason: String,
}

/// Result of queueing several archives for the knowledge base
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct ReindexAllResponse {
    pub queued: usize,
    pub skipped: Vec<ReindexSkipped>,
    pub message: String,
}

/// One knowledge archive with how much of it is currently indexed
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KnowledgeItemStatus {
    pub id: Uuid,
    pub name: String,
    pub size: Option<i32>,
    /// Live (not deleted) chunks in `ai.chunks`; 0 means the archive is not indexed yet
    pub chunk_count: i64,
    pub last_indexed_at: Option<NaiveDateTime>,
}

/// State of the knowledge base: archives, queued embedding jobs and whether docling can run
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct KnowledgeStatusResponse {
    pub items: Vec<KnowledgeItemStatus>,
    /// Embedding jobs still waiting in the queue (jobs being processed are hidden from it)
    pub queue_length: i64,
    pub docling_available: bool,
    pub total_chunks: i64,
}
