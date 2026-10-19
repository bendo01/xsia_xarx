//! Blocking: cheap keys so that only plausible pairs are compared.

use super::normalize::{digits, normalize_name, token_sort};
use super::Record;
use std::collections::{BTreeSet, HashMap};

/// Blocking keys of a record. Two records are candidates if they share any key.
pub fn keys(r: &Record) -> Vec<String> {
    let mut out = Vec::new();
    // Course codes are alphanumeric; for classes the code is only meaningful within one semester.
    let code = r.number.as_deref().map(|n| n.trim().to_lowercase()).filter(|n| !n.is_empty());
    if let Some(n) = code {
        let n: String = n.chars().filter(|c| c.is_alphanumeric()).collect();
        match r.term.as_deref() {
            Some(t) => out.push(format!("num:{n}:{t}")),
            None => out.push(format!("num:{n}")),
        }
    }
    if let (Some(p), Some(t)) = (r.parent.as_deref(), r.term.as_deref()) {
        out.push(format!("cls:{p}:{t}"));
    }
    if let Some(n) = r.nik.as_deref().map(digits).filter(|d| !d.is_empty()) {
        out.push(format!("nik:{n}"));
    }
    let name = normalize_name(&r.name);
    if !name.is_empty() {
        let sorted = token_sort(&name);
        out.push(format!("nm:{}", sorted.chars().take(4).collect::<String>()));
        if let Some(first) = name.split_whitespace().next() {
            out.push(format!("ft:{first}"));
        }
        if let Some(b) = r.birth_date {
            out.push(format!("nb:{}:{b}", sorted.chars().take(2).collect::<String>()));
        }
    }
    if let (Some(p), Some(b)) = (r.prodi.as_deref(), r.birth_date) {
        out.push(format!("pb:{}:{b}", p.trim().to_lowercase()));
    }
    out
}

/// Candidate index pairs `(i into left, j into right)`, deduplicated and sorted.
pub fn candidate_pairs(left: &[Record], right: &[Record]) -> Vec<(usize, usize)> {
    let mut index: HashMap<String, Vec<usize>> = HashMap::new();
    for (j, r) in right.iter().enumerate() {
        for k in keys(r) {
            index.entry(k).or_default().push(j);
        }
    }
    let mut pairs = BTreeSet::new();
    for (i, l) in left.iter().enumerate() {
        for k in keys(l) {
            if let Some(js) = index.get(&k) {
                pairs.extend(js.iter().map(|&j| (i, j)));
            }
        }
    }
    pairs.into_iter().collect()
}

/// Candidate pairs `(i, j)` with `i < j` within a single record set (duplicate detection).
pub fn self_candidate_pairs(records: &[Record]) -> Vec<(usize, usize)> {
    let mut index: HashMap<String, Vec<usize>> = HashMap::new();
    for (i, r) in records.iter().enumerate() {
        for k in keys(r) {
            index.entry(k).or_default().push(i);
        }
    }
    let mut pairs = BTreeSet::new();
    for members in index.values() {
        for (a, &i) in members.iter().enumerate() {
            pairs.extend(members[a + 1..].iter().map(|&j| (i.min(j), i.max(j))));
        }
    }
    pairs.into_iter().filter(|(i, j)| i != j).collect()
}

/// Fraction of the full cross product that blocking removed.
pub fn reduction_ratio(candidates: usize, left: usize, right: usize) -> f64 {
    let full = (left * right) as f64;
    if full == 0.0 { 0.0 } else { 1.0 - candidates as f64 / full }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn rec(name: &str, number: Option<&str>) -> Record {
        Record { name: name.into(), number: number.map(Into::into), ..Default::default() }
    }

    #[test]
    fn shares_block_on_number_even_with_different_names() {
        let l = vec![rec("Aaa Bbb", Some("123"))];
        let r = vec![rec("Zzz Yyy", Some("123")), rec("Qqq Www", Some("999"))];
        assert_eq!(candidate_pairs(&l, &r), vec![(0, 0)]);
    }

    #[test]
    fn typo_in_trailing_token_still_blocks_on_first_name() {
        let l = vec![rec("Budi Santoso", None)];
        let r = vec![rec("Budi Santosa", None), rec("Dewi Lestari", None)];
        assert_eq!(candidate_pairs(&l, &r), vec![(0, 0)]);
    }

    #[test]
    fn self_pairs_are_unordered_and_unique() {
        let rs = vec![rec("Budi Santoso", Some("1")), rec("Budi Santosa", Some("1")), rec("Dewi Lestari", Some("2"))];
        assert_eq!(self_candidate_pairs(&rs), vec![(0, 1)]);
    }

    #[test]
    fn reduction_ratio_bounds() {
        assert!((reduction_ratio(10, 10, 10) - 0.9).abs() < 1e-9);
        assert_eq!(reduction_ratio(0, 0, 5), 0.0);
    }
}
