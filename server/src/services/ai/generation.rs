//! Local text generation with a quantized GGUF model: Qwen2.5-1.5B-Instruct or Gemma 3 4B.
//!
//! Three backends, chosen by the application preference (see [`LlmBackend`]) when a model loads:
//! - `cpu`: candle's quantized implementations on the CPU, always available;
//! - `cuda`: the same on an NVIDIA GPU, in builds with `--features cuda`;
//! - `vulkan`: Burn with the wgpu backend on any Vulkan GPU, AMD and Intel included, in builds with
//!   `--features vulkan`. Only Qwen is implemented there; Gemma falls back to the CPU.
//!
//! Each model is loaded on first use and then stays in memory, so a changed preference applies to models
//! loaded after it. One generation runs at a time per model because a model keeps its KV cache between passes.

use std::path::PathBuf;
use std::sync::Mutex;
use std::sync::atomic::{AtomicU8, Ordering};
use std::time::Instant;

use anyhow::{Context, Result, bail};
use candle_core::quantized::gguf_file;
use candle_core::{Device, Tensor};
use candle_transformers::generation::{LogitsProcessor, Sampling};
use candle_transformers::models::{quantized_gemma3, quantized_qwen2};
use candle_transformers::utils::apply_repeat_penalty;
use once_cell::sync::OnceCell;
use tokenizers::Tokenizer;

/// The language models a question can be answered with
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum LlmKind {
    #[default]
    Qwen,
    Gemma,
}

impl LlmKind {
    pub const ALL: [LlmKind; 2] = [LlmKind::Qwen, LlmKind::Gemma];

    /// Identifier used in requests and responses
    pub fn id(self) -> &'static str {
        match self {
            Self::Qwen => "qwen",
            Self::Gemma => "gemma",
        }
    }

    pub fn parse(id: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|k| k.id() == id.trim().to_ascii_lowercase())
    }

    /// Recorded with every generated answer
    pub fn label(self) -> &'static str {
        match self {
            Self::Qwen => "Qwen/Qwen2.5-1.5B-Instruct-GGUF qwen2.5-1.5b-instruct-q4_k_m.gguf",
            Self::Gemma => "ggml-org/gemma-3-4b-it-GGUF gemma-3-4b-it-Q4_K_M.gguf",
        }
    }

    /// GGUF file, relative to the server's working directory. Qwen: `LLM_MODEL_PATH`, Gemma: `GEMMA_MODEL_PATH`.
    /// Download with:
    /// `hf download Qwen/Qwen2.5-1.5B-Instruct-GGUF qwen2.5-1.5b-instruct-q4_k_m.gguf --local-dir models`
    /// `hf download ggml-org/gemma-3-4b-it-GGUF gemma-3-4b-it-Q4_K_M.gguf --local-dir models`
    pub fn model_path(self) -> PathBuf {
        let (var, default) = match self {
            Self::Qwen => ("LLM_MODEL_PATH", "models/qwen2.5-1.5b-instruct-q4_k_m.gguf"),
            Self::Gemma => ("GEMMA_MODEL_PATH", "models/gemma-3-4b-it-Q4_K_M.gguf"),
        };
        PathBuf::from(std::env::var(var).unwrap_or_else(|_| default.to_owned()))
    }

    /// `tokenizer.json` of the model. Qwen: `LLM_TOKENIZER_DIR`, Gemma: `GEMMA_TOKENIZER_DIR`. Download with:
    /// `hf download Qwen/Qwen2.5-1.5B-Instruct tokenizer.json --local-dir models/qwen2.5-1.5b-instruct`
    /// `hf download google/gemma-3-4b-it tokenizer.json --local-dir models/gemma-3-4b-it` (gated)
    pub fn tokenizer_path(self) -> PathBuf {
        let (var, default) = match self {
            Self::Qwen => ("LLM_TOKENIZER_DIR", "models/qwen2.5-1.5b-instruct"),
            Self::Gemma => ("GEMMA_TOKENIZER_DIR", "models/gemma-3-4b-it"),
        };
        PathBuf::from(std::env::var(var).unwrap_or_else(|_| default.to_owned())).join("tokenizer.json")
    }

    /// Longest prompt (system, sources and question) worth sending. Gemma 3 answers well up to about 1,070 tokens
    /// and then turns to gibberish (seen at 1,190 and above), so it is held below that; a longer prompt also
    /// only slows a CPU model down.
    pub fn max_prompt_tokens(self) -> usize {
        match self {
            Self::Qwen => 2000,
            Self::Gemma => 1000,
        }
    }

    /// Tokens that end an answer
    pub(super) fn stop_tokens(self) -> &'static [&'static str] {
        match self {
            Self::Qwen => &["<|im_end|>", "<|endoftext|>"],
            Self::Gemma => &["<end_of_turn>", "<eos>"],
        }
    }

    fn slot(self) -> &'static OnceCell<LlmService> {
        static QWEN: OnceCell<LlmService> = OnceCell::new();
        static GEMMA: OnceCell<LlmService> = OnceCell::new();
        match self {
            Self::Qwen => &QWEN,
            Self::Gemma => &GEMMA,
        }
    }
}

