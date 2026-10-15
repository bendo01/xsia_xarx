use std::path::Path;

use anyhow::{Result, bail};
use chrono::Utc;
use sea_orm::prelude::PgVector;
use sea_orm::sea_query::Expr;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set, TransactionTrait};
use serde_json::json;
use text_splitter::{ChunkConfig, MarkdownSplitter};
use uuid::Uuid;

use crate::jobs::embedding::embed::PdfEmbeddingJob;
use crate::models::ai::chunk as entity_mod;
use crate::services::ai::embedding::EMBEDDING_MODEL;
use crate::services::ai::{EmbeddingService, docling};

/// Chunk size in characters; ~500 characters stays under the model's 128 token window
const CHUNK_CHARS: std::ops::Range<usize> = 200..500;
const CHUNK_OVERLAP: usize = 50;

/// Chunks embedded per model call
const EMBED_BATCH_SIZE: usize = 32;

const IMAGE_PLACEHOLDER: &str = "<!-- image -->";

/// A Markdown chunk with the headings it sits under
struct Section {
    markdown: String,
    heading_context: Option<String>,
    title_hierarchy: Option<String>,
}

/// Converts the job's PDF to Markdown with docling, splits and embeds it, and replaces the
/// document's rows in `ai.chunks`. Returns the number of chunks stored.
pub async fn ingest_pdf(db: &DatabaseConnection, job: &PdfEmbeddingJob) -> Result<usize> {
    // docling writes `<stem>.md` next to its output dir; keep each run in a private dir
    let work_dir = std::env::temp_dir().join(format!("xsia-docling-{}", Uuid::new_v4()));
    let markdown = convert_pdf(&work_dir, Path::new(&job.pdf_path)).await;
    let _ = tokio::fs::remove_dir_all(&work_dir).await;
    let markdown = markdown?;

    let sections = split_markdown(&markdown);
    if sections.is_empty() {
        bail!("No text could be extracted from {}", job.file_name);
    }

    // Embed the heading path together with the chunk so retrieval sees the chunk's context
    let contents: Vec<String> = sections
        .iter()
        .map(|s| match &s.title_hierarchy {
            Some(path) => format!("{path}\n\n{}", s.markdown),
            None => s.markdown.clone(),
        })
        .collect();

    let embed_input = contents.clone();
    let embeddings = tokio::task::spawn_blocking(move || -> Result<Vec<Vec<f32>>> {
        let embedder = EmbeddingService::global()?;
        let mut vectors = Vec::with_capacity(embed_input.len());
        for batch in embed_input.chunks(EMBED_BATCH_SIZE) {
            vectors.extend(embedder.embed(batch)?);
        }
        Ok(vectors)
    })
    .await??;

    let now = Utc::now().naive_utc();
    let total_chunks = sections.len();

    let models = sections
        .into_iter()
        .zip(contents)
        .zip(embeddings)
        .enumerate()
        .map(|(index, ((section, content), embedding))| entity_mod::ActiveModel {
            id: Set(Uuid::now_v7()),
            chunkable_type: Set(Some(job.chunkable_type.clone())),
            chunkable_id: Set(job.chunkable_id),
            content: Set(content),
            heading_context: Set(section.heading_context),
            title_hierarchy: Set(section.title_hierarchy),
            markdown_content: Set(Some(section.markdown)),
            metadata: Set(Some(json!({
                "source": "docling",
                "file_name": job.file_name,
                "file_size": job.file_size,
                "mimetype": "application/pdf",
                "chunk_index": index,
                "total_chunks": total_chunks,
                "embedding_model": EMBEDDING_MODEL,
            }))),
            embedding: Set(Some(PgVector::from(embedding))),
            created_at: Set(now),
            updated_at: Set(now),
            deleted_at: Set(None),
            sync_at: Set(None),
            created_by: Set(job.user_id),
            updated_by: Set(job.user_id),
        })
        .collect::<Vec<_>>();

    let txn = db.begin().await?;

    // Replace chunks from a previous upload of the same document
    entity_mod::Entity::update_many()
        .col_expr(entity_mod::Column::DeletedAt, Expr::value(now))
        .col_expr(entity_mod::Column::UpdatedBy, Expr::value(job.user_id))
        .filter(entity_mod::Column::ChunkableType.eq(job.chunkable_type.as_str()))
        .filter(entity_mod::Column::ChunkableId.eq(job.chunkable_id))
        .filter(entity_mod::Column::DeletedAt.is_null())
        .exec(&txn)
        .await?;

    entity_mod::Entity::insert_many(models).exec(&txn).await?;

    txn.commit().await?;

    Ok(total_chunks)
}

