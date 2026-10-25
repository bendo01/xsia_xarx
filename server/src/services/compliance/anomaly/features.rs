//! Feature matrices for the ML detectors, grouped by semester so each semester is scored against its own peers.

use super::{ClassEnrolment, LecturerLoad, StudentTerm};
use uuid::Uuid;

pub struct FeatureSet {
    pub entity_type: &'static str,
    pub names: &'static [&'static str],
    pub ids: Vec<Uuid>,
    /// Semester id per row
    pub groups: Vec<String>,
    pub rows: Vec<Vec<f64>>,
}

pub fn lecturers(loads: &[LecturerLoad]) -> FeatureSet {
    FeatureSet {
        entity_type: "lecturer",
        names: &["credits", "classes", "avg_credits_per_class"],
        ids: loads.iter().map(|l| l.lecturer_id).collect(),
        groups: loads.iter().map(|l| l.semester.clone()).collect(),
        rows: loads.iter().map(|l| vec![l.credits, f64::from(l.classes), l.credits / f64::from(l.classes.max(1))]).collect(),
    }
}

pub fn student_terms(terms: &[StudentTerm]) -> FeatureSet {
    FeatureSet {
        entity_type: "student",
        names: &["ips", "ipk", "sks_semester", "sks_total", "biaya_kuliah", "ipk_minus_ips"],
        ids: terms.iter().map(|t| t.student_id).collect(),
        groups: terms.iter().map(|t| t.semester.clone()).collect(),
        rows: terms.iter().map(|t| vec![t.ips, t.ipk, t.sks_semester, t.sks_total, t.tuition, t.ipk - t.ips]).collect(),
    }
}

/// Classes without a semester, SKS or a positive capacity cannot be compared and are left out.
pub fn classes(classes: &[ClassEnrolment]) -> FeatureSet {
    let usable: Vec<&ClassEnrolment> = classes.iter().filter(|c| c.semester.is_some() && c.sks.is_some() && c.capacity > 0).collect();
    FeatureSet {
        entity_type: "class",
        names: &["fill_ratio", "sks", "enrolled", "graded_ratio"],
        ids: usable.iter().map(|c| c.class_id).collect(),
        groups: usable.iter().map(|c| c.semester.clone().unwrap_or_default()).collect(),
        rows: usable
            .iter()
            .map(|c| vec![f64::from(c.enrolled) / f64::from(c.capacity), c.sks.unwrap_or(0.0), f64::from(c.enrolled), c.graded_ratio])
            .collect(),
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn class_without_capacity_or_semester_is_dropped() {
        let mk = |capacity, semester: Option<&str>| ClassEnrolment {
            class_id: Uuid::nil(),
            capacity,
            enrolled: 10,
            semester: semester.map(str::to_owned),
            sks: Some(3.0),
            graded_ratio: 1.0,
        };
        let fs = classes(&[mk(0, Some("20231")), mk(40, None), mk(40, Some("20231"))]);
        assert_eq!(fs.rows.len(), 1);
        assert_eq!(fs.rows[0][0], 0.25);
    }

    #[test]
    fn lecturer_average_credits() {
        let l = LecturerLoad { lecturer_id: Uuid::nil(), semester: "20231".into(), credits: 12.0, classes: 4 };
        assert_eq!(lecturers(&[l]).rows[0], vec![12.0, 4.0, 3.0]);
    }
}
