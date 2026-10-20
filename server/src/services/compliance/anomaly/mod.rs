//! Hybrid compliance anomaly detection over `feeder_master` data: explicit regulation
//! [`rules`] plus unsupervised outlier detectors ([`iforest`], [`lof`]), scored by [`metrics`].
//!
//! Detections map onto `compliance.anomaly_events` (detector, rule_code, score, severity, evidence).

pub mod iforest;
pub mod loaders;
pub mod lof;
pub mod metrics;
pub mod rules;

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
    /// `rule` | `iforest` | `lof` | `hybrid`
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
}

/// A student's enrolment span.
#[derive(Clone, Debug)]
pub struct StudentSpan {
    pub student_id: Uuid,
    /// Years since entry (to exit date if the student left, otherwise to the reference date)
    pub years: f64,
    pub active: bool,
}

use crate::services::compliance::anomaly::{iforest::IsolationForest, rules::RuleConfig};

/// Flags the `top_fraction` highest-scoring rows by Isolation Forest and LOF as `detector` detections.
/// Rows already flagged by a rule are skipped by the caller via `skip`.
fn ml_detections(
    entity_type: &'static str,
    ids: &[Uuid],
    rows: &[Vec<f64>],
    top_fraction: f64,
    seed: u64,
    skip: &std::collections::HashSet<Uuid>,
    describe: impl Fn(usize) -> Value,
) -> Vec<Detection> {
    if rows.len() < 20 {
        return Vec::new();
    }
    let forest = IsolationForest::fit(rows, 100, 256, seed);
    let iso: Vec<f64> = rows.iter().map(|r| forest.score(r)).collect();
    let lof_raw = lof::scores(rows, 20.min(rows.len() - 1));
    let take = ((rows.len() as f64) * top_fraction).ceil() as usize;
    let top = |scores: &[f64]| -> std::collections::HashSet<usize> {
        let mut idx: Vec<usize> = (0..scores.len()).collect();
        idx.sort_by(|&a, &b| scores[b].total_cmp(&scores[a]));
        idx.into_iter().take(take).collect()
    };
    let (iso_top, lof_top) = (top(&iso), top(&lof_raw));
    let mut out = Vec::new();
    for i in iso_top.union(&lof_top).copied() {
        if skip.contains(&ids[i]) {
            continue;
        }
        let (detector, score) = match (iso_top.contains(&i), lof_top.contains(&i)) {
            (true, true) => ("hybrid", iso[i]),
            (true, false) => ("iforest", iso[i]),
            _ => ("lof", (1.0 - 1.0 / lof_raw[i].max(1.0)).clamp(0.0, 1.0)),
        };
        out.push(Detection {
            entity_type,
            entity_id: ids[i],
            detector,
            rule_code: None,
            score,
            severity: Severity::from_score(score),
            evidence: describe(i),
        });
    }
    out.sort_by(|a, b| b.score.total_cmp(&a.score));
    out
}

/// Everything one detection run needs, already loaded.
pub struct Inputs {
    pub loads: Vec<LecturerLoad>,
    pub classes: Vec<ClassEnrolment>,
    pub students: Vec<StudentSpan>,
}

/// Runs the rules, then the ML detectors on entities the rules did not already flag.
pub fn detect(inputs: &Inputs, cfg: &RuleConfig, top_fraction: f64, seed: u64) -> Vec<Detection> {
    let mut out = rules::lecturer_overload(&inputs.loads, cfg);
    out.extend(rules::class_over_capacity(&inputs.classes));
    out.extend(rules::study_period_exceeded(&inputs.students, cfg));
    let flagged: std::collections::HashSet<Uuid> = out.iter().map(|d| d.entity_id).collect();

    let ids: Vec<Uuid> = inputs.loads.iter().map(|l| l.lecturer_id).collect();
    let rows: Vec<Vec<f64>> = inputs.loads.iter().map(|l| vec![l.credits, f64::from(l.classes)]).collect();
    out.extend(ml_detections("lecturer", &ids, &rows, top_fraction, seed, &flagged, |i| {
        serde_json::json!({ "semester": inputs.loads[i].semester, "credits": inputs.loads[i].credits, "classes": inputs.loads[i].classes })
    }));

    let ids: Vec<Uuid> = inputs.students.iter().map(|s| s.student_id).collect();
    let rows: Vec<Vec<f64>> = inputs.students.iter().map(|s| vec![s.years]).collect();
    out.extend(ml_detections("student", &ids, &rows, top_fraction, seed, &flagged, |i| {
        serde_json::json!({ "years": inputs.students[i].years, "active": inputs.students[i].active })
    }));
    out
}
