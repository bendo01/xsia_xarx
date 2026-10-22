use std::path::{Path, PathBuf};

use anyhow::{Result, bail};
use chrono::Utc;
use pgmq::PGMQueueExt;
use sea_orm::sea_query::Expr;
use sea_orm::{ColumnTrait, ConnectionTrait, EntityTrait, QueryFilter};
use uuid::Uuid;

use crate::jobs::embedding::embed::{PdfEmbeddingJob, enqueue_pdf_embedding};
use crate::models::ai::chunk;
use crate::models::document::transaction::archives::{self, CHUNKABLE_TYPE};
use crate::services::ai::docling;

/// Where the embedding worker's private copies live; override with `AI_UPLOAD_DIR`
const DEFAULT_UPLOAD_DIR: &str = "storage/ai/uploads";

pub const DOCLING_MISSING_WARNING: &str =
    "docling is not installed on the server, so this document was not added to the knowledge base. \
     Install it (pip install docling) and re-index the archive.";

/// Where an archive's file is stored on disk
pub fn archive_path(archive: &archives::Model) -> PathBuf {
    Path::new(&archive.dir).join(&archive.name)
}

/// Where the converted Markdown is kept: beside the PDF, with an `.md` extension
pub fn markdown_path(archive: &archives::Model) -> PathBuf {
    archive_path(archive).with_extension("md")
}

/// Queues an archive's PDF for conversion with docling and embedding into `ai.chunks`
/// (`chunkable_type` = [`CHUNKABLE_TYPE`], `chunkable_id` = the archive id).
/// Fails when docling is missing or the archive is not a readable PDF.
pub async fn enqueue_archive(
    queue: &PGMQueueExt,
    archive: &archives::Model,
    user_id: Option<Uuid>,
) -> Result<i64> {
    if archive.mimetype != "application/pdf" {
        bail!("Only PDF archives can be added to the knowledge base");
    }
    if !docling::is_available().await {
        bail!(DOCLING_MISSING_WARNING);
    }

    // The worker deletes its PDF when the job finishes, so it gets its own copy
    let upload_dir = std::env::var("AI_UPLOAD_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(DEFAULT_UPLOAD_DIR));
    tokio::fs::create_dir_all(&upload_dir).await?;
    let pdf_path = upload_dir.join(format!("{}.pdf", Uuid::now_v7()));
    tokio::fs::copy(archive_path(archive), &pdf_path).await?;

    let job = PdfEmbeddingJob {
        pdf_path: pdf_path.to_string_lossy().into_owned(),
        file_name: archive.name.clone(),
        file_size: archive.size.unwrap_or_default().max(0) as u64,
        chunkable_type: CHUNKABLE_TYPE.to_string(),
        chunkable_id: archive.id,
        user_id,
        markdown_path: Some(markdown_path(archive).to_string_lossy().into_owned()),
    };
    match enqueue_pdf_embedding(queue, &job).await {
        Ok(id) => Ok(id),
        Err(e) => {
            let _ = tokio::fs::remove_file(&pdf_path).await;
            Err(e.into())
        }
    }
}

/// Soft-deletes every chunk built from the archive
pub async fn remove_archive_chunks<C: ConnectionTrait>(
    db: &C,
    archive_id: Uuid,
    user_id: Option<Uuid>,
) -> Result<()> {
    let now = Utc::now().naive_utc();
    chunk::Entity::update_many()
        .col_expr(chunk::Column::DeletedAt, Expr::value(now))
        .col_expr(chunk::Column::UpdatedBy, Expr::value(user_id))
        .filter(chunk::Column::ChunkableType.eq(CHUNKABLE_TYPE))
        .filter(chunk::Column::ChunkableId.eq(archive_id))
        .filter(chunk::Column::DeletedAt.is_null())
        .exec(db)
        .await?;
    Ok(())
}
