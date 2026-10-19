//! L2-regularised logistic regression trained by batch gradient descent (ndarray).

use ndarray::{Array1, Array2};

#[derive(Clone, Debug)]
pub struct LogReg {
    pub weights: Array1<f64>,
    pub bias: f64,
}

fn sigmoid(z: f64) -> f64 {
    1.0 / (1.0 + (-z).exp())
}

impl LogReg {
    /// `x`: n×d features, `y`: 0/1 labels. Classes are re-weighted to balance a rare positive class.
    pub fn fit(x: &Array2<f64>, y: &Array1<f64>, epochs: usize, lr: f64, l2: f64) -> Self {
        let (n, d) = x.dim();
        let mut model = Self { weights: Array1::zeros(d), bias: 0.0 };
        if n == 0 {
            return model;
        }
        let pos = y.sum().max(1.0);
        let neg = (n as f64 - y.sum()).max(1.0);
        let (w_pos, w_neg) = (n as f64 / (2.0 * pos), n as f64 / (2.0 * neg));
        let sample_w: Array1<f64> = y.mapv(|v| if v > 0.5 { w_pos } else { w_neg });
        for _ in 0..epochs {
            let p = (x.dot(&model.weights) + model.bias).mapv(sigmoid);
            let err = (&p - y) * &sample_w;
            let grad_w = x.t().dot(&err) / n as f64 + &model.weights * l2;
            model.weights = &model.weights - &(grad_w * lr);
            model.bias -= lr * err.sum() / n as f64;
        }
        model
    }

    pub fn predict(&self, row: &[f64]) -> f64 {
        sigmoid(Array1::from_vec(row.to_vec()).dot(&self.weights) + self.bias)
    }

    pub fn predict_batch(&self, x: &Array2<f64>) -> Array1<f64> {
        (x.dot(&self.weights) + self.bias).mapv(sigmoid)
    }
}

/// Stack dense feature rows into a matrix.
pub fn to_matrix(rows: &[Vec<f64>]) -> Array2<f64> {
    let d = rows.first().map_or(0, Vec::len);
    let mut m = Array2::zeros((rows.len(), d));
    for (i, r) in rows.iter().enumerate() {
        m.row_mut(i).assign(&Array1::from_vec(r.clone()));
    }
    m
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn learns_a_separable_problem() {
        let rows: Vec<Vec<f64>> = (0..40)
            .map(|i| if i % 2 == 0 { vec![0.95, 1.0] } else { vec![0.3, 0.0] })
            .collect();
        let y = Array1::from_iter((0..40).map(|i| if i % 2 == 0 { 1.0 } else { 0.0 }));
        let model = LogReg::fit(&to_matrix(&rows), &y, 2000, 0.5, 1e-4);
        assert!(model.predict(&[0.95, 1.0]) > 0.9);
        assert!(model.predict(&[0.3, 0.0]) < 0.1);
    }

    #[test]
    fn empty_training_set_is_harmless() {
        let model = LogReg::fit(&Array2::zeros((0, 3)), &Array1::zeros(0), 10, 0.1, 0.0);
        assert!((model.predict(&[1.0, 1.0, 1.0]) - 0.5).abs() < 1e-9);
    }
}
