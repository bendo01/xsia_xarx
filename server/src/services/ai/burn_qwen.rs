//! Qwen2 on Burn: runs the same GGUF file as the candle engine on any GPU that Burn's wgpu backend reaches
//! (Vulkan: AMD, Intel, NVIDIA), without llama.cpp.
//!
//! Burn has no GGUF reader and no 4-bit kernels, so the weights are read with candle's GGUF reader, dequantized
//! to f32 and uploaded; the GPU holds them at full precision (about 6 GB for Qwen2.5-1.5B). The architecture
//! follows `candle_transformers::models::quantized_qwen2`: RMSNorm, grouped-query attention with q/k/v biases,
//! half-split rotary embeddings, SwiGLU, tied output embeddings. The model is generic over the Burn backend so
//! it can be checked against candle on the CPU (`NdArray`) as well as run on the GPU (`Wgpu`).

use std::path::Path;
use std::sync::Mutex;

use anyhow::{Context, Result, bail};
use burn::tensor::activation::{silu, softmax};
use burn::tensor::backend::Backend;
use burn::tensor::{Int, Tensor, TensorData};
use candle_core::quantized::gguf_file;
use candle_core::Device as CandleDevice;
use tokenizers::Tokenizer;

use super::generation::{GenParams, GenStats, generate_with};

/// The GPU backend: wgpu picks Vulkan on Linux and the best adapter it finds
#[cfg(feature = "vulkan")]
pub type Gpu = burn::backend::Wgpu<f32>;

/// Positions the rotary tables cover; a prompt plus its answer is far shorter
const MAX_POSITIONS: usize = 8192;
/// Added to masked attention scores (finite, so a fully masked row cannot produce NaN)
const MASK_VALUE: f32 = -1e9;

struct Config {
    n_head: usize,
    n_kv_head: usize,
    head_dim: usize,
    hidden: usize,
    eps: f32,
    vocab: usize,
}

struct Layer<B: Backend> {
    /// Projections as the GGUF stores them, `[out, in]`: `w.matmul(x)` with `x` as `[in, s]` is a dot product along
    /// each contiguous row, which is what wgpu's matmul does fastest for the one-token steps of decoding
    wq: Tensor<B, 2>,
    wk: Tensor<B, 2>,
    wv: Tensor<B, 2>,
    wo: Tensor<B, 2>,
    bq: Tensor<B, 1>,
    bk: Tensor<B, 1>,
    bv: Tensor<B, 1>,
    attn_norm: Tensor<B, 1>,
    ffn_norm: Tensor<B, 1>,
    gate: Tensor<B, 2>,
    up: Tensor<B, 2>,
    down: Tensor<B, 2>,
    /// Keys and values of the positions seen so far, `[kv_heads, positions, head_dim]`
    kv: Option<(Tensor<B, 3>, Tensor<B, 3>)>,
}

pub struct QwenModel<B: Backend> {
    cfg: Config,
    device: B::Device,
    /// `[vocab, hidden]`
    embed: Tensor<B, 2>,
    layers: Vec<Layer<B>>,
    norm: Tensor<B, 1>,
    /// `[vocab, hidden]`
    lm_head: Tensor<B, 2>,
    /// Rotary tables, `[positions, head_dim / 2]`
    cos: Tensor<B, 2>,
    sin: Tensor<B, 2>,
}

/// Reads GGUF tensors through candle and hands them to Burn as f32
struct Reader {
    content: gguf_file::Content,
    file: std::fs::File,
}

impl Reader {
    fn dequantized(&mut self, name: &str) -> Result<candle_core::Tensor> {
        let cpu = CandleDevice::Cpu;
        let tensor = self.content.tensor(&mut self.file, name, &cpu).with_context(|| format!("GGUF tensor {name}"))?;
        Ok(tensor.dequantize(&cpu)?)
    }

    fn has(&self, name: &str) -> bool {
        self.content.tensor_infos.contains_key(name)
    }

    /// A matrix as stored (`[out, in]`)
    fn matrix<B: Backend>(&mut self, name: &str, device: &B::Device) -> Result<Tensor<B, 2>> {
        let t = self.dequantized(name)?;
        let (rows, cols) = t.dims2()?;
        Ok(Tensor::from_data(TensorData::new(t.flatten_all()?.to_vec1::<f32>()?, [rows, cols]), device))
    }

