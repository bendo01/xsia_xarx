//! Hybrid compliance anomaly detection over `feeder_master` data: explicit regulation
//! [`rules`] plus unsupervised outlier detectors ([`iforest`], [`lof`], [`autoencoder`]) combined by
//! soft voting ([`ensemble`]) per semester, scored by [`metrics`].
//!
//! Detections map onto `compliance.anomaly_events` (detector, rule_code, score, severity, evidence).

pub mod autoencoder;
pub mod ensemble;
pub mod features;
pub mod iforest;
pub mod loaders;
pub mod lof;
pub mod metrics;
pub mod rules;

use iforest::IsolationForest;
use rules::RuleConfig;
use serde_json::Value;
use uuid::Uuid;

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Severity {
    Low,
    Medium,
    High,
}

impl Severity {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Low => "low",
            Self::Medium => "medium",
            Self::High => "high",
        }
    }

    /// Maps an outlier score in `[0, 1]` to a severity band.
    pub fn from_score(score: f64) -> Self {
        if score >= 0.8 {
            Self::High
        } else if score >= 0.6 {
            Self::Medium
        } else {
            Self::Low
        }
    }
}

/// One flagged entity, ready to be persisted as an `anomaly_events` row.
#[derive(Clone, Debug)]
pub struct Detection {
    pub entity_type: &'static str,
    pub entity_id: Uuid,
    /// `rule` | `hybrid` (soft vote of Isolation Forest, LOF and autoencoder)
    pub detector: &'static str,
    pub rule_code: Option<&'static str>,
    pub score: f64,
    pub severity: Severity,
    pub evidence: Value,
}

/// A lecturer's teaching load in one semester (distinct classes, SKS summed).
#[derive(Clone, Debug)]
pub struct LecturerLoad {
    pub lecturer_id: Uuid,
    pub semester: String,
    pub credits: f64,
    pub classes: u32,
}

/// A class with its registered capacity and enrolment.
#[derive(Clone, Debug)]
pub struct ClassEnrolment {
    pub class_id: Uuid,
    pub capacity: i32,
    pub enrolled: i32,
    pub semester: Option<String>,
    pub sks: Option<f64>,
    /// Share of KRS students who received a grade (1.0 when unknown)
    pub graded_ratio: f64,
}

/// A student's academic record in one semester.
#[derive(Clone, Debug)]
pub struct StudentTerm {
    pub student_id: Uuid,
    pub semester: String,
    pub ips: f64,
    pub ipk: f64,
    pub sks_semester: f64,
    pub sks_total: f64,
    pub tuition: f64,
}

/// A student's enrolment span.
#[derive(Clone, Debug)]
pub struct StudentSpan {
    pub student_id: Uuid,
    /// Years since entry (to exit date if the student left, otherwise to the reference date)
    pub years: f64,
    pub active: bool,
}

/// Detector weights for the soft vote, in the order Isolation Forest, LOF, autoencoder.
#[derive(Clone, Copy, Debug)]
pub struct EnsembleConfig {
    pub weights: [f64; 3],
    pub epochs: usize,
    /// Autoencoder training rows per semester are capped to keep training fast
    pub max_train_rows: usize,
}

impl Default for EnsembleConfig {
    fn default() -> Self {
        Self { weights: [1.0, 1.0, 1.0], epochs: 100, max_train_rows: 5_000 }
    }
}

/// Semesters smaller than this are not scored by the ML detectors.
const MIN_GROUP_ROWS: usize = 20;

/// Scores every row of one semester with the three detectors and returns the soft-voted score per row.
/// Also returns the per-detector normalised scores (`[iforest, lof, autoencoder]`) for the evidence.
fn score_group(rows: &[Vec<f64>], cfg: &EnsembleConfig, seed: u64) -> (Vec<f64>, [Vec<f64>; 3]) {
    let forest = IsolationForest::fit(rows, 100, 256, seed);
    let iso: Vec<f64> = rows.iter().map(|r| forest.score(r)).collect();
    let lof_score: Vec<f64> = lof::scores(rows, 20.min(rows.len() - 1)).into_iter().map(|l| (1.0 - 1.0 / l.max(1.0)).clamp(0.0, 1.0)).collect();
    let ae = match autoencoder::Autoencoder::fit(rows, cfg.epochs, 0.01, cfg.max_train_rows, seed) {
        Some(model) => ensemble::percentile_rank(&model.errors(rows)),
        None => vec![0.0; rows.len()],
    };
    let vote = ensemble::soft_vote(&[(cfg.weights[0], &iso), (cfg.weights[1], &lof_score), (cfg.weights[2], &ae)]);
    (vote, [iso, lof_score, ae])
}

