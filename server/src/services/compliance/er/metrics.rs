//! Evaluation of predicted links against gold links.

use std::collections::HashSet;

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Prf {
    pub precision: f64,
    pub recall: f64,
    pub f1: f64,
}

/// Precision / recall / F1 of predicted `(left, right)` pairs vs. gold pairs.
pub fn prf<T: std::hash::Hash + Eq>(predicted: &HashSet<T>, gold: &HashSet<T>) -> Prf {
    let tp = predicted.intersection(gold).count() as f64;
    let precision = if predicted.is_empty() { 0.0 } else { tp / predicted.len() as f64 };
    let recall = if gold.is_empty() { 0.0 } else { tp / gold.len() as f64 };
    let f1 = if precision + recall == 0.0 { 0.0 } else { 2.0 * precision * recall / (precision + recall) };
    Prf { precision, recall, f1 }
}

/// Precision–recall curve over all distinct score cut-offs; `scored` = (score, is_true_match).
/// `total_positives` must include positives that blocking never produced.
pub fn pr_curve(scored: &[(f64, bool)], total_positives: usize) -> Vec<(f64, Prf)> {
    let mut sorted = scored.to_vec();
    sorted.sort_by(|a, b| b.0.total_cmp(&a.0));
    let (mut tp, mut out) = (0usize, Vec::new());
    for (i, &(score, hit)) in sorted.iter().enumerate() {
        tp += usize::from(hit);
        if sorted.get(i + 1).is_none_or(|n| n.0 < score) {
            let precision = tp as f64 / (i + 1) as f64;
            let recall = if total_positives == 0 { 0.0 } else { tp as f64 / total_positives as f64 };
            let f1 = if tp == 0 { 0.0 } else { 2.0 * precision * recall / (precision + recall) };
            out.push((score, Prf { precision, recall, f1 }));
        }
    }
    out
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn prf_basic() {
        let p: HashSet<_> = [(1, 1), (2, 2), (3, 9)].into();
        let g: HashSet<_> = [(1, 1), (2, 2), (4, 4), (5, 5)].into();
        let r = prf(&p, &g);
        assert!((r.precision - 2.0 / 3.0).abs() < 1e-9);
        assert!((r.recall - 0.5).abs() < 1e-9);
    }

    #[test]
    fn pr_curve_is_monotone_in_recall() {
        let curve = pr_curve(&[(0.9, true), (0.8, false), (0.7, true), (0.1, false)], 3);
        assert_eq!(curve.len(), 4);
        assert!(curve.windows(2).all(|w| w[1].1.recall >= w[0].1.recall));
        assert!((curve[0].1.precision - 1.0).abs() < 1e-9);
    }
}