/// Recent tokens a repetition penalty applies to
const REPEAT_WINDOW: usize = 64;
const REPEAT_PENALTY: f32 = 1.1;

#[derive(Clone, Debug)]
pub struct GenParams {
    /// 0 picks the most likely token every time (deterministic)
    pub temperature: f64,
    pub top_p: f64,
    pub max_new_tokens: usize,
}

impl Default for GenParams {
    fn default() -> Self {
        Self { temperature: 0.2, top_p: 0.9, max_new_tokens: 400 }
    }
}

#[derive(Clone, Debug)]
pub struct GenStats {
    pub text: String,
    pub prompt_tokens: usize,
    pub new_tokens: usize,
    pub prompt_ms: u128,
    pub generation_ms: u128,
    /// `stop` when the model finished, `length` when `max_new_tokens` was reached, `cancelled` when the caller stopped
    pub finish_reason: &'static str,
}

enum Weights {
    Qwen(quantized_qwen2::ModelWeights),
    Gemma(quantized_gemma3::ModelWeights),
}

impl Weights {
    fn forward(&mut self, x: &Tensor, index_pos: usize) -> candle_core::Result<Tensor> {
        match self {
            Self::Qwen(m) => m.forward(x, index_pos),
            Self::Gemma(m) => m.forward(x, index_pos),
        }
    }
}

/// Where the language model runs
#[derive(Clone, Copy, Debug, Default, PartialEq, Eq)]
pub enum LlmBackend {
    #[default]
    Cpu,
    /// NVIDIA GPU through candle
    Cuda,
    /// Any Vulkan GPU (AMD, Intel, NVIDIA) through Burn + wgpu; Qwen only for now
    Vulkan,
}

impl LlmBackend {
    pub const ALL: [LlmBackend; 3] = [LlmBackend::Cpu, LlmBackend::Cuda, LlmBackend::Vulkan];

    /// Identifier stored in `preference.applications.llm_backend`
    pub fn id(self) -> &'static str {
        match self {
            Self::Cpu => "cpu",
            Self::Cuda => "cuda",
            Self::Vulkan => "vulkan",
        }
    }

    pub fn parse(id: &str) -> Option<Self> {
        Self::ALL.into_iter().find(|b| b.id() == id.trim().to_ascii_lowercase())
    }

    /// Whether this build contains the backend (`cuda` and `vulkan` are cargo features)
    pub const fn supported(self) -> bool {
        match self {
            Self::Cpu => true,
            Self::Cuda => cfg!(feature = "cuda"),
            Self::Vulkan => cfg!(feature = "vulkan"),
        }
    }

    /// Backends this build can run
    pub fn available() -> Vec<LlmBackend> {
        Self::ALL.into_iter().filter(|b| b.supported()).collect()
    }
}

