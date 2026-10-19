//! Pairwise comparison features.

use super::normalize::{digits, normalize_name, token_sort};
use super::Record;
use strsim::{jaro_winkler, normalized_levenshtein};

/// Continuous similarity features for one record pair; `None` means a field is missing on a side.
#[derive(Clone, Debug, PartialEq)]
pub struct Comparison {
    pub name_jw: f64,
    pub name_token_sort_jw: f64,
    pub number_sim: Option<f64>,
    pub nik_equal: Option<bool>,
    pub birth_equal: Option<bool>,
    pub prodi_equal: Option<bool>,
    pub credits_equal: Option<bool>,
    pub term_equal: Option<bool>,
    pub parent_equal: Option<bool>,
    pub variant_equal: Option<bool>,
    /// Cosine similarity of name embeddings, when computed
    pub embedding_cosine: Option<f64>,
}

pub fn compare(a: &Record, b: &Record) -> Comparison {
    let (na, nb) = (normalize_name(&a.name), normalize_name(&b.name));
    Comparison {
        name_jw: jaro_winkler(&na, &nb),
        name_token_sort_jw: jaro_winkler(&token_sort(&na), &token_sort(&nb)),
        number_sim: both(&a.number, &b.number)
            .map(|(x, y)| normalized_levenshtein(&alnum(x), &alnum(y))),
        nik_equal: both(&a.nik, &b.nik).map(|(x, y)| digits(x) == digits(y)),
        birth_equal: a.birth_date.zip(b.birth_date).map(|(x, y)| x == y),
        prodi_equal: both(&a.prodi, &b.prodi)
            .map(|(x, y)| x.trim().eq_ignore_ascii_case(y.trim())),
        credits_equal: a.credits.zip(b.credits).map(|(x, y)| (x - y).abs() < 1e-6),
        term_equal: text_equal(&a.term, &b.term),
        parent_equal: text_equal(&a.parent, &b.parent),
        variant_equal: text_equal(&a.variant, &b.variant),
        embedding_cosine: None,
    }
}

/// Lowercase letters and digits only (NIM/NIDN have stray separators, course codes carry letters).
fn alnum(raw: &str) -> String {
    raw.chars().filter(|c| c.is_alphanumeric()).flat_map(char::to_lowercase).collect()
}

fn text_equal(a: &Option<String>, b: &Option<String>) -> Option<bool> {
    both(a, b).map(|(x, y)| x.trim().eq_ignore_ascii_case(y.trim()))
}

fn both<'a>(a: &'a Option<String>, b: &'a Option<String>) -> Option<(&'a str, &'a str)> {
    match (a.as_deref(), b.as_deref()) {
        (Some(x), Some(y)) if !x.trim().is_empty() && !y.trim().is_empty() => Some((x, y)),
        _ => None,
    }
}

pub fn cosine(a: &[f32], b: &[f32]) -> f64 {
    let dot: f32 = a.iter().zip(b).map(|(x, y)| x * y).sum();
    let (na, nb) = (
        a.iter().map(|x| x * x).sum::<f32>().sqrt(),
        b.iter().map(|x| x * x).sum::<f32>().sqrt(),
    );
    if na == 0.0 || nb == 0.0 { 0.0 } else { f64::from(dot / (na * nb)) }
}

impl Comparison {
    /// Dense vector for the logistic-regression model; missing fields map to 0 plus a presence flag.
    pub const DENSE_LEN: usize = 19;

    pub fn dense(&self) -> [f64; Self::DENSE_LEN] {
        let flag = |v: Option<bool>| match v {
            Some(true) => 1.0,
            _ => 0.0,
        };
        let present = |v: bool| if v { 1.0 } else { 0.0 };
        [
            self.name_jw,
            self.name_token_sort_jw,
            self.number_sim.unwrap_or(0.0),
            present(self.number_sim.is_some()),
            flag(self.nik_equal),
            present(self.nik_equal.is_some()),
            flag(self.birth_equal),
            present(self.birth_equal.is_some()),
            flag(self.prodi_equal),
            present(self.prodi_equal.is_some()),
            flag(self.credits_equal),
            present(self.credits_equal.is_some()),
            flag(self.term_equal),
            present(self.term_equal.is_some()),
            flag(self.parent_equal),
            present(self.parent_equal.is_some()),
            flag(self.variant_equal),
            present(self.variant_equal.is_some()),
            self.embedding_cosine.unwrap_or(0.0),
        ]
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use chrono::NaiveDate;

    fn rec(name: &str, number: &str) -> Record {
        Record {
            name: name.into(),
            number: Some(number.into()),
            birth_date: NaiveDate::from_ymd_opt(2000, 1, 2),
            ..Default::default()
        }
    }

    #[test]
    fn identical_records_score_one() {
        let c = compare(&rec("Budi Santoso", "2020001"), &rec("BUDI SANTOSO", "2020001"));
        assert!((c.name_jw - 1.0).abs() < 1e-9);
        assert_eq!(c.number_sim, Some(1.0));
        assert_eq!(c.birth_equal, Some(true));
        assert_eq!(c.prodi_equal, None);
    }

    #[test]
    fn swapped_name_order_is_caught_by_token_sort() {
        let c = compare(&rec("Santoso Budi", "1"), &rec("Budi Santoso", "1"));
        assert!(c.name_token_sort_jw > c.name_jw);
        assert!((c.name_token_sort_jw - 1.0).abs() < 1e-9);
    }

    #[test]
    fn sibling_classes_differ_only_by_variant() {
        let class = |v: &str| Record {
            name: format!("Pemrograman Web {v}"),
            parent: Some("mk1".into()),
            term: Some("20241".into()),
            variant: Some(v.into()),
            ..Default::default()
        };
        let same = compare(&class("A"), &class("A"));
        let sibling = compare(&class("A"), &class("B"));
        assert_eq!(same.variant_equal, Some(true));
        assert_eq!(sibling.variant_equal, Some(false));
        assert_eq!(sibling.parent_equal, Some(true));
        assert!(sibling.name_jw > 0.9, "names alone cannot tell them apart");
    }

    #[test]
    fn credits_compare_numerically() {
        let c = |x| Record { credits: Some(x), ..Default::default() };
        assert_eq!(compare(&c(3.0), &c(3.0)).credits_equal, Some(true));
        assert_eq!(compare(&c(3.0), &c(2.0)).credits_equal, Some(false));
    }

    #[test]
    fn cosine_basics() {
        assert!((cosine(&[1.0, 0.0], &[1.0, 0.0]) - 1.0).abs() < 1e-9);
        assert!(cosine(&[1.0, 0.0], &[0.0, 1.0]).abs() < 1e-9);
        assert_eq!(cosine(&[0.0], &[1.0]), 0.0);
    }
}
