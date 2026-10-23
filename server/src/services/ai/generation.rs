//! Local text generation with Qwen2.5-1.5B-Instruct (GGUF, 4-bit `Q4_K_M`) on the CPU.
//!
//! The model is loaded with candle's quantized Qwen2 implementation, so no GPU, Python or llama.cpp is
//! needed. One generation runs at a time because the model keeps its KV cache between forward passes.

use std::path::PathBuf;
use std::sync::Mutex;
use std::time::Instant;

use anyhow::{Context, Result, bail};
use candle_core::quantized::gguf_file;
use candle_core::{Device, Tensor};
use candle_transformers::generation::{LogitsProcessor, Sampling};
use candle_transformers::models::quantized_qwen2::ModelWeights;
use candle_transformers::utils::apply_repeat_penalty;
use once_cell::sync::OnceCell;
use tokenizers::Tokenizer;

/// Default GGUF file, relative to the server's working directory (override with `LLM_MODEL_PATH`).
/// Download with:
/// `hf download Qwen/Qwen2.5-1.5B-Instruct-GGUF qwen2.5-1.5b-instruct-q4_k_m.gguf --local-dir models`
const DEFAULT_MODEL_PATH: &str = "models/qwen2.5-1.5b-instruct-q4_k_m.gguf";

/// Folder holding Qwen's `tokenizer.json` (override with `LLM_TOKENIZER_DIR`). Download with:
/// `hf download Qwen/Qwen2.5-1.5B-Instruct tokenizer.json --local-dir models/qwen2.5-1.5b-instruct`
const DEFAULT_TOKENIZER_DIR: &str = "models/qwen2.5-1.5b-instruct";

/// Recorded with every generated answer
pub const LLM_MODEL: &str = "Qwen/Qwen2.5-1.5B-Instruct-GGUF qwen2.5-1.5b-instruct-q4_k_m.gguf";

/// `<|im_end|>` and `<|endoftext|>`
const STOP_TOKENS: [u32; 2] = [151645, 151643];

/// Recent tokens a repetition penalty applies to
const REPEAT_WINDOW: usize = 64;
const REPEAT_PENALTY: f32 = 1.1;

static LLM: OnceCell<LlmService> = OnceCell::new();

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

pub struct LlmService {
    model: Mutex<ModelWeights>,
    tokenizer: Tokenizer,
    device: Device,
}

/// Where the model files are expected
pub fn model_path() -> PathBuf {
    PathBuf::from(std::env::var("LLM_MODEL_PATH").unwrap_or_else(|_| DEFAULT_MODEL_PATH.to_owned()))
}

pub fn tokenizer_path() -> PathBuf {
    PathBuf::from(std::env::var("LLM_TOKENIZER_DIR").unwrap_or_else(|_| DEFAULT_TOKENIZER_DIR.to_owned()))
        .join("tokenizer.json")
}

/// Whether the model has been loaded into memory yet (the first question loads it)
pub fn is_loaded() -> bool {
    LLM.get().is_some()
}

impl LlmService {
    /// Shared instance, loaded on first use (a few seconds). Blocking: call from `spawn_blocking`.
    pub fn global() -> Result<&'static Self> {
        LLM.get_or_try_init(Self::load)
    }

    fn load() -> Result<Self> {
        let device = Device::Cpu;
        let path = model_path();
        let mut file = std::fs::File::open(&path).with_context(|| format!("Failed to open {}", path.display()))?;
        let content = gguf_file::Content::read(&mut file).map_err(|e| e.with_path(&path))?;
        let model = ModelWeights::from_gguf(content, &mut file, &device)?;
        let tokenizer = Tokenizer::from_file(tokenizer_path()).map_err(anyhow::Error::msg)?;
        Ok(Self { model: Mutex::new(model), tokenizer, device })
    }

    /// Generates a completion for a ChatML prompt, calling `on_text` with each new piece of text.
    /// `on_text` returns false to stop early. Blocking and CPU heavy: call from `spawn_blocking`.
    /// Fails when another generation is running.
    pub fn generate(&self, prompt: &str, params: &GenParams, mut on_text: impl FnMut(&str) -> bool) -> Result<GenStats> {
        let mut model = match self.model.try_lock() {
            Ok(guard) => guard,
            Err(_) => bail!("The language model is busy with another question"),
        };

        let prompt_ids = self.tokenizer.encode(prompt, false).map_err(anyhow::Error::msg)?.get_ids().to_vec();
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

        // index_pos 0 resets the model's KV cache, so the whole prompt goes in one pass
        let started = Instant::now();
        let input = Tensor::new(prompt_ids.as_slice(), &self.device)?.unsqueeze(0)?;
        let logits = model.forward(&input, 0)?.squeeze(0)?;
        let mut next = sampler.sample(&logits)?;
        let prompt_ms = started.elapsed().as_millis();

        let started = Instant::now();
        let mut generated: Vec<u32> = Vec::new();
        let mut stream = TextStream::default();
        let mut finish_reason = "length";
        for step in 0..params.max_new_tokens {
            if STOP_TOKENS.contains(&next) {
                finish_reason = "stop";
                break;
            }
            generated.push(next);
            if let Some(piece) = stream.push(&self.tokenizer, &generated)?
                && !on_text(&piece)
            {
                finish_reason = "cancelled";
                break;
            }
            if step + 1 == params.max_new_tokens {
                break;
            }

            let input = Tensor::new(&[next], &self.device)?.unsqueeze(0)?;
            let logits = model.forward(&input, prompt_ids.len() + step)?.squeeze(0)?;
            let start = generated.len().saturating_sub(REPEAT_WINDOW);
            let logits = apply_repeat_penalty(&logits, REPEAT_PENALTY, &generated[start..])?;
            next = sampler.sample(&logits)?;
        }
        if let Some(rest) = stream.finish(&self.tokenizer, &generated)? {
            on_text(&rest);
        }

        let text = self.tokenizer.decode(&generated, true).map_err(anyhow::Error::msg)?;
        Ok(GenStats {
            text,
            prompt_tokens: prompt_ids.len(),
            new_tokens: generated.len(),
            prompt_ms,
            generation_ms: started.elapsed().as_millis(),
            finish_reason,
        })
    }
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
        let llm = LlmService::global().unwrap();
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