    fn vector<B: Backend>(&mut self, name: &str, device: &B::Device) -> Result<Tensor<B, 1>> {
        let v = self.dequantized(name)?.flatten_all()?.to_vec1::<f32>()?;
        let len = v.len();
        Ok(Tensor::from_data(TensorData::new(v, [len]), device))
    }

    fn metadata(&self, key: &str) -> Result<&gguf_file::Value> {
        self.content.metadata.get(key).with_context(|| format!("cannot find {key} in the GGUF metadata"))
    }
}

impl<B: Backend> QwenModel<B> {
    pub fn load(path: &Path, device: B::Device) -> Result<Self> {
        let mut file = std::fs::File::open(path).with_context(|| format!("Failed to open {}", path.display()))?;
        let content = gguf_file::Content::read(&mut file).map_err(|e| e.with_path(path))?;
        let mut r = Reader { content, file };

        let n_head = r.metadata("qwen2.attention.head_count")?.to_u32()? as usize;
        let n_kv_head = r.metadata("qwen2.attention.head_count_kv")?.to_u32()? as usize;
        let hidden = r.metadata("qwen2.embedding_length")?.to_u32()? as usize;
        let n_layer = r.metadata("qwen2.block_count")?.to_u32()? as usize;
        let context_length = r.metadata("qwen2.context_length")?.to_u32()? as usize;
        let eps = r.metadata("qwen2.attention.layer_norm_rms_epsilon")?.to_f32()?;
        let freq_base = r.metadata("qwen2.rope.freq_base").and_then(|v| Ok(v.to_f32()?)).unwrap_or(10000.0);
        let head_dim = hidden / n_head;

        let embed: Tensor<B, 2> = r.matrix("token_embd.weight", &device)?;
        let vocab = embed.dims()[0];
        // a separate output matrix when the model has one, otherwise the tied embeddings; `[vocab, hidden]` either way
        let lm_head = if r.has("output.weight") { r.matrix("output.weight", &device)? } else { embed.clone() };
        let norm = r.vector("output_norm.weight", &device)?;

        let mut layers = Vec::with_capacity(n_layer);
        for i in 0..n_layer {
            let p = format!("blk.{i}");
            layers.push(Layer {
                wq: r.matrix(&format!("{p}.attn_q.weight"), &device)?,
                wk: r.matrix(&format!("{p}.attn_k.weight"), &device)?,
                wv: r.matrix(&format!("{p}.attn_v.weight"), &device)?,
                wo: r.matrix(&format!("{p}.attn_output.weight"), &device)?,
                bq: r.vector(&format!("{p}.attn_q.bias"), &device)?,
                bk: r.vector(&format!("{p}.attn_k.bias"), &device)?,
                bv: r.vector(&format!("{p}.attn_v.bias"), &device)?,
                attn_norm: r.vector(&format!("{p}.attn_norm.weight"), &device)?,
                ffn_norm: r.vector(&format!("{p}.ffn_norm.weight"), &device)?,
                gate: r.matrix(&format!("{p}.ffn_gate.weight"), &device)?,
                up: r.matrix(&format!("{p}.ffn_up.weight"), &device)?,
                down: r.matrix(&format!("{p}.ffn_down.weight"), &device)?,
                kv: None,
            });
        }

        // rotary tables as candle builds them: theta_i = 1 / base^(2i / head_dim), angle = position * theta_i
        let half = head_dim / 2;
        let positions = context_length.min(MAX_POSITIONS);
        let theta: Vec<f32> = (0..half).map(|i| 1.0 / freq_base.powf(2.0 * i as f32 / head_dim as f32)).collect();
        let angles: Vec<f32> = (0..positions).flat_map(|pos| theta.iter().map(move |t| pos as f32 * t)).collect();
        let table = |f: fn(f32) -> f32| {
            let data: Vec<f32> = angles.iter().map(|a| f(*a)).collect();
            Tensor::from_data(TensorData::new(data, [positions, half]), &device)
        };
        let (cos, sin) = (table(f32::cos), table(f32::sin));

        Ok(Self {
            cfg: Config { n_head, n_kv_head, head_dim, hidden, eps, vocab },
            device,
            embed,
            layers,
            norm,
            lm_head,
            cos,
            sin,
        })
    }