static BACKEND: AtomicU8 = AtomicU8::new(0);

/// Backend for models loaded from now on. A model already in memory keeps the one it was loaded with.
pub fn set_backend(backend: LlmBackend) {
    let index = LlmBackend::ALL.iter().position(|b| *b == backend).unwrap_or(0);
    BACKEND.store(index as u8, Ordering::Relaxed);
}

fn selected_backend() -> LlmBackend {
    LlmBackend::ALL.get(usize::from(BACKEND.load(Ordering::Relaxed))).copied().unwrap_or_default()
}

/// The backend a model in memory runs on
pub fn loaded_backend(kind: LlmKind) -> Option<LlmBackend> {
    kind.slot().get().map(|llm| llm.backend)
}

/// Whether the model has been loaded into memory yet (the first question loads it)
pub fn is_loaded(kind: LlmKind) -> bool {
    kind.slot().get().is_some()
}

enum Engine {
    Candle(CandleEngine),
    #[cfg(feature = "vulkan")]
    Burn(super::burn_qwen::BurnQwen<super::burn_qwen::Gpu>),
}

pub struct LlmService {
    engine: Engine,
    /// What the model actually runs on, which differs from the preference when that was unavailable
    backend: LlmBackend,
}

impl LlmService {
    /// Shared instance, loaded on first use (a few seconds). Blocking: call from `spawn_blocking`.
    pub fn global(kind: LlmKind) -> Result<&'static Self> {
        kind.slot().get_or_try_init(|| Self::load(kind))
    }

    fn load(kind: LlmKind) -> Result<Self> {
        let wanted = selected_backend();
        let backend = if wanted.supported() {
            wanted
        } else {
            tracing::warn!("The {} backend is not in this build (cargo feature `{}`); the LLM runs on the CPU", wanted.id(), wanted.id());
            LlmBackend::Cpu
        };
        match backend {
            #[cfg(feature = "vulkan")]
            LlmBackend::Vulkan if kind == LlmKind::Qwen => {
                let engine = super::burn_qwen::BurnQwen::load(&kind.model_path(), &kind.tokenizer_path(), kind.stop_tokens())?;
                tracing::info!("LLM {} runs on a Vulkan GPU (Burn + wgpu)", kind.id());
                Ok(Self { engine: Engine::Burn(engine), backend })
            }
            _ => {
                if backend == LlmBackend::Vulkan {
                    tracing::warn!("The {} model has no Vulkan implementation yet (or the build lacks it); it runs on the CPU", kind.id());
                }
                let (device, backend) = candle_device(backend);
                Ok(Self { engine: Engine::Candle(CandleEngine::load(kind, device)?), backend })
            }
        }
    }

    /// Number of tokens `text` takes in the model's tokenizer
    pub fn count_tokens(&self, text: &str) -> Result<usize> {
        match &self.engine {
            Engine::Candle(e) => e.count_tokens(text),
            #[cfg(feature = "vulkan")]
            Engine::Burn(e) => e.count_tokens(text),
        }
    }

    /// Generates a completion for a prompt in the model's chat format, calling `on_text` with each new piece of text.
    /// `on_text` returns false to stop early. Blocking and heavy: call from `spawn_blocking`.
    /// Fails when another generation is running.
    pub fn generate(&self, prompt: &str, params: &GenParams, on_text: impl FnMut(&str) -> bool) -> Result<GenStats> {
        match &self.engine {
            Engine::Candle(e) => e.generate(prompt, params, on_text),
            #[cfg(feature = "vulkan")]
            Engine::Burn(e) => e.generate(prompt, params, on_text),
        }
    }
}

