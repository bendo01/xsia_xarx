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

/// `ai.chunks.chunkable_type` of non-legal reference material (user guides); never searched as regulation
pub const GUIDE_CHUNKABLE_TYPE: &str = "Guide";

/// Stable id for a guide, derived from its file name so re-runs replace the same chunks
fn guide_id(file_name: &str) -> Uuid {
    Uuid::new_v5(&Uuid::NAMESPACE_URL, format!("xsia:guide:{file_name}").as_bytes())
}

/// Regulations known to be replaced (see `desertation/knowledge_base.md`, section 2); everything else is registered as active.
/// Each entry is (lower-case file name prefix, number, year): number and year alone collide across issuers
/// (Permendikbudristek 6/2022 is replaced, PermenPAN-RB 6/2022 is in force).
/// 44/2024 is still needed for audits before 2025, so retrieval opts in with `include_revoked`.
const REVOKED: &[(&str, &str, i16)] = &[
    ("uu_", "5", 2014),                  // UU ASN, replaced by UU 20/2023 (Pasal 76)
    ("permendikbud_", "50", 2014),       // replaced by Permenristekdikti 62/2016 (Pasal 10)
    ("permendikbud_", "81", 2014),       // replaced by Permenristekdikti 59/2018 (Pasal 25)
    ("permenristekdikti_", "44", 2015),  // replaced by Permendikbud 3/2020
    ("permenristekdikti_", "62", 2016),  // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permenristekdikti_", "63", 2016),  // replaced by Permenristekdikti 59/2018 (Pasal 25)
    ("permenristekdikti_", "55", 2017),  // replaced by Permendikbudristek 56/2022 (Pasal 33)
    ("permenristekdikti_", "51", 2018),  // replaced by Permendikbud 7/2020 (Pasal 93)
    ("permenristekdikti_", "59", 2018),  // replaced by Permendikbudristek 6/2022 (Pasal 35)
    ("permenpanrb_", "13", 2019),        // replaced by PermenPAN-RB 1/2023 (Pasal 62)
    ("permendikbud_", "3", 2020),        // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permendikbud_", "5", 2020),        // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permendikbudristek_", "6", 2022),  // replaced by Permendikbudristek 50/2024 (Pasal 27)
    ("permenristekbudristek_", "56", 2022), // replaced by Permendikbudristek 53/2023 (Pasal 106)
    ("permendikbudristek_", "53", 2023), // replaced by Permendiktisaintek 39/2025 (Pasal 117)
    ("permendikbudristek_", "44", 2024), // replaced by Permendiktisaintek 52/2025 (Pasal 67)
    ("kepmendikbudristek_", "209", 2024), // replaced by Kepmen 384/P/2024
    ("kepmendikbudristek_", "384", 2024), // replaced by Kepmendiktisaintek 63/2025
];

/// Whether a file (stem) is a known replaced regulation
fn is_revoked(stem: &str, number: Option<&str>, year: Option<i16>) -> bool {
    let stem = stem.to_lowercase();
    REVOKED.iter().any(|(prefix, n, y)| stem.starts_with(prefix) && number == Some(*n) && year == Some(*y))
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

pub struct IngestRegulationsTask;

#[async_trait]
impl Task for IngestRegulationsTask {
    fn name(&self) -> &str {
        "compliance:ingest-regulations"
    }

    fn description(&self) -> &str {
        "Registers every PDF in a directory (default ../legislation_regulation) in compliance.regulation_documents and embeds it into ai.chunks as chunkable_type=Regulation (--dir=PATH, --only=TEXT filters by file name, --force re-embeds documents that already have chunks, --type=Guide embeds user guides as chunkable_type=Guide without a regulation row)"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let arg = |key: &str| args.iter().find_map(|a| a.strip_prefix(key));
        let dir = PathBuf::from(arg("--dir=").unwrap_or(DEFAULT_DIR));
        let only = arg("--only=").map(str::to_lowercase);
        let force = args.iter().any(|a| a == "--force");
        let guide = arg("--type=").is_some_and(|t| t.eq_ignore_ascii_case("guide"));
        let chunkable_type = if guide { GUIDE_CHUNKABLE_TYPE } else { REGULATION_CHUNKABLE_TYPE };

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
            let id = if guide { guide_id(&file_name) } else { register(db, path, &file_name).await? };
            let existing = chunk::Entity::find()
                .filter(chunk::Column::ChunkableType.eq(chunkable_type))
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
                chunkable_type: chunkable_type.to_owned(),
                chunkable_id: id,
                user_id: None,
                markdown_path: None,
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