    fn positions(&self) -> usize {
        self.cos.dims()[0]
    }

    /// Runs `ids`, which start at position `index_pos` (0 starts a new answer and drops the KV cache), and returns
    /// the logits of the last token.
    pub fn forward(&mut self, ids: &[u32], index_pos: usize) -> Result<Vec<f32>> {
        let s = ids.len();
        if s == 0 {
            bail!("Empty input");
        }
        if index_pos + s > self.positions() {
            bail!("{} positions do not fit the {} the model is set up for", index_pos + s, self.positions());
        }
        if index_pos == 0 {
            for layer in &mut self.layers {
                layer.kv = None;
            }
        }
        let half = self.cfg.head_dim / 2;
        let ids: Vec<i32> = ids.iter().map(|id| *id as i32).collect();
        let ids = Tensor::<B, 1, Int>::from_data(TensorData::new(ids, [s]), &self.device);
        // activations are kept as `[hidden, s]`: one column per token
        let mut x = self.embed.clone().select(0, ids).transpose();

        let cos = self.cos.clone().slice([index_pos..index_pos + s, 0..half]).unsqueeze_dim::<3>(0);
        let sin = self.sin.clone().slice([index_pos..index_pos + s, 0..half]).unsqueeze_dim::<3>(0);
        let mask = (s > 1).then(|| self.causal_mask(s, index_pos));

        let Self { cfg, layers, norm, lm_head, .. } = self;
        for layer in layers.iter_mut() {
            let h = rms_norm(x.clone(), &layer.attn_norm, cfg.eps);
            x = x + layer.attention(h, &cos, &sin, mask.as_ref(), cfg);
            let h = rms_norm(x.clone(), &layer.ffn_norm, cfg.eps);
            let gated = silu(layer.gate.clone().matmul(h.clone())) * layer.up.clone().matmul(h);
            x = x + layer.down.clone().matmul(gated);
        }
        let last = rms_norm(x, norm, cfg.eps).slice([0..cfg.hidden, s - 1..s]);
        let logits = lm_head.clone().matmul(last); // [vocab, 1]
        let values = logits.into_data().convert::<f32>().to_vec::<f32>().map_err(|e| anyhow::anyhow!("reading the logits: {e:?}"))?;
        if values.len() != cfg.vocab {
            bail!("expected {} logits, got {}", cfg.vocab, values.len());
        }
        Ok(values)
    }

    /// Additive causal mask `[1, 1, s, index_pos + s]`: position `i` of the input sees positions up to `index_pos + i`
    fn causal_mask(&self, s: usize, index_pos: usize) -> Tensor<B, 4> {
        let len = index_pos + s;
        let data: Vec<f32> = (0..s).flat_map(|i| (0..len).map(move |j| if j > index_pos + i { MASK_VALUE } else { 0.0 })).collect();
        Tensor::from_data(TensorData::new(data, [1, 1, s, len]), &self.device)
    }
}

impl<B: Backend> Layer<B> {
    fn attention(&mut self, x: Tensor<B, 2>, cos: &Tensor<B, 3>, sin: &Tensor<B, 3>, mask: Option<&Tensor<B, 4>>, cfg: &Config) -> Tensor<B, 2> {
        let s = x.dims()[1];
        let (nh, nkv, d) = (cfg.n_head, cfg.n_kv_head, cfg.head_dim);

        let project = |w: &Tensor<B, 2>, b: &Tensor<B, 1>, heads: usize| {
            let y = w.clone().matmul(x.clone()) + b.clone().unsqueeze_dim::<2>(1); // [heads * d, s]
            y.reshape([heads, d, s]).swap_dims(1, 2) // [heads, s, d]
        };
        let q = rope(project(&self.wq, &self.bq, nh), cos, sin);
        let mut k = rope(project(&self.wk, &self.bk, nkv), cos, sin);
        let mut v = project(&self.wv, &self.bv, nkv);

        if let Some((k_cache, v_cache)) = self.kv.take() {
            k = Tensor::cat(vec![k_cache, k], 1);
            v = Tensor::cat(vec![v_cache, v], 1);
        }
        self.kv = Some((k.clone(), v.clone()));
        let len = k.dims()[1];

        // Grouped-query attention without copying the keys: the `group` query heads that share a KV head become
        // extra rows of that head, `[nkv, group * s, d]`
        let group = nh / nkv;
        let scores = q.reshape([nkv, group * s, d]).matmul(k.swap_dims(1, 2)) * (1.0 / (d as f32).sqrt());
        let mut scores = scores.reshape([nkv, group, s, len]);
        if let Some(mask) = mask {
            scores = scores + mask.clone();
        }
        let probs = softmax(scores, 3).reshape([nkv, group * s, len]);
        let y = probs.matmul(v).reshape([nh, s, d]).swap_dims(1, 2).reshape([nh * d, s]);
        self.wo.clone().matmul(y)
    }
}

