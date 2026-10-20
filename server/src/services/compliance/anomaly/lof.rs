//! Local Outlier Factor (Breunig et al., 2000). Exact O(n²) neighbour search, fine for per-semester snapshots.

fn dist(a: &[f64], b: &[f64]) -> f64 {
    a.iter().zip(b).map(|(x, y)| (x - y).powi(2)).sum::<f64>().sqrt()
}

/// LOF score per row: ≈1 for inliers, clearly >1 for outliers. Needs `rows.len() > k`; otherwise all 1.0.
pub fn scores(rows: &[Vec<f64>], k: usize) -> Vec<f64> {
    let n = rows.len();
    if k == 0 || n <= k {
        return vec![1.0; n];
    }
    // k nearest neighbours (index, distance) of every point, plus its k-distance
    let neighbours: Vec<Vec<(usize, f64)>> = (0..n)
        .map(|i| {
            let mut d: Vec<(usize, f64)> = (0..n).filter(|&j| j != i).map(|j| (j, dist(&rows[i], &rows[j]))).collect();
            d.sort_by(|a, b| a.1.total_cmp(&b.1));
            let kd = d[k - 1].1;
            d.retain(|x| x.1 <= kd); // keep ties at the k-distance
            d
        })
        .collect();
    let k_dist: Vec<f64> = neighbours.iter().map(|nb| nb.last().map_or(0.0, |x| x.1)).collect();
    let lrd: Vec<f64> = (0..n)
        .map(|i| {
            let reach: f64 = neighbours[i].iter().map(|&(j, d)| d.max(k_dist[j])).sum();
            // duplicates give zero reach distance; cap instead of dividing by zero
            if reach == 0.0 { f64::MAX } else { neighbours[i].len() as f64 / reach }
        })
        .collect();
    (0..n)
        .map(|i| {
            if lrd[i] == f64::MAX {
                return 1.0;
            }
            let sum: f64 = neighbours[i].iter().map(|&(j, _)| if lrd[j] == f64::MAX { 0.0 } else { lrd[j] }).sum();
            sum / neighbours[i].len() as f64 / lrd[i]
        })
        .collect()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn isolated_point_has_highest_lof() {
        let mut rows: Vec<Vec<f64>> = (0..30).map(|i| vec![f64::from(i % 6), f64::from(i / 6)]).collect();
        rows.push(vec![50.0, 50.0]);
        let s = scores(&rows, 5);
        let top = s.iter().enumerate().max_by(|a, b| a.1.total_cmp(b.1)).unwrap().0;
        assert_eq!(top, rows.len() - 1);
        assert!(s[top] > 2.0);
        assert!(s[..30].iter().all(|v| *v < 1.6));
    }

    #[test]
    fn too_few_rows_are_neutral() {
        assert_eq!(scores(&[vec![1.0], vec![2.0]], 5), vec![1.0, 1.0]);
    }

    #[test]
    fn duplicates_do_not_blow_up() {
        let s = scores(&vec![vec![1.0, 1.0]; 10], 3);
        assert!(s.iter().all(|v| v.is_finite()));
    }
}
