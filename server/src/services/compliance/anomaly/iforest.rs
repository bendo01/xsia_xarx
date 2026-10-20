//! Isolation Forest (Liu et al., 2008) over dense feature rows.

use rand::{Rng, SeedableRng, rngs::StdRng, seq::index::sample};

enum Node {
    Leaf { size: usize },
    Split { feature: usize, value: f64, left: Box<Node>, right: Box<Node> },
}

/// Average path length of an unsuccessful BST search over `n` points, `c(n)`.
fn c(n: usize) -> f64 {
    match n {
        0 | 1 => 0.0,
        2 => 1.0,
        _ => {
            let n = n as f64;
            2.0 * ((n - 1.0).ln() + 0.577_215_664_901_532_9) - 2.0 * (n - 1.0) / n
        }
    }
}

fn build(rows: &[&[f64]], depth: usize, max_depth: usize, rng: &mut StdRng) -> Node {
    if depth >= max_depth || rows.len() <= 1 {
        return Node::Leaf { size: rows.len() };
    }
    let dims = rows[0].len();
    // pick a feature that actually varies; give up (leaf) after a few tries
    for _ in 0..dims.max(4) {
        let feature = rng.gen_range(0..dims);
        let (lo, hi) = rows.iter().fold((f64::INFINITY, f64::NEG_INFINITY), |(lo, hi), r| (lo.min(r[feature]), hi.max(r[feature])));
        if hi > lo {
            let value = rng.gen_range(lo..hi);
            let (l, r): (Vec<_>, Vec<_>) = rows.iter().partition(|row| row[feature] < value);
            return Node::Split {
                feature,
                value,
                left: Box::new(build(&l, depth + 1, max_depth, rng)),
                right: Box::new(build(&r, depth + 1, max_depth, rng)),
            };
        }
    }
    Node::Leaf { size: rows.len() }
}

fn path_length(node: &Node, row: &[f64], depth: f64) -> f64 {
    match node {
        Node::Leaf { size } => depth + c(*size),
        Node::Split { feature, value, left, right } => {
            let next = if row[*feature] < *value { left } else { right };
            path_length(next, row, depth + 1.0)
        }
    }
}

pub struct IsolationForest {
    trees: Vec<Node>,
    sample_size: usize,
}

impl IsolationForest {
    /// Fits `n_trees` trees, each on a subsample of at most `sample_size` rows. Deterministic for a given `seed`.
    pub fn fit(rows: &[Vec<f64>], n_trees: usize, sample_size: usize, seed: u64) -> Self {
        let mut rng = StdRng::seed_from_u64(seed);
        let sample_size = sample_size.min(rows.len()).max(1);
        let max_depth = (sample_size as f64).log2().ceil() as usize;
        let trees = (0..n_trees)
            .map(|_| {
                let idx = sample(&mut rng, rows.len(), sample_size);
                let subset: Vec<&[f64]> = idx.iter().map(|i| rows[i].as_slice()).collect();
                build(&subset, 0, max_depth, &mut rng)
            })
            .collect();
        Self { trees, sample_size }
    }

    /// Anomaly score in `(0, 1)`; values near 1 are anomalous, well below 0.5 are normal.
    pub fn score(&self, row: &[f64]) -> f64 {
        if self.trees.is_empty() {
            return 0.0;
        }
        let mean = self.trees.iter().map(|t| path_length(t, row, 0.0)).sum::<f64>() / self.trees.len() as f64;
        let norm = c(self.sample_size);
        if norm == 0.0 { 0.5 } else { 2f64.powf(-mean / norm) }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn cluster_with_outlier() -> Vec<Vec<f64>> {
        let mut rng = StdRng::seed_from_u64(7);
        let mut rows: Vec<Vec<f64>> = (0..200).map(|_| vec![rng.gen_range(8.0..12.0), rng.gen_range(2.0..4.0)]).collect();
        rows.push(vec![40.0, 15.0]);
        rows
    }

    #[test]
    fn outlier_scores_highest() {
        let rows = cluster_with_outlier();
        let forest = IsolationForest::fit(&rows, 100, 128, 1);
        let scores: Vec<f64> = rows.iter().map(|r| forest.score(r)).collect();
        let top = scores.iter().enumerate().max_by(|a, b| a.1.total_cmp(b.1)).unwrap().0;
        assert_eq!(top, rows.len() - 1);
        assert!(scores[top] > 0.6);
    }

    #[test]
    fn deterministic_for_seed() {
        let rows = cluster_with_outlier();
        let a = IsolationForest::fit(&rows, 20, 64, 3).score(&rows[0]);
        let b = IsolationForest::fit(&rows, 20, 64, 3).score(&rows[0]);
        assert_eq!(a, b);
    }
}
