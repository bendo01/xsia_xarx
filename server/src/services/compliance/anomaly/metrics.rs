//! Evaluation of anomaly scores against labelled anomalies; `scored` = (score, is_true_anomaly).

/// ROC AUC via the rank-sum (Mann–Whitney) formulation, ties counted as half. `None` if a class is empty.
pub fn auc(scored: &[(f64, bool)]) -> Option<f64> {
    let pos = scored.iter().filter(|s| s.1).count();
    let neg = scored.len() - pos;
    if pos == 0 || neg == 0 {
        return None;
    }
    let wins: f64 = scored
        .iter()
        .filter(|p| p.1)
        .map(|p| {
            scored
                .iter()
                .filter(|n| !n.1)
                .map(|n| match p.0.total_cmp(&n.0) {
                    std::cmp::Ordering::Greater => 1.0,
                    std::cmp::Ordering::Equal => 0.5,
                    std::cmp::Ordering::Less => 0.0,
                })
                .sum::<f64>()
        })
        .sum();
    Some(wins / (pos * neg) as f64)
}

/// Fraction of true anomalies among the `k` highest-scored items.
pub fn precision_at_k(scored: &[(f64, bool)], k: usize) -> f64 {
    if k == 0 || scored.is_empty() {
        return 0.0;
    }
    let mut sorted = scored.to_vec();
    sorted.sort_by(|a, b| b.0.total_cmp(&a.0));
    let k = k.min(sorted.len());
    sorted[..k].iter().filter(|s| s.1).count() as f64 / k as f64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn perfect_and_inverted_auc() {
        assert_eq!(auc(&[(0.9, true), (0.8, true), (0.2, false), (0.1, false)]), Some(1.0));
        assert_eq!(auc(&[(0.1, true), (0.9, false)]), Some(0.0));
        assert_eq!(auc(&[(0.5, true), (0.5, false)]), Some(0.5));
        assert_eq!(auc(&[(0.5, true)]), None);
    }

    #[test]
    fn precision_at_k_counts_top_k() {
        let s = [(0.9, true), (0.8, false), (0.7, true), (0.1, false)];
        assert_eq!(precision_at_k(&s, 2), 0.5);
        assert_eq!(precision_at_k(&s, 10), 0.5);
    }
}
