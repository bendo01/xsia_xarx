use std::path::{Path, PathBuf};

use chrono::Utc;
use once_cell::sync::Lazy;
use regex::Regex;
use salvo::async_trait;
use sea_orm::{ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, Set};
use uuid::Uuid;

use crate::jobs::embedding::embed::{PdfEmbeddingJob, enqueue_pdf_embedding, is_queued};
use crate::models::ai::chunk;
use crate::models::compliance::regulation_document;
use crate::services::ai::ingest::ingest_pdf;
use crate::tasks::Task;

/// `ai.chunks.chunkable_type` of regulation chunks (see `regulation_documents`)
pub const REGULATION_CHUNKABLE_TYPE: &str = "Regulation";

const DEFAULT_DIR: &str = "../legislation_regulation";

/// Where the embedding worker's private copies live; override with `AI_UPLOAD_DIR`
const DEFAULT_UPLOAD_DIR: &str = "storage/ai/uploads";

/// `ai.chunks.chunkable_type` of non-legal reference material (user guides); never searched as regulation
pub const GUIDE_CHUNKABLE_TYPE: &str = "Guide";

/// Stable id for a guide, derived from its file name so re-runs replace the same chunks
fn guide_id(file_name: &str) -> Uuid {
    Uuid::new_v5(&Uuid::NAMESPACE_URL, format!("xsia:guide:{file_name}").as_bytes())
}

/// Regulations known to be replaced (see `desertation/knowledge_base.md`, section 2); everything else is registered as active.
/// Each entry is (lower-case issuer, number, year), where the issuer is one `_`-separated word of the file name
/// (`Tahun_2022_Permendikbudristek_No_06`): number and year alone collide across issuers
/// (Permendikbudristek 6/2022 is replaced, PermenPAN-RB 6/2022 is in force).
/// 44/2024 is still needed for audits before 2025, so retrieval opts in with `include_revoked`.
const REVOKED: &[(&str, &str, i16)] = &[
    ("uu", "5", 2014),                  // UU ASN, replaced by UU 20/2023 (Pasal 76)
    ("permendikbud", "50", 2014),       // replaced by Permenristekdikti 62/2016 (Pasal 10)
    ("permendikbud", "81", 2014),       // replaced by Permenristekdikti 59/2018 (Pasal 25)
    ("permenristekdikti", "44", 2015),  // replaced by Permendikbud 3/2020
    ("permenristekdikti", "62", 2016),  // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permenristekdikti", "63", 2016),  // replaced by Permenristekdikti 59/2018 (Pasal 25)
    ("permenristekdikti", "55", 2017),  // replaced by Permendikbudristek 56/2022 (Pasal 33)
    ("permenristekdikti", "51", 2018),  // replaced by Permendikbud 7/2020 (Pasal 93)
    ("permenristekdikti", "59", 2018),  // replaced by Permendikbudristek 6/2022 (Pasal 35)
    ("permenpanrb", "13", 2019),        // replaced by PermenPAN-RB 1/2023 (Pasal 62)
    ("permendikbud", "3", 2020),        // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permendikbud", "5", 2020),        // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permendikbudristek", "6", 2022),  // replaced by Permendikbudristek 50/2024 (Pasal 27)
    ("permenristekbudristek", "56", 2022), // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permendikbudristek", "53", 2023), // replaced by Permendiktisaintek 39/2025 (Pasal 117)
    ("permendikbudristek", "44", 2024), // replaced by Permendiktisaintek 52/2025 (Pasal 67)
    ("kepmendikbudristek", "209", 2024), // replaced by Kepmen 384/P/2024
    ("kepmendikbudristek", "384", 2024), // replaced by Kepmendiktisaintek 63/2025
];

/// Whether a file (stem) is a known replaced regulation
fn is_revoked(stem: &str, number: Option<&str>, year: Option<i16>) -> bool {
    let stem = stem.to_lowercase();
    let words: Vec<&str> = stem.split(['_', ' ', '-']).collect();
    REVOKED.iter().any(|(issuer, n, y)| words.contains(issuer) && number == Some(*n) && year == Some(*y))
}

