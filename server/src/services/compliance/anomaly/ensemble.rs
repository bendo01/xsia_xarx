//! Soft voting: weighted mean of detector scores that were first normalised to `[0, 1]`.

/// Percentile rank in `[0, 1]` (ties share their average rank); constant input maps to all 0.0.
pub fn percentile_rank(values: &[f64]) -> Vec<f64> {
    let n = values.len();
    if n < 2 {
        return vec![0.0; n];
    }
    let mut idx: Vec<usize> = (0..n).collect();
    idx.sort_by(|&a, &b| values[a].total_cmp(&values[b]));
    let mut out = vec![0.0; n];
    let mut i = 0;
    while i < n {
        let mut j = i;
        while j + 1 < n && values[idx[j + 1]] == values[idx[i]] {
            j += 1;
        }
        let rank = (i + j) as f64 / 2.0 / (n - 1) as f64;
        for &k in &idx[i..=j] {
            out[k] = rank;
        }
        i = j + 1;
    }
    out
}

/// Weighted mean per row over `(weight, scores)` parts. Weights are renormalised over the parts given,
/// so a detector that was skipped is simply left out. All-zero weights give all-zero scores.
pub fn soft_vote(parts: &[(f64, &[f64])]) -> Vec<f64> {
    let n = parts.first().map_or(0, |p| p.1.len());
    let total: f64 = parts.iter().map(|p| p.0.max(0.0)).sum();
    if total <= 0.0 {
        return vec![0.0; n];
    }
    (0..n).map(|i| parts.iter().map(|(w, s)| w.max(0.0) * s[i]).sum::<f64>() / total).collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn equal_weights_average() {
        let (a, b) = ([0.2, 0.8], [0.4, 0.0]);
        let v = soft_vote(&[(1.0, &a), (1.0, &b)]);
        assert!((v[0] - 0.3).abs() < 1e-12 && (v[1] - 0.4).abs() < 1e-12);
    }

    #[test]
    fn zero_weight_ignores_detector() {
        let (a, b) = ([0.2, 0.8], [1.0, 1.0]);
        assert_eq!(soft_vote(&[(1.0, &a), (0.0, &b)]), vec![0.2, 0.8]);
    }

    #[test]
    fn empty_and_zero_total_are_safe() {
        assert!(soft_vote(&[]).is_empty());
        assert_eq!(soft_vote(&[(0.0, &[0.5, 0.5])]), vec![0.0, 0.0]);
    }

    #[test]
    fn percentile_rank_orders_and_ties() {
        assert_eq!(percentile_rank(&[10.0, 30.0, 20.0]), vec![0.0, 1.0, 0.5]);
        assert_eq!(percentile_rank(&[5.0, 5.0, 5.0]), vec![0.5, 0.5, 0.5]);
        assert_eq!(percentile_rank(&[1.0]), vec![0.0]);
    }
}
