use std::time::Duration;

use pgmq::PGMQueueExt;
use pgmq::errors::PgmqError;
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::services::ai::ingest::ingest_pdf;

pub const PDF_EMBEDDING_QUEUE: &str = "pdf_embedding";

/// docling on a long PDF can take minutes; the job stays hidden from other reads this long
const VISIBILITY_TIMEOUT_SECS: i32 = 30 * 60;

const MAX_ATTEMPTS: i32 = 3;

/// A stored PDF waiting to be converted, chunked and embedded into `ai.chunks`
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct PdfEmbeddingJob {
    /// Server-side copy of the upload; removed once the job finishes or gives up
    pub pdf_path: String,
    pub file_name: String,
    pub file_size: u64,
    pub chunkable_type: String,
    pub chunkable_id: Uuid,
    /// Uploader, recorded as `created_by` / `updated_by`
    pub user_id: Option<Uuid>,
    /// When set, the docling Markdown is also written to this path (next to the source PDF)
    #[serde(default)]
    pub markdown_path: Option<String>,
}

/// Ensures the PDF embedding queue exists in PGMQ.
pub async fn init_pdf_embedding_queue(queue: &PGMQueueExt) -> Result<(), PgmqError> {
    queue.create(PDF_EMBEDDING_QUEUE).await?;
    Ok(())
}

/// Enqueues a PDF embedding job into the PGMQ queue.
pub async fn enqueue_pdf_embedding(queue: &PGMQueueExt, job: &PdfEmbeddingJob) -> Result<i64, PgmqError> {
    queue.send(PDF_EMBEDDING_QUEUE, job).await
}

/// Starts the background PDF embedding worker. Jobs run one at a time since docling and
/// the embedding model are both CPU heavy.
pub fn start_pdf_embedding_worker(queue: PGMQueueExt, db: DatabaseConnection) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        tracing::info!("PGMQ PDF embedding worker loop started on queue '{PDF_EMBEDDING_QUEUE}'");

        loop {
            let poll_result = queue
                .read_with_poll::<PdfEmbeddingJob>(
                    PDF_EMBEDDING_QUEUE,
                    VISIBILITY_TIMEOUT_SECS,
                    Some(Duration::from_secs(5)),
                    Some(Duration::from_millis(500)),
                )
                .await;

            match poll_result {
                Ok(Some(msg)) => {
                    let job = &msg.message;
                    tracing::info!(
                        "Processing PDF embedding job msg_id: {} file: '{}' ({} {})",
                        msg.msg_id,
                        job.file_name,
                        job.chunkable_type,
                        job.chunkable_id
                    );

                    match ingest_pdf(&db, job).await {
                        Ok(total_chunks) => {
                            tracing::info!(
                                "PDF embedding job msg_id: {} stored {} chunks",
                                msg.msg_id,
                                total_chunks
                            );
                            finish(&queue, msg.msg_id, job).await;
                        }
                        Err(e) => {
                            tracing::error!(
                                "PDF embedding job msg_id: {} failed (read count: {}): {:#}",
                                msg.msg_id,
                                msg.read_ct,
                                e
                            );
                            if msg.read_ct >= MAX_ATTEMPTS {
                                tracing::warn!(
                                    "PDF embedding job msg_id: {} exceeded max retries ({}), archiving...",
                                    msg.msg_id,
                                    msg.read_ct
                                );
                                finish(&queue, msg.msg_id, job).await;
                            } else {
                                // Retry soon instead of waiting out the long visibility timeout
                                let _ = queue.set_vt::<PdfEmbeddingJob>(PDF_EMBEDDING_QUEUE, msg.msg_id, 30i32).await;
                            }
                        }
                    }
                }
                Ok(None) => {
                    // No messages received within poll timeout, continue loop
                }
                Err(e) => {
                    tracing::error!("Error reading from PGMQ PDF embedding queue: {}", e);
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }
    })
}

/// Archives the message and removes the stored PDF
async fn finish(queue: &PGMQueueExt, msg_id: i64, job: &PdfEmbeddingJob) {
    if let Err(e) = queue.archive(PDF_EMBEDDING_QUEUE, msg_id).await {
        tracing::error!("Failed to archive PDF embedding job {}: {}", msg_id, e);
    }
    if let Err(e) = tokio::fs::remove_file(&job.pdf_path).await {
        tracing::warn!("Failed to remove {}: {}", job.pdf_path, e);
    }
}
