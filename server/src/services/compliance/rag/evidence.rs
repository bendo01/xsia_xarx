//! Links detected anomalies to the regulation text that governs them.

use anyhow::Result;
use sea_orm::DatabaseConnection;

use super::Hit;
use super::retrieve::{self, Options};
use crate::services::compliance::anomaly::Detection;

/// The question to ask the retriever for a rule; `None` for ML detections, which have no single rule.
pub fn regulation_query(rule_code: &str) -> Option<&'static str> {
    match rule_code {
        "LECTURER_SKS_MAX" => Some("beban kerja dosen paling banyak 16 SKS pada setiap semester"),
        "CLASS_CAPACITY_MAX" => Some("daya tampung jumlah mahasiswa rasio dosen mahasiswa program studi"),
        "STUDENT_STUDY_PERIOD_MAX" => Some("masa studi mahasiswa paling lama tahun batas waktu penyelesaian studi"),
        _ => None,
    }
}

/// Regulation chunks that back a detection, or empty for detections without a rule code.
pub async fn regulation_for(db: &DatabaseConnection, detection: &Detection, top_k: usize) -> Result<Vec<Hit>> {
    match detection.rule_code.and_then(regulation_query) {
        Some(q) => retrieve::search(db, q, Options { top_k, ..Options::default() }).await,
        None => Ok(Vec::new()),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn every_rule_has_a_regulation_query() {
        for code in ["LECTURER_SKS_MAX", "CLASS_CAPACITY_MAX", "STUDENT_STUDY_PERIOD_MAX"] {
            assert!(regulation_query(code).is_some(), "{code}");
        }
        assert!(regulation_query("unknown").is_none());
    }
}
