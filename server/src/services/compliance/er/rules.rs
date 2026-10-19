//! Deterministic rule-based baseline (the "status quo" comparator for the thesis).

use super::features::Comparison;

/// 1.0 = match, 0.5 = possible, 0.0 = non-match; use with `Thresholds { lower: 0.5, upper: 1.0 }`.
pub fn score(c: &Comparison) -> f64 {
    let name = c.name_jw.max(c.name_token_sort_jw);
    // Sibling classes ("A" vs "B") share course, term and nearly the whole name: never duplicates.
    if c.variant_equal == Some(false) {
        return 0.0;
    }
    if c.parent_equal == Some(true) && c.term_equal == Some(true) && c.variant_equal == Some(true) {
        return 1.0;
    }
    if c.nik_equal == Some(true) {
        return 1.0;
    }
    if c.number_sim == Some(1.0) && name >= 0.85 {
        return 1.0;
    }
    if name >= 0.95 && c.birth_equal == Some(true) {
        return 1.0;
    }
    if name >= 0.90 || (c.number_sim == Some(1.0) && name >= 0.7) {
        return 0.5;
    }
    0.0
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::compliance::er::{features::compare, Record};

    fn r(name: &str, num: &str) -> Record {
        Record { name: name.into(), number: Some(num.into()), ..Default::default() }
    }

    #[test]
    fn exact_number_and_similar_name_matches() {
        assert_eq!(score(&compare(&r("Budi Santoso", "1"), &r("Budi Santosa", "1"))), 1.0);
    }

    #[test]
    fn sibling_classes_are_not_duplicates_but_repeated_class_is() {
        let class = |v: &str| Record {
            name: format!("Pemrograman Web {v}"),
            number: Some("TIF101".into()),
            parent: Some("mk1".into()),
            term: Some("20241".into()),
            variant: Some(v.into()),
            ..Default::default()
        };
        assert_eq!(score(&compare(&class("A"), &class("B"))), 0.0);
        assert_eq!(score(&compare(&class("A"), &class("A"))), 1.0);
    }

    #[test]
    fn unrelated_is_non_match() {
        assert_eq!(score(&compare(&r("Budi Santoso", "1"), &r("Dewi Lestari", "2"))), 0.0);
    }
}
