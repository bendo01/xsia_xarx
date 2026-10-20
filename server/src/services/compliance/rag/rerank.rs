//! Second-stage reranking of fused candidates. Pure and model-free: it rescues what rank fusion
//! cannot see, namely whether a chunk actually covers the words of the question
//! (e.g. a lecturer-load question should not be answered by a student-load chunk).
//!
//! score = W_FUSED·fused + W_COVERAGE·coverage + W_PHRASE·phrase + W_NUMBER·numbers − penalties

use super::Hit;
use super::fusion::query_terms;

const W_FUSED: f64 = 0.20;
const W_COVERAGE: f64 = 0.45;
const W_PHRASE: f64 = 0.25;
const W_NUMBER: f64 = 0.10;

/// Elucidation chunks ("Cukup jelas") explain a pasal but are not the rule itself
const ELUCIDATION_PENALTY: f64 = 0.15;

fn words(text: &str) -> Vec<String> {
    text.to_lowercase().split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).map(str::to_owned).collect()
}

/// Share of the question's terms that appear in the chunk.
fn coverage(terms: &[String], body: &std::collections::HashSet<&str>) -> f64 {
    if terms.is_empty() {
        return 0.0;
    }
    terms.iter().filter(|t| body.contains(t.as_str())).count() as f64 / terms.len() as f64
}

/// Share of adjacent term pairs of the question that also sit next to each other in the chunk.
fn phrase(terms: &[String], body: &[String]) -> f64 {
    if terms.len() < 2 {
        return 0.0;
    }
    let pairs: Vec<_> = terms.windows(2).collect();
    let hit = pairs.iter().filter(|p| body.windows(2).any(|b| b[0] == p[0] && b[1] == p[1])).count();
    hit as f64 / pairs.len() as f64
}

/// Share of numbers in the question (limits such as `16`) found in the chunk.
fn numbers(terms: &[String], body: &std::collections::HashSet<&str>) -> f64 {
    let nums: Vec<_> = terms.iter().filter(|t| t.chars().all(|c| c.is_ascii_digit())).collect();
    if nums.is_empty() {
        return 0.0;
    }
    nums.iter().filter(|n| body.contains(n.as_str())).count() as f64 / nums.len() as f64
}

/// Reorders `hits` by the combined score and stores it in `Hit::score`.
pub fn rerank(query: &str, hits: Vec<Hit>) -> Vec<Hit> {
    let terms = query_terms(query);
    let max_fused = hits.iter().map(|h| h.score).fold(0.0_f64, f64::max);
    let mut scored: Vec<Hit> = hits
        .into_iter()
        .map(|mut h| {
            let body_words = words(h.body());
            let set: std::collections::HashSet<&str> = body_words.iter().map(String::as_str).collect();
            let fused = if max_fused > 0.0 { h.score / max_fused } else { 0.0 };
            let mut s = W_FUSED * fused + W_COVERAGE * coverage(&terms, &set) + W_PHRASE * phrase(&terms, &body_words) + W_NUMBER * numbers(&terms, &set);
            if h.body().to_lowercase().contains("cukup jelas") {
                s -= ELUCIDATION_PENALTY;
            }
            h.score = s;
            h
        })
        .collect();
    scored.sort_by(|a, b| b.score.total_cmp(&a.score));
    scored
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn hit(content: &str, score: f64) -> Hit {
        Hit {
            chunk_id: Uuid::new_v4(),
            regulation_id: Uuid::nil(),
            regulation: "R".into(),
            number: None,
            year: None,
            status: "active".into(),
            heading: Some("Pasal 1".into()),
            content: format!("Pasal 1\n\n{content}"),
            score,
        }
    }

    #[test]
    fn topical_chunk_beats_higher_fused_off_topic_chunk() {
        let off = hit("Distribusi beban belajar mahasiswa paling banyak 24 satuan kredit semester", 0.03);
        let on = hit("beban kerja dosen paling banyak 16 (enam belas) SKS pada setiap semester", 0.029);
        let out = rerank("beban kerja dosen paling banyak 16 SKS per semester", vec![off, on]);
        assert!(out[0].content.contains("dosen"));
    }

    #[test]
    fn elucidation_is_demoted() {
        let a = hit("Ayat (1) Cukup jelas. beban kerja dosen", 0.03);
        let b = hit("beban kerja dosen", 0.03);
        let out = rerank("beban kerja dosen", vec![a, b]);
        assert!(!out[0].content.contains("Cukup jelas"));
    }

    #[test]
    fn empty_and_single_inputs_are_fine() {
        assert!(rerank("x", vec![]).is_empty());
        assert_eq!(rerank("", vec![hit("abc", 0.0)]).len(), 1);
    }
}