async fn convert_pdf(work_dir: &Path, pdf: &Path) -> Result<String> {
    tokio::fs::create_dir_all(work_dir).await?;
    // docling picks the input format from the extension
    let pdf_path = work_dir.join("document.pdf");
    tokio::fs::copy(pdf, &pdf_path).await?;
    docling::pdf_to_markdown(&pdf_path, work_dir).await
}

/// Parses an ATX heading line (`## Title`) into its level and text
fn parse_heading(line: &str) -> Option<(usize, String)> {
    let trimmed = line.trim_start();
    let level = trimmed.chars().take_while(|c| *c == '#').count();
    if !(1..=6).contains(&level) {
        return None;
    }
    let rest = &trimmed[level..];
    if !rest.is_empty() && !rest.starts_with(' ') {
        return None;
    }
    let text = rest.trim().trim_end_matches('#').trim();
    (!text.is_empty()).then(|| (level, text.to_string()))
}

/// Splits Markdown into chunks, tagging each with the heading path in effect where it starts
fn split_markdown(markdown: &str) -> Vec<Section> {
    let mut headings = Vec::new();
    let mut offset = 0;
    for line in markdown.split_inclusive('\n') {
        if let Some(heading) = parse_heading(line) {
            headings.push((offset, heading));
        }
        offset += line.len();
    }

    let config = ChunkConfig::new(CHUNK_CHARS)
        .with_overlap(CHUNK_OVERLAP)
        .expect("chunk overlap is smaller than the chunk size");
    let splitter = MarkdownSplitter::new(config);

    let mut stack: Vec<(usize, String)> = Vec::new();
    let mut next_heading = 0;

    splitter
        .chunk_indices(markdown)
        // docling leaves `<!-- image -->` where pictures were; a chunk of only those has nothing to embed
        .filter(|(_, chunk)| !chunk.replace(IMAGE_PLACEHOLDER, "").trim().is_empty())
        .map(|(start, chunk)| {
            // Headings the chunk opens with apply to its body, so resolve the path at the first body line
            let leading: usize = chunk
                .split_inclusive('\n')
                .take_while(|line| line.trim().is_empty() || parse_heading(line).is_some())
                .map(str::len)
                .sum();
            let body_start = start + leading;

            while next_heading < headings.len() && headings[next_heading].0 <= body_start {
                let (level, text) = headings[next_heading].1.clone();
                stack.retain(|(l, _)| *l < level);
                stack.push((level, text));
                next_heading += 1;
            }

            let title_hierarchy = (!stack.is_empty())
                .then(|| stack.iter().map(|(_, t)| t.as_str()).collect::<Vec<_>>().join(" > "));

            Section {
                markdown: chunk.to_string(),
                heading_context: stack.last().map(|(_, t)| t.clone()),
                title_hierarchy,
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tags_chunks_with_heading_path() {
        let markdown = format!(
            "<!-- image -->\n\n# Guide\n\nIntro.\n\n## A. Purpose\n\n{}\n\n## B. Steps\n\n### Step 1\n\n{}\n",
            "purpose ".repeat(200),
            "step ".repeat(100)
        );
        let sections = split_markdown(&markdown);

        assert!(sections.iter().all(|s| !s.markdown.trim().eq(IMAGE_PLACEHOLDER)));
        let last = sections.last().unwrap();
        assert_eq!(last.title_hierarchy.as_deref(), Some("Guide > B. Steps > Step 1"));
        assert_eq!(last.heading_context.as_deref(), Some("Step 1"));
        assert!(sections.iter().any(|s| s.title_hierarchy.as_deref() == Some("Guide > A. Purpose")));
    }
}