/// RMSNorm of `[hidden, s]`: each column is normalized over the hidden dimension
fn rms_norm<B: Backend>(x: Tensor<B, 2>, weight: &Tensor<B, 1>, eps: f32) -> Tensor<B, 2> {
    let mean_square = x.clone().powi_scalar(2).mean_dim(0);
    x / mean_square.add_scalar(eps).sqrt() * weight.clone().unsqueeze_dim::<2>(1)
}

/// Half-split rotary embedding of `[heads, s, head_dim]`; `cos` and `sin` are `[1, s, head_dim / 2]`
fn rope<B: Backend>(x: Tensor<B, 3>, cos: &Tensor<B, 3>, sin: &Tensor<B, 3>) -> Tensor<B, 3> {
    let [heads, s, d] = x.dims();
    let half = d / 2;
    let x1 = x.clone().slice([0..heads, 0..s, 0..half]);
    let x2 = x.slice([0..heads, 0..s, half..d]);
    let first = x1.clone() * cos.clone() - x2.clone() * sin.clone();
    let second = x1 * sin.clone() + x2 * cos.clone();
    Tensor::cat(vec![first, second], 2)
}

/// Qwen2 on a Burn backend, with the tokenizer and the streaming of text around it
pub struct BurnQwen<B: Backend> {
    model: Mutex<QwenModel<B>>,
    tokenizer: Tokenizer,
    stop_tokens: Vec<u32>,
}

impl<B: Backend> BurnQwen<B> {
    pub fn load(model_path: &Path, tokenizer_path: &Path, stop_tokens: &[&str]) -> Result<Self> {
        let model = QwenModel::load(model_path, B::Device::default())?;
        let tokenizer = Tokenizer::from_file(tokenizer_path).map_err(anyhow::Error::msg)?;
        let stop_tokens: Vec<u32> = stop_tokens.iter().filter_map(|t| tokenizer.token_to_id(t)).collect();
        if stop_tokens.is_empty() {
            bail!("The tokenizer has none of the stop tokens {stop_tokens:?}");
        }
        Ok(Self { model: Mutex::new(model), tokenizer, stop_tokens })
    }

    pub fn count_tokens(&self, text: &str) -> Result<usize> {
        Ok(self.tokenizer.encode(text, false).map_err(anyhow::Error::msg)?.len())
    }

    pub fn generate(&self, prompt: &str, params: &GenParams, on_text: impl FnMut(&str) -> bool) -> Result<GenStats> {
        let mut model = match self.model.try_lock() {
            Ok(guard) => guard,
            Err(_) => bail!("The language model is busy with another question"),
        };
        generate_with(&self.tokenizer, &self.stop_tokens, prompt, params, on_text, |ids, index_pos| {
            let logits = model.forward(ids, index_pos)?;
            let len = logits.len();
            Ok(candle_core::Tensor::from_vec(logits, len, &CandleDevice::Cpu)?)
        })
    }
}

#[cfg(test)]
mod tests {
    use burn::backend::NdArray;

    use super::super::generation::{LlmKind, LlmService, GenParams};
    use super::*;

    const PROMPT: &str = "<|im_start|>system\nJawab singkat dalam Bahasa Indonesia.<|im_end|>\n\
                          <|im_start|>user\nSebutkan tiga kota besar di Indonesia.<|im_end|>\n<|im_start|>assistant\n";

    fn greedy() -> GenParams {
        GenParams { temperature: 0.0, max_new_tokens: 24, ..Default::default() }
    }