/// The candle device for `backend`, and the backend it really is (the CPU when CUDA fails)
fn candle_device(backend: LlmBackend) -> (Device, LlmBackend) {
    if backend == LlmBackend::Cuda {
        match Device::new_cuda(0) {
            Ok(device) => {
                tracing::info!("LLM runs on the NVIDIA GPU (candle CUDA)");
                return (device, LlmBackend::Cuda);
            }
            Err(e) => tracing::warn!("CUDA is unavailable, the LLM runs on the CPU: {e}"),
        }
    }
    (Device::Cpu, LlmBackend::Cpu)
}

struct CandleEngine {
    model: Mutex<Weights>,
    tokenizer: Tokenizer,
    device: Device,
    stop_tokens: Vec<u32>,
}

impl CandleEngine {
    fn load(kind: LlmKind, device: Device) -> Result<Self> {
        let path = kind.model_path();
        let mut file = std::fs::File::open(&path).with_context(|| format!("Failed to open {}", path.display()))?;
        let content = gguf_file::Content::read(&mut file).map_err(|e| e.with_path(&path))?;
        let model = match kind {
            LlmKind::Qwen => Weights::Qwen(quantized_qwen2::ModelWeights::from_gguf(content, &mut file, &device)?),
            LlmKind::Gemma => Weights::Gemma(quantized_gemma3::ModelWeights::from_gguf(content, &mut file, &device)?),
        };
        let tokenizer = Tokenizer::from_file(kind.tokenizer_path()).map_err(anyhow::Error::msg)?;
        let stop_tokens: Vec<u32> = kind.stop_tokens().iter().filter_map(|t| tokenizer.token_to_id(t)).collect();
        if stop_tokens.is_empty() {
            bail!("The tokenizer has none of the stop tokens {:?}", kind.stop_tokens());
        }
        Ok(Self { model: Mutex::new(model), tokenizer, device, stop_tokens })
    }

    fn count_tokens(&self, text: &str) -> Result<usize> {
        Ok(self.tokenizer.encode(text, false).map_err(anyhow::Error::msg)?.len())
    }

    fn generate(&self, prompt: &str, params: &GenParams, on_text: impl FnMut(&str) -> bool) -> Result<GenStats> {
        let mut model = match self.model.try_lock() {
            Ok(guard) => guard,
            Err(_) => bail!("The language model is busy with another question"),
        };
        // index_pos 0 resets the model's KV cache, so the whole prompt goes in one pass
        generate_with(&self.tokenizer, &self.stop_tokens, prompt, params, on_text, |ids, index_pos| {
            let input = Tensor::new(ids, &self.device)?.unsqueeze(0)?;
            Ok(model.forward(&input, index_pos)?.squeeze(0)?)
        })
    }
}

/// Streams a completion from any model. `forward(tokens, index_pos)` runs the tokens that start at position
/// `index_pos` (0 starts a new answer) and returns the logits of the last one.
pub(super) fn generate_with(
    tokenizer: &Tokenizer,
    stop_tokens: &[u32],
    prompt: &str,
    params: &GenParams,
    mut on_text: impl FnMut(&str) -> bool,
    mut forward: impl FnMut(&[u32], usize) -> Result<Tensor>,
) -> Result<GenStats> {
    let prompt_ids = tokenizer.encode(prompt, false).map_err(anyhow::Error::msg)?.get_ids().to_vec();
    if prompt_ids.is_empty() {
        bail!("Empty prompt");
    }

    let sampling = if params.temperature <= 0.0 {
        Sampling::ArgMax
    } else {
        Sampling::TopP { p: params.top_p, temperature: params.temperature }
    };
    let seed = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map_or(299792458, |d| d.as_nanos() as u64);
    let mut sampler = LogitsProcessor::from_sampling(seed, sampling);

    let started = Instant::now();
    let logits = forward(&prompt_ids, 0)?;
    let mut next = sampler.sample(&logits)?;
    let prompt_ms = started.elapsed().as_millis();

    let started = Instant::now();
    let mut generated: Vec<u32> = Vec::new();
    let mut stream = TextStream::default();
    let mut finish_reason = "length";
    for step in 0..params.max_new_tokens {
        if stop_tokens.contains(&next) {
            finish_reason = "stop";
            break;
        }
        generated.push(next);
        if let Some(piece) = stream.push(tokenizer, &generated)?
            && !on_text(&piece)
        {
            finish_reason = "cancelled";
            break;
        }
        if step + 1 == params.max_new_tokens {
            break;
        }

        let logits = forward(&[next], prompt_ids.len() + step)?;
        let start = generated.len().saturating_sub(REPEAT_WINDOW);
        let logits = apply_repeat_penalty(&logits, REPEAT_PENALTY, &generated[start..])?;
        next = sampler.sample(&logits)?;
    }
    if let Some(rest) = stream.finish(tokenizer, &generated)? {
        on_text(&rest);
    }

    let text = tokenizer.decode(&generated, true).map_err(anyhow::Error::msg)?;
    Ok(GenStats {
        text,
        prompt_tokens: prompt_ids.len(),
        new_tokens: generated.len(),
        prompt_ms,
        generation_ms: started.elapsed().as_millis(),
        finish_reason,
    })
}

