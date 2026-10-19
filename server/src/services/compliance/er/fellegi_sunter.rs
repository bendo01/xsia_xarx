//! Fellegi–Sunter record linkage with m/u probabilities estimated by EM (no labels needed).

use super::features::Comparison;

/// Number of agreement levels per field: name, number, nik, birth date, prodi, credits, term, parent, variant.
pub const LEVELS: [usize; 9] = [4, 4, 3, 3, 3, 3, 3, 3, 3];
const FIELDS: usize = LEVELS.len();

/// Discretised comparison; `None` = field missing, skipped in the likelihood.
pub type Pattern = [Option<u8>; FIELDS];

pub fn discretize(c: &Comparison) -> Pattern {
    let name = c.name_jw.max(c.name_token_sort_jw);
    let name_level = match name {
        n if n < 0.80 => 0,
        n if n < 0.92 => 1,
        n if n < 0.98 => 2,
        _ => 3,
    };
    let number = c.number_sim.map(|s| match s {
        s if s < 0.7 => 0,
        s if s < 0.95 => 1,
        s if s < 1.0 => 2,
        _ => 3,
    });
    let boolean = |v: Option<bool>| v.map(|b| if b { 2 } else { 1 });
    [
        Some(name_level),
        number,
        boolean(c.nik_equal),
        boolean(c.birth_equal),
        boolean(c.prodi_equal),
        boolean(c.credits_equal),
        boolean(c.term_equal),
        boolean(c.parent_equal),
        boolean(c.variant_equal),
    ]
}

#[derive(Clone, Debug)]
pub struct FellegiSunter {
    /// Prior probability that a candidate pair is a true match
    pub lambda: f64,
    pub m: Vec<Vec<f64>>,
    pub u: Vec<Vec<f64>>,
}

impl FellegiSunter {
    /// Fit by EM on unlabeled candidate pairs.
    pub fn fit(patterns: &[Pattern], max_iter: usize, tol: f64) -> Self {
        // Start from the assumption that higher levels are more likely among matches.
        let init = |n: usize, up: bool| -> Vec<f64> {
            let raw: Vec<f64> = (0..n)
                .map(|l| if up { (l + 1) as f64 } else { (n - l) as f64 }.powi(2))
                .collect();
            let s: f64 = raw.iter().sum();
            raw.into_iter().map(|x| x / s).collect()
        };
        let mut model = Self {
            lambda: 0.1,
            m: LEVELS.iter().map(|&n| init(n, true)).collect(),
            u: LEVELS.iter().map(|&n| init(n, false)).collect(),
        };
        if patterns.is_empty() {
            return model;
        }
        for _ in 0..max_iter {
            let g: Vec<f64> = patterns.iter().map(|p| model.posterior(p)).collect();
            let sum_g: f64 = g.iter().sum();
            let n = patterns.len() as f64;
            let mut next = model.clone();
            next.lambda = (sum_g / n).clamp(1e-6, 1.0 - 1e-6);
            for f in 0..FIELDS {
                let (mut cm, mut cu) = (vec![1e-3; LEVELS[f]], vec![1e-3; LEVELS[f]]);
                for (p, &gi) in patterns.iter().zip(&g) {
                    if let Some(l) = p[f] {
                        cm[l as usize] += gi;
                        cu[l as usize] += 1.0 - gi;
                    }
                }
                let (sm, su): (f64, f64) = (cm.iter().sum(), cu.iter().sum());
                next.m[f] = cm.into_iter().map(|x| x / sm).collect();
                next.u[f] = cu.into_iter().map(|x| x / su).collect();
            }
            let delta = (next.lambda - model.lambda).abs();
            model = next;
            if delta < tol {
                break;
            }
        }
        model
    }

    /// Total log2 match weight Σ log2(m/u) over the observed fields.
    pub fn weight(&self, p: &Pattern) -> f64 {
        (0..FIELDS)
            .filter_map(|f| p[f].map(|l| (self.m[f][l as usize] / self.u[f][l as usize]).log2()))
            .sum()
    }

    /// P(match | pattern) via Bayes with the prior `lambda`.
    pub fn posterior(&self, p: &Pattern) -> f64 {
        let log_odds = (self.lambda / (1.0 - self.lambda)).ln() + self.weight(p) * std::f64::consts::LN_2;
        1.0 / (1.0 + (-log_odds).exp())
    }

    pub fn score(&self, c: &Comparison) -> f64 {
        self.posterior(&discretize(c))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Tiny deterministic LCG so the test needs no rand dependency.
    struct Lcg(u64);
    impl Lcg {
        fn next(&mut self) -> f64 {
            self.0 = self.0.wrapping_mul(6364136223846793005).wrapping_add(1442695040888963407);
            (self.0 >> 11) as f64 / (1u64 << 53) as f64
        }
    }

    fn pick(rng: &mut Lcg, probs: &[f64]) -> u8 {
        let r = rng.next();
        let mut acc = 0.0;
        for (i, p) in probs.iter().enumerate() {
            acc += p;
            if r < acc {
                return i as u8;
            }
        }
        (probs.len() - 1) as u8
    }

    #[test]
    fn em_recovers_planted_structure() {
        let mut rng = Lcg(42);
        let m_true: [&[f64]; 5] = [
            &[0.02, 0.08, 0.2, 0.7],
            &[0.02, 0.03, 0.05, 0.9],
            &[0.05, 0.95, 0.0],
            &[0.1, 0.9, 0.0],
            &[0.2, 0.8, 0.0],
        ];
        let u_true: [&[f64]; 5] = [
            &[0.85, 0.1, 0.04, 0.01],
            &[0.9, 0.08, 0.015, 0.005],
            &[0.99, 0.01, 0.0],
            &[0.95, 0.05, 0.0],
            &[0.8, 0.2, 0.0],
        ];
        let mut patterns = Vec::new();
        let mut is_match = Vec::new();
        for i in 0..6000 {
            let matched = i % 10 == 0;
            let src = if matched { &m_true } else { &u_true };
            let mut p: Pattern = [None; FIELDS];
            for f in 0..5 {
                p[f] = Some(pick(&mut rng, src[f]));
            }
            patterns.push(p);
            is_match.push(matched);
        }
        let model = FellegiSunter::fit(&patterns, 200, 1e-9);
        assert!((model.lambda - 0.1).abs() < 0.03, "lambda = {}", model.lambda);
        let correct = patterns
            .iter()
            .zip(&is_match)
            .filter(|(p, m)| (model.posterior(p) >= 0.5) == **m)
            .count();
        assert!(correct as f64 / 6000.0 > 0.97, "accuracy too low: {correct}");
    }

    fn only_name(level: u8) -> Pattern {
        let mut p = [None; FIELDS];
        p[0] = Some(level);
        p
    }

    #[test]
    fn missing_fields_do_not_contribute() {
        let model = FellegiSunter::fit(&[], 1, 1e-6);
        assert_eq!(model.weight(&[None; FIELDS]), 0.0);
        assert!(model.weight(&only_name(3)) > 0.0);
        assert!(model.weight(&only_name(0)) < 0.0);
    }
}