/// Flags, within each semester, the `top_fraction` highest soft-voted rows as `hybrid` detections.
/// Entities already flagged by a rule are skipped via `skip`.
fn ml_detections(
    set: &features::FeatureSet,
    cfg: &EnsembleConfig,
    top_fraction: f64,
    seed: u64,
    skip: &std::collections::HashSet<Uuid>,
) -> Vec<Detection> {
    let mut by_group: std::collections::BTreeMap<&str, Vec<usize>> = std::collections::BTreeMap::new();
    for (i, g) in set.groups.iter().enumerate() {
        by_group.entry(g.as_str()).or_default().push(i);
    }
    let mut out = Vec::new();
    for (semester, members) in by_group {
        if members.len() < MIN_GROUP_ROWS {
            continue;
        }
        let rows: Vec<Vec<f64>> = members.iter().map(|&i| set.rows[i].clone()).collect();
        let (vote, parts) = score_group(&rows, cfg, seed);
        let take = ((rows.len() as f64) * top_fraction).ceil() as usize;
        let mut order: Vec<usize> = (0..rows.len()).collect();
        order.sort_by(|&a, &b| vote[b].total_cmp(&vote[a]));
        for &k in order.iter().take(take) {
            let i = members[k];
            if skip.contains(&set.ids[i]) {
                continue;
            }
            let features: serde_json::Map<String, Value> = set.names.iter().zip(&set.rows[i]).map(|(n, v)| ((*n).to_owned(), Value::from(*v))).collect();
            out.push(Detection {
                entity_type: set.entity_type,
                entity_id: set.ids[i],
                detector: "hybrid",
                rule_code: None,
                score: vote[k],
                severity: Severity::from_score(vote[k]),
                evidence: serde_json::json!({
                    "semester": semester,
                    "features": features,
                    "scores": { "iforest": parts[0][k], "lof": parts[1][k], "autoencoder": parts[2][k] },
                }),
            });
        }
    }
    out.sort_by(|a, b| b.score.total_cmp(&a.score));
    out
}

/// Everything one detection run needs, already loaded.
pub struct Inputs {
    pub loads: Vec<LecturerLoad>,
    pub classes: Vec<ClassEnrolment>,
    pub students: Vec<StudentSpan>,
    pub student_terms: Vec<StudentTerm>,
}

/// Runs the rules, then the ML ensemble per semester on lecturers, classes and student terms.
/// Lecturers and classes the rules already flagged are not flagged again; student terms are a
/// different granularity from the study-period rule, so they are scored independently.
pub fn detect(inputs: &Inputs, rule_cfg: &RuleConfig, cfg: &EnsembleConfig, top_fraction: f64, seed: u64) -> Vec<Detection> {
    let mut out = rules::lecturer_overload(&inputs.loads, rule_cfg);
    out.extend(rules::class_over_capacity(&inputs.classes));
    out.extend(rules::study_period_exceeded(&inputs.students, rule_cfg));
    let flagged: std::collections::HashSet<Uuid> = out.iter().map(|d| d.entity_id).collect();
    let none = std::collections::HashSet::new();

    out.extend(ml_detections(&features::lecturers(&inputs.loads), cfg, top_fraction, seed, &flagged));
    out.extend(ml_detections(&features::classes(&inputs.classes), cfg, top_fraction, seed, &flagged));
    out.extend(ml_detections(&features::student_terms(&inputs.student_terms), cfg, top_fraction, seed, &none));
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    fn load(semester: &str, credits: f64, classes: u32) -> LecturerLoad {
        LecturerLoad { lecturer_id: Uuid::new_v4(), semester: semester.into(), credits, classes }
    }

    #[test]
    fn outlier_is_flagged_in_its_own_semester_only() {
        // Semester A: 40 ordinary lecturers plus one extreme; semester B: 25 ordinary lecturers
        let mut loads: Vec<LecturerLoad> = (0..40).map(|i| load("20231", 8.0 + f64::from(i % 5), 3 + i % 2)).collect();
        let outlier = load("20231", 15.0, 12);
        let outlier_id = outlier.lecturer_id;
        loads.push(outlier);
        loads.extend((0..25).map(|i| load("20232", 8.0 + f64::from(i % 5), 3 + i % 2)));
        let inputs = Inputs { loads, classes: vec![], students: vec![], student_terms: vec![] };
        let cfg = EnsembleConfig { epochs: 50, ..EnsembleConfig::default() };
        let rule_cfg = RuleConfig { max_lecturer_credits: 100.0, ..RuleConfig::default() };
        let found = detect(&inputs, &rule_cfg, &cfg, 0.05, 1);
        assert!(found.iter().any(|d| d.entity_id == outlier_id && d.detector == "hybrid"));
        assert!(found.iter().all(|d| d.evidence["scores"]["autoencoder"].is_number()));
    }
}
