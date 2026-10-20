use std::path::{Path, PathBuf};

use chrono::Utc;
use once_cell::sync::Lazy;
use regex::Regex;
use salvo::async_trait;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, Set};
use uuid::Uuid;

use crate::jobs::embedding::embed::PdfEmbeddingJob;
use crate::models::ai::chunk;
use crate::models::compliance::regulation_document;
use crate::services::ai::ingest::ingest_pdf;
use crate::tasks::Task;

/// `ai.chunks.chunkable_type` of regulation chunks (see `regulation_documents`)
pub const REGULATION_CHUNKABLE_TYPE: &str = "Regulation";

const DEFAULT_DIR: &str = "../legislation_regulation";

/// Regulations known to be replaced; everything else is registered as active
const REVOKED: &[(&str, i16)] = &[("53", 2023)];

static NUMBER_YEAR: Lazy<Regex> = Lazy::new(|| Regex::new(r"(\d{1,3})\D+?(\d{4})").unwrap());

/// Number and year from a file name such as `Permenristekdikti Nomor 51 Tahun 2018.pdf` or `PP_No_37_2009.pdf`
fn number_and_year(stem: &str) -> (Option<String>, Option<i16>) {
    NUMBER_YEAR
        .captures(stem)
        .map(|c| (Some(c[1].to_owned()), c[2].parse().ok()))
        .unwrap_or((None, None))
}

fn title_from(stem: &str) -> String {
    stem.replace(['_', '-'], " ").split_whitespace().collect::<Vec<_>>().join(" ")
}

pub struct IngestRegulationsTask;

#[async_trait]
impl Task for IngestRegulationsTask {
    fn name(&self) -> &str {
        "compliance:ingest-regulations"
    }

    fn description(&self) -> &str {
        "Registers every PDF in a directory (default ../legislation_regulation) in compliance.regulation_documents and embeds it into ai.chunks as chunkable_type=Regulation (--dir=PATH, --only=TEXT filters by file name, --force re-embeds documents that already have chunks)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let arg = |key: &str| args.iter().find_map(|a| a.strip_prefix(key));
        let dir = PathBuf::from(arg("--dir=").unwrap_or(DEFAULT_DIR));
        let only = arg("--only=").map(str::to_lowercase);
        let force = args.iter().any(|a| a == "--force");

        let mut files: Vec<PathBuf> = std::fs::read_dir(&dir)?
            .filter_map(|e| e.ok().map(|e| e.path()))
            .filter(|p| p.extension().is_some_and(|x| x.eq_ignore_ascii_case("pdf")))
            .filter(|p| only.as_ref().is_none_or(|o| p.file_name().is_some_and(|n| n.to_string_lossy().to_lowercase().contains(o))))
            .collect();
        files.sort();
        println!("==> {} PDF(s) in {}", files.len(), dir.display());

        let (mut done, mut skipped, mut failed) = (0, 0, 0);
        for (i, path) in files.iter().enumerate() {
            let file_name = path.file_name().unwrap().to_string_lossy().into_owned();
            let label = format!("[{}/{}] {file_name}", i + 1, files.len());
            let id = register(db, path, &file_name).await?;
            let existing = chunk::Entity::find()
                .filter(chunk::Column::ChunkableType.eq(REGULATION_CHUNKABLE_TYPE))
                .filter(chunk::Column::ChunkableId.eq(id))
                .filter(chunk::Column::DeletedAt.is_null())
                .count(db)
                .await?;
            if existing > 0 && !force {
                println!("{label}: already embedded ({existing} chunks), skipped");
                skipped += 1;
                continue;
            }
            let job = PdfEmbeddingJob {
                pdf_path: path.to_string_lossy().into_owned(),
                file_name: file_name.clone(),
                file_size: std::fs::metadata(path)?.len(),
                chunkable_type: REGULATION_CHUNKABLE_TYPE.to_owned(),
                chunkable_id: id,
                user_id: None,
            };
            match ingest_pdf(db, &job).await {
                Ok(n) => {
                    println!("{label}: {n} chunks");
                    done += 1;
                }
                Err(e) => {
                    eprintln!("{label}: FAILED: {e:#}");
                    failed += 1;
                }
            }
        }
        println!("==> embedded {done}, skipped {skipped}, failed {failed}");
        Ok(())
    }
}

/// Finds or creates the `regulation_documents` row for a file (matched on `source`), returning its id.
async fn register(db: &DatabaseConnection, path: &Path, file_name: &str) -> Result<Uuid, sea_orm::DbErr> {
    if let Some(row) = regulation_document::Entity::find()
        .filter(regulation_document::Column::Source.eq(file_name))
        .filter(regulation_document::Column::DeletedAt.is_null())
        .one(db)
        .await?
    {
        return Ok(row.id);
    }
    let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    let (number, year) = number_and_year(&stem);
    let revoked = REVOKED.iter().any(|(n, y)| number.as_deref() == Some(*n) && year == Some(*y));
    let now = Utc::now().naive_utc();
    let id = Uuid::now_v7();
    regulation_document::ActiveModel {
        id: Set(id),
        title: Set(title_from(&stem)),
        number: Set(number),
        year: Set(year),
        status: Set(if revoked { "revoked" } else { "active" }.to_owned()),
        source: Set(Some(file_name.to_owned())),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        ..Default::default()
    }
    .insert(db)
    .await?;
    Ok(id)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_number_and_year_from_file_names() {
        assert_eq!(number_and_year("Permenristekdikti Nomor 51 Tahun 2018"), (Some("51".into()), Some(2018)));
        assert_eq!(number_and_year("PP_No_37_2009"), (Some("37".into()), Some(2009)));
        assert_eq!(number_and_year("permendiktisaintek-no-10-tahun-2026"), (Some("10".into()), Some(2026)));
        assert_eq!(number_and_year("7 tahun 2020"), (Some("7".into()), Some(2020)));
        assert_eq!(number_and_year("UUD45_SatuNaskah"), (None, None));
    }

    #[test]
    fn title_collapses_separators() {
        assert_eq!(title_from("PP_No_37_2009"), "PP No 37 2009");
    }
}
