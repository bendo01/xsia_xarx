use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder};

use crate::jobs::embedding::embed::PdfEmbeddingJob;
use crate::models::ai::chunk;
use crate::models::document::transaction::archives::{self, CHUNKABLE_TYPE};
use crate::services::ai::ingest::ingest_pdf;
use crate::services::ai::{docling, knowledge};
use crate::tasks::Task;

pub struct GenerateKnowledgebaseTask;

#[async_trait]
impl Task for GenerateKnowledgebaseTask {
    fn name(&self) -> &str {
        "compliance:generate-knowledgebase"
    }

    fn description(&self) -> &str {
        "Embeds every archive with is_knowledge = true into ai.chunks (chunkable_type=Archive); --only=TEXT filters by file name, --limit=N stops after N archives, --force re-embeds archives that already have chunks"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let arg = |key: &str| args.iter().find_map(|a| a.strip_prefix(key));
        let only = arg("--only=").map(str::to_lowercase);
        let limit = arg("--limit=").and_then(|n| n.parse::<usize>().ok());
        let force = args.iter().any(|a| a == "--force");

        if !docling::is_available().await {
            return Err(knowledge::DOCLING_MISSING_WARNING.into());
        }

        let mut rows = archives::Entity::find()
            .filter(archives::Column::IsKnowledge.eq(true))
            .filter(archives::Column::DeletedAt.is_null())
            .order_by_asc(archives::Column::Name)
            .all(db)
            .await?;
        if let Some(only) = &only {
            rows.retain(|a| a.name.to_lowercase().contains(only));
        }
        if let Some(limit) = limit {
            rows.truncate(limit);
        }
        println!("==> {} knowledge archive(s)", rows.len());

        let pb = ProgressBar::new(rows.len() as u64);
        pb.set_style(
            ProgressStyle::with_template("{bar:40.cyan/blue} {pos}/{len} [{elapsed_precise}<{eta_precise}] {msg}")
                .unwrap()
                .progress_chars("=>-"),
        );

        let (mut done, mut skipped, mut failed) = (0, 0, 0);
        for archive in &rows {
            pb.set_message(archive.name.clone());
            match embed_archive(db, archive, force, &pb).await {
                Ok(true) => done += 1,
                Ok(false) => skipped += 1,
                Err(e) => {
                    pb.println(format!("{}: FAILED: {e:#}", archive.name));
                    failed += 1;
                }
            }
            pb.inc(1);
        }
        pb.finish_and_clear();
        println!("==> embedded {done}, skipped {skipped}, failed {failed}");
        Ok(())
    }
}

/// Embeds one archive; `Ok(false)` when it was skipped
async fn embed_archive(
    db: &DatabaseConnection,
    archive: &archives::Model,
    force: bool,
    pb: &ProgressBar,
) -> Result<bool, Box<dyn std::error::Error>> {
    if archive.mimetype != "application/pdf" {
        pb.println(format!("{}: not a PDF ({}), skipped", archive.name, archive.mimetype));
        return Ok(false);
    }
    let path = knowledge::archive_path(archive);
    if !path.is_file() {
        return Err(format!("file not found: {}", path.display()).into());
    }
    let existing = chunk::Entity::find()
        .filter(chunk::Column::ChunkableType.eq(CHUNKABLE_TYPE))
        .filter(chunk::Column::ChunkableId.eq(archive.id))
        .filter(chunk::Column::DeletedAt.is_null())
        .count(db)
        .await?;
    if existing > 0 && !force {
        pb.println(format!("{}: already embedded ({existing} chunks), skipped", archive.name));
        return Ok(false);
    }
    let job = PdfEmbeddingJob {
        pdf_path: path.to_string_lossy().into_owned(),
        file_name: archive.name.clone(),
        file_size: archive.size.unwrap_or_default().max(0) as u64,
        chunkable_type: CHUNKABLE_TYPE.to_owned(),
        chunkable_id: archive.id,
        user_id: None,
        markdown_path: Some(knowledge::markdown_path(archive).to_string_lossy().into_owned()),
    };
    let n = ingest_pdf(db, &job).await?;
    pb.println(format!("{}: {n} chunks", archive.name));
    Ok(true)
}
