use salvo::oapi::ToSchema;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

/// Options of a regulation knowledge base rebuild
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RebuildRegulationsRequest {
    /// Re-embed documents that already have chunks; otherwise only documents without chunks are embedded
    pub force: Option<bool>,
}

/// A registered regulation and how much of it is indexed
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct RegulationItemStatus {
    pub id: Uuid,
    pub title: String,
    pub number: Option<String>,
    pub year: Option<i16>,
    /// `active` or `revoked`
    pub status: String,
    pub source: Option<String>,
    pub chunk_count: i64,
}

/// State of the regulation knowledge base
#[derive(Serialize, ToSchema, Debug, Clone)]
pub struct RegulationStatusResponse {
    pub items: Vec<RegulationItemStatus>,
    /// PDFs currently in the regulation folder
    pub folder_pdf_count: usize,
    /// PDFs in the folder that are not registered yet
    pub unregistered: Vec<String>,
    pub total_chunks: i64,
    pub docling_available: bool,
    pub folder_available: bool,
    /// Registered regulations that have at least one chunk
    pub indexed_count: usize,
    /// Embedding jobs in the shared PGMQ queue, including the one being processed
    pub queue_length: i64,
}

/// A PDF that was not queued
#[derive(Serialize, ToSchema, Debug, Clone)]
pub struct RegulationSkipped {
    pub name: String,
    pub reason: String,
}

/// Result of queueing the regulation folder
#[derive(Serialize, ToSchema, Debug, Clone)]
pub struct RebuildRegulationsResponse {
    pub queued: usize,
    pub skipped: Vec<RegulationSkipped>,
    pub message: String,
}
