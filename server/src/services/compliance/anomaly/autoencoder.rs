//! Dense autoencoder (burn, CPU/ndarray). Rows are z-scored, squeezed through a bottleneck and
//! reconstructed; the per-row reconstruction error is the outlier score.

use burn::{
    backend::{Autodiff, NdArray},
    module::{AutodiffModule, Module},
    nn::{Linear, LinearConfig},
    optim::{AdamConfig, GradientsParams, Optimizer},
    tensor::{Tensor, TensorData, activation::relu, backend::Backend},
};

type Train = Autodiff<NdArray<f32>>;
type Infer = NdArray<f32>;

#[derive(Module, Debug)]
struct Net<B: Backend> {
    enc1: Linear<B>,
    enc2: Linear<B>,
    dec1: Linear<B>,
    dec2: Linear<B>,
}

impl<B: Backend> Net<B> {
    fn new(dims: usize, hidden: usize, bottleneck: usize, device: &B::Device) -> Self {
        Self {
            enc1: LinearConfig::new(dims, hidden).init(device),
            enc2: LinearConfig::new(hidden, bottleneck).init(device),
            dec1: LinearConfig::new(bottleneck, hidden).init(device),
            dec2: LinearConfig::new(hidden, dims).init(device),
        }
    }

    fn forward(&self, x: Tensor<B, 2>) -> Tensor<B, 2> {
        let z = relu(self.enc2.forward(relu(self.enc1.forward(x))));
        self.dec2.forward(relu(self.dec1.forward(z)))
    }
}

pub struct Autoencoder {
    net: Net<Infer>,
    mean: Vec<f64>,
    std: Vec<f64>,
}

fn standardise(rows: &[Vec<f64>], mean: &[f64], std: &[f64]) -> Vec<f32> {
    rows.iter().flat_map(|r| r.iter().enumerate().map(|(j, v)| ((v - mean[j]) / std[j]) as f32)).collect()
}

fn to_tensor<B: Backend>(flat: Vec<f32>, n: usize, d: usize, device: &B::Device) -> Tensor<B, 2> {
    Tensor::from_data(TensorData::new(flat, [n, d]), device)
}

impl Autoencoder {
    /// Trains full-batch with Adam on at most `max_train_rows` rows (a seeded stride sample), `epochs` passes.
    /// Returns `None` for fewer than 2 rows or no features.
    pub fn fit(rows: &[Vec<f64>], epochs: usize, lr: f64, max_train_rows: usize, seed: u64) -> Option<Self> {
        let d = rows.first()?.len();
        if d == 0 || rows.len() < 2 {
            return None;
        }
        let n = rows.len() as f64;
        let mean: Vec<f64> = (0..d).map(|j| rows.iter().map(|r| r[j]).sum::<f64>() / n).collect();
        let std: Vec<f64> = (0..d)
            .map(|j| {
                let s = (rows.iter().map(|r| (r[j] - mean[j]).powi(2)).sum::<f64>() / n).sqrt();
                if s > 1e-9 { s } else { 1.0 }
            })
            .collect();

        let step = rows.len().div_ceil(max_train_rows.max(1));
        let sample: Vec<Vec<f64>> = rows.iter().skip((seed as usize) % step).step_by(step).cloned().collect();
        let sample = if sample.len() < 2 { rows.to_vec() } else { sample };

        Infer::seed(&Default::default(), seed);
        let device = Default::default();
        let mut net: Net<Train> = Net::new(d, 8, (d / 2).max(1), &device);
        let mut optim = AdamConfig::new().init::<Train, Net<Train>>();
        let x = to_tensor::<Train>(standardise(&sample, &mean, &std), sample.len(), d, &device);
        for _ in 0..epochs {
            let loss = (net.forward(x.clone()) - x.clone()).powf_scalar(2.0).mean();
            let grads = GradientsParams::from_grads(loss.backward(), &net);
            net = optim.step(lr, net, grads);
        }
        Some(Self { net: net.valid(), mean, std })
    }

    /// Mean squared reconstruction error per row (z-scored space).
    pub fn errors(&self, rows: &[Vec<f64>]) -> Vec<f64> {
        let d = self.mean.len();
        let device = Default::default();
        let x = to_tensor::<Infer>(standardise(rows, &self.mean, &self.std), rows.len(), d, &device);
        let err = (self.net.forward(x.clone()) - x).powf_scalar(2.0).mean_dim(1).into_data();
        err.to_vec::<f32>().unwrap_or_default().into_iter().map(f64::from).collect()
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use rand::{Rng, SeedableRng, rngs::StdRng};

    /// Points on the line y = 2x plus noise, and one point far off the line.
    fn line_with_outlier() -> Vec<Vec<f64>> {
        let mut rng = StdRng::seed_from_u64(5);
        let mut rows: Vec<Vec<f64>> = (0..200)
            .map(|_| {
                let x = rng.gen_range(0.0..10.0);
                vec![x, 2.0 * x + rng.gen_range(-0.2..0.2)]
            })
            .collect();
        rows.push(vec![5.0, -20.0]);
        rows
    }

    #[test]
    fn off_manifold_point_has_highest_error() {
        let rows = line_with_outlier();
        let ae = Autoencoder::fit(&rows, 300, 0.01, 1000, 1).unwrap();
        let e = ae.errors(&rows);
        let top = e.iter().enumerate().max_by(|a, b| a.1.total_cmp(b.1)).unwrap().0;
        assert_eq!(top, rows.len() - 1);
    }

    #[test]
    fn constant_data_is_finite() {
        let rows = vec![vec![3.0, 3.0]; 30];
        let ae = Autoencoder::fit(&rows, 20, 0.01, 100, 1).unwrap();
        assert!(ae.errors(&rows).iter().all(|e| e.is_finite()));
    }

    #[test]
    fn too_few_rows_is_none() {
        assert!(Autoencoder::fit(&[vec![1.0]], 10, 0.01, 100, 1).is_none());
    }
}