    /// What the candle engine answers (CPU), as the reference
    fn candle_answer() -> String {
        crate::services::ai::generation::set_backend(crate::services::ai::generation::LlmBackend::Cpu);
        LlmService::global(LlmKind::Qwen).unwrap().generate(PROMPT, &greedy(), |_| true).unwrap().text
    }

    fn burn_answer<B: Backend>() -> GenStats {
        let kind = LlmKind::Qwen;
        let engine = BurnQwen::<B>::load(&kind.model_path(), &kind.tokenizer_path(), kind.stop_tokens()).unwrap();
        engine.generate(PROMPT, &greedy(), |_| true).unwrap()
    }

    /// Needs the Qwen model files. The same greedy answer as candle shows the architecture is implemented right.
    #[test]
    #[ignore]
    fn burn_on_the_cpu_answers_like_candle() {
        let reference = candle_answer();
        let stats = burn_answer::<NdArray>();
        println!("candle: {reference}\nburn:   {}\n({} ms prompt, {} ms for {} tokens)", stats.text, stats.prompt_ms, stats.generation_ms, stats.new_tokens);
        assert_eq!(stats.text, reference);
    }

    /// Needs the Qwen model files and a Vulkan GPU (`--features vulkan`)
    #[cfg(feature = "vulkan")]
    #[test]
    #[ignore]
    fn burn_on_the_gpu_answers_like_candle() {
        let reference = candle_answer();
        let stats = burn_answer::<Gpu>();
        println!("candle: {reference}\nburn:   {}\n({} ms prompt, {} ms for {} tokens)", stats.text, stats.prompt_ms, stats.generation_ms, stats.new_tokens);
        assert_eq!(stats.text, reference);
    }

    /// Times the decode-shaped matmul (one row times a big matrix) on the GPU in several layouts
    #[cfg(feature = "vulkan")]
    #[test]
    #[ignore]
    fn bench_matvec_on_the_gpu() {
        bench::<Gpu>("f32");
        bench::<burn::backend::Wgpu<burn::tensor::f16>>("f16");
    }

    #[cfg(feature = "vulkan")]
    fn bench<B: Backend>(label: &str) {
        use std::time::Instant;
        let device = Default::default();
        let time = |what: &str, bytes: usize, run: &dyn Fn() -> Tensor<B, 2>| {
            for _ in 0..3 {
                let _ = run().into_data();
            }
            let iters = 20;
            let started = Instant::now();
            let mut out = run();
            for _ in 1..iters {
                out = out + run();
            }
            let _ = out.into_data();
            let ms = started.elapsed().as_secs_f64() * 1000.0 / iters as f64;
            println!("{label} {what}: {ms:.3} ms, {:.0} GB/s", bytes as f64 / 1e9 / (ms / 1000.0));
        };
        for (name, k, n) in [("ffn_up 1536->8960", 1536usize, 8960usize), ("ffn_down 8960->1536", 8960, 1536), ("lm_head 1536->151936", 1536, 151936)] {
            let bytes = k * n * if label == "f16" { 2 } else { 4 };
            let w_in_out: Tensor<B, 2> = Tensor::from_data(TensorData::new(vec![0.01f32; k * n], [k, n]), &device);
            let w_out_in: Tensor<B, 2> = Tensor::from_data(TensorData::new(vec![0.01f32; n * k], [n, k]), &device);
            let x: Tensor<B, 2> = Tensor::from_data(TensorData::new(vec![0.5f32; k], [1, k]), &device);
            let x16: Tensor<B, 2> = Tensor::from_data(TensorData::new(vec![0.5f32; 16 * k], [16, k]), &device);
            let x_col: Tensor<B, 2> = Tensor::from_data(TensorData::new(vec![0.5f32; k], [k, 1]), &device);
            time(&format!("{name} x[1,k]@W[k,n]"), bytes, &|| x.clone().matmul(w_in_out.clone()));
            time(&format!("{name} W[n,k]@x[k,1]"), bytes, &|| w_out_in.clone().matmul(x_col.clone()).reshape([1, n]));
            time(&format!("{name} x[16,k]@W[k,n]"), bytes, &|| x16.clone().matmul(w_in_out.clone()).slice([0..1, 0..n]));
        }
    }
}