/// `UU_Tahun_2003_No_20` or `Permendikbud_2014_No_81`: year before number
static YEAR_NUMBER: Lazy<Regex> = Lazy::new(|| Regex::new(r"(?i)(?:tahun\D*)?(\d{4})\D+(?:no|nomor)\D*(\d{1,3})").unwrap());
/// `Permenristekdikti Nomor 51 Tahun 2018`: number before year
static NUMBER_YEAR: Lazy<Regex> = Lazy::new(|| Regex::new(r"(\d{1,3})\D+?(\d{4})").unwrap());

/// Number and year from a file name such as `UU_Tahun_2003_No_20.pdf`, `Permenristekdikti Nomor 51 Tahun 2018.pdf` or `PP_No_37_2009.pdf`.
/// Leading zeros of the number are dropped (`No_04` is `4`).
fn number_and_year(stem: &str) -> (Option<String>, Option<i16>) {
    let (number, year) = match YEAR_NUMBER.captures(stem) {
        Some(c) => (c[2].to_owned(), c[1].to_owned()),
        None => match NUMBER_YEAR.captures(stem) {
            Some(c) => (c[1].to_owned(), c[2].to_owned()),
            None => return (None, None),
        },
    };
    let number = number.trim_start_matches('0');
    (Some(if number.is_empty() { "0" } else { number }.to_owned()), year.parse().ok())
}

fn title_from(stem: &str) -> String {
    stem.replace(['_', '-'], " ").split_whitespace().collect::<Vec<_>>().join(" ")
}

/// Where the regulation PDFs live; override with `REGULATION_DIR`
pub fn default_dir() -> PathBuf {
    PathBuf::from(std::env::var("REGULATION_DIR").unwrap_or_else(|_| DEFAULT_DIR.to_owned()))
}

/// PDFs directly inside `dir`, sorted by name; `only` keeps file names containing the (lower-case) text
pub fn list_pdfs(dir: &Path, only: Option<&str>) -> std::io::Result<Vec<PathBuf>> {
    let mut files: Vec<PathBuf> = std::fs::read_dir(dir)?
        .filter_map(|e| e.ok().map(|e| e.path()))
        .filter(|p| p.extension().is_some_and(|x| x.eq_ignore_ascii_case("pdf")))
        .filter(|p| only.is_none_or(|o| p.file_name().is_some_and(|n| n.to_string_lossy().to_lowercase().contains(o))))
        .collect();
    files.sort();
    Ok(files)
}

pub struct IngestOptions {
    pub dir: PathBuf,
    pub only: Option<String>,
    pub force: bool,
    pub guide: bool,
    pub user_id: Option<Uuid>,
}

/// Registers every PDF of `opts.dir` and embeds it into `ai.chunks`. Returns (done, skipped, failed).
/// Documents that already have chunks are skipped unless `opts.force` is set; with `force` a document's old
/// chunks are replaced when its new ones are stored, so the knowledge base stays searchable meanwhile.
pub async fn ingest_directory(
    db: &DatabaseConnection,
    opts: &IngestOptions,
) -> Result<(usize, usize, usize), Box<dyn std::error::Error>> {
    let chunkable_type = if opts.guide { GUIDE_CHUNKABLE_TYPE } else { REGULATION_CHUNKABLE_TYPE };
    if !opts.guide && opts.only.is_none() {
        let retired = retire_missing_files(db, &opts.dir).await?;
        if retired > 0 {
            println!("==> retired {retired} registered regulation(s) whose file is gone and that have no chunks");
        }
    }
    let files = list_pdfs(&opts.dir, opts.only.as_deref())?;
    println!("==> {} PDF(s) in {}", files.len(), opts.dir.display());

    let (mut done, mut skipped, mut failed) = (0, 0, 0);
    for (i, path) in files.iter().enumerate() {
        let file_name = path.file_name().unwrap().to_string_lossy().into_owned();
        let label = format!("[{}/{}] {file_name}", i + 1, files.len());
        let outcome = ingest_file(db, opts, path, &file_name, chunkable_type, &label).await;
        match &outcome {
            Ok(Some(_)) => done += 1,
            Ok(None) => skipped += 1,
            Err(e) => {
                eprintln!("{label}: FAILED: {e:#}");
                failed += 1;
            }
        }
    }
    println!("==> embedded {done}, skipped {skipped}, failed {failed}");
    Ok((done, skipped, failed))
}

