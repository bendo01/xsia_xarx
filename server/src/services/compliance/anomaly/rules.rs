//! Explicit regulation rules. Each returns detections with a normalised `score` in `[0, 1]`.

use super::{ClassEnrolment, Detection, LecturerLoad, Severity, StudentSpan};
use serde_json::json;

#[derive(Clone, Copy, Debug)]
pub struct RuleConfig {
    /// Maximum SKS a lecturer may teach per semester
    pub max_lecturer_credits: f64,
    /// Maximum study period (years) before a student without exit is flagged
    pub max_study_years: f64,
}

impl Default for RuleConfig {
    fn default() -> Self {
        Self { max_lecturer_credits: 16.0, max_study_years: 7.0 }
    }
}

/// Overshoot ratio `value / limit` mapped to `[0.5, 1]`: just over the limit is 0.5, double or more is 1.
fn overshoot_score(value: f64, limit: f64) -> f64 {
    (0.5 + 0.5 * (value / limit - 1.0)).clamp(0.5, 1.0)
}

pub fn lecturer_overload(loads: &[LecturerLoad], cfg: &RuleConfig) -> Vec<Detection> {
    loads
        .iter()
        .filter(|l| l.credits > cfg.max_lecturer_credits)
        .map(|l| {
            let score = overshoot_score(l.credits, cfg.max_lecturer_credits);
            Detection {
                entity_type: "lecturer",
                entity_id: l.lecturer_id,
                detector: "rule",
                rule_code: Some("LECTURER_SKS_MAX"),
                score,
                severity: Severity::from_score(score),
                evidence: json!({
                    "semester": l.semester,
                    "credits": l.credits,
                    "limit": cfg.max_lecturer_credits,
                    "classes": l.classes,
                }),
            }
        })
        .collect()
}

pub fn class_over_capacity(classes: &[ClassEnrolment]) -> Vec<Detection> {
    classes
        .iter()
        .filter(|c| c.capacity > 0 && c.enrolled > c.capacity)
        .map(|c| {
            let score = overshoot_score(f64::from(c.enrolled), f64::from(c.capacity));
            Detection {
                entity_type: "class",
                entity_id: c.class_id,
                detector: "rule",
                rule_code: Some("CLASS_CAPACITY_MAX"),
                score,
                severity: Severity::from_score(score),
                evidence: json!({ "capacity": c.capacity, "enrolled": c.enrolled }),
            }
        })
        .collect()
}

/// Students still active beyond the maximum study period.
pub fn study_period_exceeded(students: &[StudentSpan], cfg: &RuleConfig) -> Vec<Detection> {
    students
        .iter()
        .filter(|s| s.active && s.years > cfg.max_study_years)
        .map(|s| {
            let score = overshoot_score(s.years, cfg.max_study_years);
            Detection {
                entity_type: "student",
                entity_id: s.student_id,
                detector: "rule",
                rule_code: Some("STUDENT_STUDY_PERIOD_MAX"),
                score,
                severity: Severity::from_score(score),
                evidence: json!({ "years": s.years, "limit": cfg.max_study_years }),
            }
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;
    use uuid::Uuid;

    fn load(credits: f64) -> LecturerLoad {
        LecturerLoad { lecturer_id: Uuid::nil(), semester: "20241".into(), credits, classes: 4 }
    }

    #[test]
    fn flags_only_loads_above_limit() {
        let d = lecturer_overload(&[load(16.0), load(18.0), load(32.0)], &RuleConfig::default());
        assert_eq!(d.len(), 2);
        assert!(d[0].score < d[1].score);
        assert!((d[1].score - 1.0).abs() < 1e-9);
        assert_eq!(d[0].rule_code, Some("LECTURER_SKS_MAX"));
    }

    #[test]
    fn capacity_ignores_unset_capacity() {
        let c = |capacity, enrolled| ClassEnrolment { class_id: Uuid::nil(), capacity, enrolled, semester: None, sks: None, graded_ratio: 1.0 };
        assert_eq!(class_over_capacity(&[c(0, 50), c(40, 40), c(40, 41)]).len(), 1);
    }

    #[test]
    fn exited_students_are_not_flagged() {
        let s = |years, active| StudentSpan { student_id: Uuid::nil(), years, active };
        let d = study_period_exceeded(&[s(8.0, true), s(9.0, false), s(6.0, true)], &RuleConfig::default());
        assert_eq!(d.len(), 1);
    }
}
