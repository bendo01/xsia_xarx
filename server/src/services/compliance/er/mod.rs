//! Probabilistic duplicate detection inside the FEEDER (`feeder_master`) data: finds records
//! that describe the same person under different keys. No SIAKAD data is involved.
//!
//! Pipeline: [`blocking`] → [`features`] → a scorer ([`rules`], [`fellegi_sunter`], [`logreg`])
//! → [`MatchClass`] thresholds → [`metrics`] against gold links.

pub mod blocking;
pub mod features;
pub mod loaders;
pub mod fellegi_sunter;
pub mod logreg;
pub mod metrics;
pub mod normalize;
pub mod rules;

use chrono::NaiveDate;
use uuid::Uuid;

/// What kind of `feeder_master` record is being deduplicated.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum EntityKind {
    Student,
    Lecturer,
    Course,
    Class,
}

impl EntityKind {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Student => "student",
            Self::Lecturer => "lecturer",
            Self::Course => "course",
            Self::Class => "class",
        }
    }
}

/// A `feeder_master` record (student, lecturer, course or class) reduced to comparable fields.
/// Fields that do not apply to a kind stay `None` and are skipped by the comparison.
#[derive(Clone, Debug, Default)]
pub struct Record {
    pub id: Uuid,
    /// Person name, course name, or "course name + class name" for classes
    pub name: String,
    /// NIM (students), NIDN (lecturers) or course code (courses, classes)
    pub number: Option<String>,
    /// SKS (courses, classes)
    pub credits: Option<f64>,
    /// Semester id (classes)
    pub term: Option<String>,
    /// Owning course id (classes)
    pub parent: Option<String>,
    /// Exact-match label that tells siblings apart, e.g. class name "A" vs "B"
    pub variant: Option<String>,
    pub nik: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub prodi: Option<String>,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum MatchClass {
    Match,
    Possible,
    NonMatch,
}

impl MatchClass {
    pub fn as_str(self) -> &'static str {
        match self {
            Self::Match => "match",
            Self::Possible => "possible",
            Self::NonMatch => "non_match",
        }
    }
}

/// Two-threshold decision rule: `score >= upper` is a match, `score < lower` a non-match.
#[derive(Clone, Copy, Debug)]
pub struct Thresholds {
    pub lower: f64,
    pub upper: f64,
}

impl Thresholds {
    pub fn classify(&self, score: f64) -> MatchClass {
        if score >= self.upper {
            MatchClass::Match
        } else if score >= self.lower {
            MatchClass::Possible
        } else {
            MatchClass::NonMatch
        }
    }
}