/// Embeds one file; `Ok(None)` when it already has chunks and `force` is off
async fn ingest_file(
    db: &DatabaseConnection,
    opts: &IngestOptions,
    path: &Path,
    file_name: &str,
    chunkable_type: &str,
    label: &str,
) -> Result<Option<usize>, Box<dyn std::error::Error>> {
    let id = if opts.guide { guide_id(file_name) } else { register(db, path, file_name).await? };
    let existing = chunk::Entity::find()
        .filter(chunk::Column::ChunkableType.eq(chunkable_type))
        .filter(chunk::Column::ChunkableId.eq(id))
        .filter(chunk::Column::DeletedAt.is_null())
        .count(db)
        .await?;
    if existing > 0 && !opts.force {
        println!("{label}: already embedded ({existing} chunks), skipped");
        return Ok(None);
    }
    let job = PdfEmbeddingJob {
        pdf_path: path.to_string_lossy().into_owned(),
        file_name: file_name.to_owned(),
        file_size: std::fs::metadata(path)?.len(),
        chunkable_type: chunkable_type.to_owned(),
        chunkable_id: id,
        user_id: opts.user_id,
        markdown_path: None,
    };
    let n = ingest_pdf(db, &job).await?;
    println!("{label}: {n} chunks");
    Ok(Some(n))
}

/// A PDF that was not queued, with the reason
pub struct SkippedFile {
    pub name: String,
    pub reason: String,
}

/// Registers every PDF of `dir` and queues it on the PGMQ embedding queue; the worker converts and embeds
/// it (replacing the document's old chunks). Documents that already have chunks are skipped unless `force`,
/// and so are documents that already wait in the queue. Returns the number of queued PDFs and the skipped ones.
pub async fn enqueue_directory(
    db: &DatabaseConnection,
    queue: &pgmq::PGMQueueExt,
    dir: &Path,
    force: bool,
    user_id: Option<Uuid>,
) -> Result<(usize, Vec<SkippedFile>), Box<dyn std::error::Error>> {
    let upload_dir = std::env::var("AI_UPLOAD_DIR").map(PathBuf::from).unwrap_or_else(|_| PathBuf::from(DEFAULT_UPLOAD_DIR));
    tokio::fs::create_dir_all(&upload_dir).await?;

    retire_missing_files(db, dir).await?;
    let (mut queued, mut skipped) = (0, Vec::new());
    for path in list_pdfs(dir, None)? {
        let file_name = path.file_name().unwrap().to_string_lossy().into_owned();
        let skip = |reason: &str| SkippedFile { name: file_name.clone(), reason: reason.to_owned() };
        let id = register(db, &path, &file_name).await?;

        let existing = chunk::Entity::find()
            .filter(chunk::Column::ChunkableType.eq(REGULATION_CHUNKABLE_TYPE))
            .filter(chunk::Column::ChunkableId.eq(id))
            .filter(chunk::Column::DeletedAt.is_null())
            .count(db)
            .await?;
        if existing > 0 && !force {
            skipped.push(skip("already embedded"));
            continue;
        }
        if is_queued(db, id).await? {
            skipped.push(skip("already in the queue"));
            continue;
        }

        // The worker deletes its PDF when the job finishes, so it gets its own copy
        let pdf_path = upload_dir.join(format!("{}.pdf", Uuid::now_v7()));
        tokio::fs::copy(&path, &pdf_path).await?;
        let job = PdfEmbeddingJob {
            pdf_path: pdf_path.to_string_lossy().into_owned(),
            file_name: file_name.clone(),
            file_size: std::fs::metadata(&path)?.len(),
            chunkable_type: REGULATION_CHUNKABLE_TYPE.to_owned(),
            chunkable_id: id,
            user_id,
            markdown_path: None,
        };
        match enqueue_pdf_embedding(queue, &job).await {
            Ok(_) => queued += 1,
            Err(e) => {
                let _ = tokio::fs::remove_file(&pdf_path).await;
                skipped.push(skip(&e.to_string()));
            }
        }
    }
    Ok((queued, skipped))
}

