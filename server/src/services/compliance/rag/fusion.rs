//! Rank fusion and duplicate removal; pure functions, no database.

use std::collections::HashMap;
use std::hash::Hash;

/// Reciprocal Rank Fusion (Cormack et al., 2009): each list contributes `1 / (k + rank)` per item,
/// rank starting at 1. Returns items by descending fused score; ties keep first-seen order.
pub fn rrf<K: Hash + Eq + Clone>(lists: &[Vec<K>], k: f64) -> Vec<(K, f64)> {
    let mut order: Vec<K> = Vec::new();
    let mut scores: HashMap<K, f64> = HashMap::new();
    for list in lists {
        for (i, item) in list.iter().enumerate() {
            let entry = scores.entry(item.clone()).or_insert_with(|| {
                order.push(item.clone());
                0.0
            });
            *entry += 1.0 / (k + (i + 1) as f64);
        }
    }
    let mut out: Vec<(K, f64)> = order.into_iter().map(|key| {
        let s = scores[&key];
        (key, s)
    }).collect();
    out.sort_by(|a, b| b.1.total_cmp(&a.1)); // stable: ties stay in first-seen order
    out
}

const STOPWORDS: &[&str] = &[
    "yang", "dan", "dengan", "untuk", "dari", "pada", "atau", "apa", "berapa", "adalah", "dalam", "itu", "ini", "oleh",
    "ke", "di", "the", "of", "is", "a", "an",
];

/// Search terms of a question: lowercase alphanumerics, minus stop words and one/two-letter words
/// (numbers are kept, since limits such as `16` matter).
pub fn query_terms(query: &str) -> Vec<String> {
    let mut seen = std::collections::HashSet::new();
    query
        .to_lowercase()
        .split(|c: char| !c.is_alphanumeric())
        .filter(|t| !t.is_empty())
        .filter(|t| t.chars().all(|c| c.is_ascii_digit()) || (t.chars().count() >= 3 && !STOPWORDS.contains(t)))
        .filter(|t| seen.insert((*t).to_owned()))
        .map(str::to_owned)
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn items_in_both_lists_beat_items_in_one() {
        let fused = rrf(&[vec!["a", "b", "c"], vec!["c", "d"]], 60.0);
        let keys: Vec<_> = fused.iter().map(|x| x.0).collect();
        assert_eq!(keys[0], "c"); // rank 3 + rank 1 beats rank 1 alone
        assert_eq!(keys.len(), 4);
        assert!(fused.windows(2).all(|w| w[0].1 >= w[1].1));
    }

    #[test]
    fn single_list_keeps_order_and_ties_are_stable() {
        let fused = rrf(&[vec![1, 2, 3]], 60.0);
        assert_eq!(fused.iter().map(|x| x.0).collect::<Vec<_>>(), vec![1, 2, 3]);
        let tie = rrf(&[vec!["x"], vec!["y"]], 60.0);
        assert_eq!(tie[0].0, "x");
    }

    #[test]
    fn empty_input_is_empty() {
        assert!(rrf::<u8>(&[], 60.0).is_empty());
        assert!(rrf::<u8>(&[vec![]], 60.0).is_empty());
    }

    #[test]
    fn query_terms_drop_stopwords_but_keep_numbers() {
        assert_eq!(
            query_terms("Berapa beban SKS dosen paling banyak 16 SKS per semester?"),
            vec!["beban", "sks", "dosen", "paling", "banyak", "16", "per", "semester"]
        );
        assert!(query_terms("di ke a").is_empty());
    }
}