/// Turns a growing token list into text pieces. A token can end in the middle of a UTF-8 character, so a piece
/// is only released once the decoded text no longer ends in the replacement character.
#[derive(Default)]
struct TextStream {
    prev_index: usize,
    current_index: usize,
}

impl TextStream {
    fn decode(tokenizer: &Tokenizer, tokens: &[u32]) -> Result<String> {
        tokenizer.decode(tokens, true).map_err(anyhow::Error::msg)
    }

    fn push(&mut self, tokenizer: &Tokenizer, tokens: &[u32]) -> Result<Option<String>> {
        let prev_text = if tokens.is_empty() || self.prev_index == self.current_index {
            String::new()
        } else {
            Self::decode(tokenizer, &tokens[self.prev_index..self.current_index])?
        };
        let text = Self::decode(tokenizer, &tokens[self.prev_index..])?;
        if text.len() > prev_text.len() && !text.ends_with('\u{FFFD}') {
            let piece = text.split_at(prev_text.len()).1.to_owned();
            self.prev_index = self.current_index;
            self.current_index = tokens.len();
            Ok(Some(piece))
        } else {
            Ok(None)
        }
    }

    /// Whatever is left once generation ends
    fn finish(&mut self, tokenizer: &Tokenizer, tokens: &[u32]) -> Result<Option<String>> {
        let prev_text = if self.prev_index == self.current_index {
            String::new()
        } else {
            Self::decode(tokenizer, &tokens[self.prev_index..self.current_index])?
        };
        let text = Self::decode(tokenizer, &tokens[self.prev_index..])?;
        Ok((text.len() > prev_text.len()).then(|| text.split_at(prev_text.len()).1.to_owned()))
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Needs `models/qwen2.5-1.5b-instruct-q4_k_m.gguf` and `models/qwen2.5-1.5b-instruct/tokenizer.json`
    #[test]
    #[ignore]
    fn answers_in_indonesian_on_the_cpu() {
        let llm = LlmService::global(LlmKind::Qwen).unwrap();
        let prompt = "<|im_start|>system\nJawab singkat dalam Bahasa Indonesia.<|im_end|>\n\
                      <|im_start|>user\nApa kepanjangan UU PT?<|im_end|>\n<|im_start|>assistant\n";
        let mut streamed = String::new();
        let stats = llm
            .generate(prompt, &GenParams { max_new_tokens: 60, ..Default::default() }, |piece| {
                streamed.push_str(piece);
                true
            })
            .unwrap();
        println!("{stats:?}");
        assert!(!stats.text.trim().is_empty());
        assert_eq!(streamed.trim(), stats.text.trim());
    }
}