pub struct IngestRegulationsTask;

#[async_trait]
impl Task for IngestRegulationsTask {
    fn name(&self) -> &str {
        "compliance:ingest-regulations"
    }

    fn description(&self) -> &str {
        "Registers every PDF in a directory (default ../legislation_regulation, or REGULATION_DIR) in compliance.regulation_documents and embeds it into ai.chunks as chunkable_type=Regulation (--dir=PATH, --only=TEXT filters by file name, --force re-embeds documents that already have chunks, --type=Guide embeds user guides as chunkable_type=Guide without a regulation row)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let arg = |key: &str| args.iter().find_map(|a| a.strip_prefix(key));
        let opts = IngestOptions {
            dir: arg("--dir=").map(PathBuf::from).unwrap_or_else(default_dir),
            only: arg("--only=").map(str::to_lowercase),
            force: args.iter().any(|a| a == "--force"),
            guide: arg("--type=").is_some_and(|t| t.eq_ignore_ascii_case("guide")),
            user_id: None,
        };
        ingest_directory(db, &opts).await?;
        Ok(())
    }
}

/// Soft-deletes registered regulations whose file is no longer in `dir` and that have no chunks, so a renamed
/// file is registered once under its new name instead of leaving an empty row under the old one.
/// A regulation that already has chunks is kept even when its file is gone. Returns how many rows were retired.
pub async fn retire_missing_files(db: &DatabaseConnection, dir: &Path) -> Result<usize, sea_orm::DbErr> {
    let rows = regulation_document::Entity::find()
        .filter(regulation_document::Column::DeletedAt.is_null())
        .filter(regulation_document::Column::Source.is_not_null())
        .all(db)
        .await?;
    let mut retired = 0;
    for row in rows {
        let Some(source) = row.source.clone() else { continue };
        if dir.join(&source).is_file() {
            continue;
        }
        let chunks = chunk::Entity::find()
            .filter(chunk::Column::ChunkableType.eq(REGULATION_CHUNKABLE_TYPE))
            .filter(chunk::Column::ChunkableId.eq(row.id))
            .filter(chunk::Column::DeletedAt.is_null())
            .count(db)
            .await?;
        if chunks > 0 {
            continue;
        }
        let now = Utc::now().naive_utc();
        let mut active: regulation_document::ActiveModel = row.into();
        active.deleted_at = Set(Some(now));
        active.updated_at = Set(Some(now));
        active.update(db).await?;
        retired += 1;
    }
    Ok(retired)
}

/// Finds or creates the `regulation_documents` row for a file (matched on `source`), returning its id.
async fn register(db: &DatabaseConnection, path: &Path, file_name: &str) -> Result<Uuid, sea_orm::DbErr> {
    if let Some(row) = regulation_document::Entity::find()
        .filter(regulation_document::Column::Source.eq(file_name))
        .filter(regulation_document::Column::DeletedAt.is_null())
        .one(db)
        .await?
    {
        // Keep the status in step with REVOKED so a rebuild fixes rows registered before the list grew
        let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
        let (number, year) = number_and_year(&stem);
        let status = if is_revoked(&stem, number.as_deref(), year) { "revoked" } else { "active" };
        if row.status != status {
            let id = row.id;
            let mut active: regulation_document::ActiveModel = row.into();
            active.status = Set(status.to_owned());
            active.updated_at = Set(Some(Utc::now().naive_utc()));
            active.update(db).await?;
            return Ok(id);
        }
        return Ok(row.id);
    }
    let stem = path.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default();
    let (number, year) = number_and_year(&stem);
    let revoked = is_revoked(&stem, number.as_deref(), year);
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
        assert_eq!(number_and_year("UU_Tahun_2003_No_20"), (Some("20".into()), Some(2003)));
        assert_eq!(number_and_year("PP_Tahun_2014_No_04"), (Some("4".into()), Some(2014)));
        assert_eq!(number_and_year("Perpres_Tahun_2026_No_007"), (Some("7".into()), Some(2026)));
        assert_eq!(number_and_year("permendiktisaintek_Tahun_2025_No_39"), (Some("39".into()), Some(2025)));
        assert_eq!(number_and_year("Permenristekdikti_No_44_Tahun_2015"), (Some("44".into()), Some(2015)));
        assert_eq!(number_and_year("UUD_1945"), (None, None));
        assert_eq!(number_and_year("Tahun_1945_UUD"), (None, None));
        assert_eq!(number_and_year("Tahun_2003_UU_No_20"), (Some("20".into()), Some(2003)));
        assert_eq!(number_and_year("Tahun_2014_PP_No_04"), (Some("4".into()), Some(2014)));
        assert_eq!(number_and_year("Tahun_2026_Perpres_No_007"), (Some("7".into()), Some(2026)));
        assert_eq!(number_and_year("Tahun_2023_Peraturan_BKN_Nomor_03"), (Some("3".into()), Some(2023)));
        assert_eq!(number_and_year("Tahun_2024_Kepmendikbudristek_No_384_P"), (Some("384".into()), Some(2024)));
        assert_eq!(number_and_year("Tahun_2022_PermenPANRB_No_6"), (Some("6".into()), Some(2022)));
        assert_eq!(number_and_year("Permendikbud_2014_No_81"), (Some("81".into()), Some(2014)));
        assert_eq!(number_and_year("Peraturan_BKN_Tahun 2023_Nomor_03"), (Some("3".into()), Some(2023)));
        assert_eq!(number_and_year("Kepmendikbudristek_Tahun_2024_No_384_P"), (Some("384".into()), Some(2024)));
    }

    #[test]
    fn revoked_list_matches_file_names() {
        let revoked = |stem: &str| {
            let (n, y) = number_and_year(stem);
            is_revoked(stem, n.as_deref(), y)
        };
        assert!(revoked("Permendikbud_Tahun_2020_No_03"));
        assert!(revoked("Permendikbudristek_Tahun_2022_No_06"));
        assert!(revoked("Permenristekdikti_Tahun_2015_No_44"));
        assert!(revoked("Permendikbud_Tahun_2014_No_81"));
        assert!(revoked("PermenPANRB_Tahun_2019_No_13"));
        assert!(revoked("Kepmendikbudristek_2024_No_209"));
        // New file names: `Tahun_YYYY_Jenis_No_NN`
        assert!(revoked("Tahun_2020_Permendikbud_No_03"));
        assert!(revoked("Tahun_2022_Permendikbudristek_No_06"));
        assert!(revoked("Tahun_2014_UU_No_05"));
        assert!(revoked("Tahun_2022_Permenristekbudristek_No_56"));
        assert!(revoked("Tahun_2024_Kepmendikbudristek_No_384_P"));
        assert!(!revoked("Tahun_2022_PermenPANRB_No_6"));
        assert!(!revoked("Tahun_2020_Permendikbud_No_07"));
        assert!(!revoked("Tahun_2025_Kepmendiktisaintek_No_63"));
        assert!(!revoked("Tahun_2023_UU_No_20"));
        assert!(!revoked("PermenPANRB_Tahun_2022_No_6"));
        assert!(!revoked("PermenPANRB_Tahun_2023_No_01"));
        assert!(!revoked("Permendiktisaintek_Tahun_2025_No_52"));
        assert!(!revoked("Permendikbud_Tahun_2020_No_07"));
        assert!(!revoked("Kepmendiktisaintek_Tahun_2025_No_63"));
    }

    #[test]
    fn guide_id_is_stable_per_file_name() {
        assert_eq!(guide_id("a.pdf"), guide_id("a.pdf"));
        assert_ne!(guide_id("a.pdf"), guide_id("b.pdf"));
    }

    #[test]
    fn title_collapses_separators() {
        assert_eq!(title_from("PP_No_37_2009"), "PP No 37 2009");
    }
}
