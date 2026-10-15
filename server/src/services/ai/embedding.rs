use std::path::PathBuf;

use anyhow::{Context, Result};
use candle_core::{Device, Tensor};
use candle_nn::VarBuilder;
use candle_transformers::models::bert::{BertModel, Config, DTYPE};
use once_cell::sync::OnceCell;
use tokenizers::{PaddingParams, Tokenizer, TruncationParams};

/// Output size of `paraphrase-multilingual-MiniLM-L12-v2`; matches the `vector(384)` column of `ai.chunks`
pub const EMBEDDING_DIMENSION: usize = 384;

/// `max_seq_length` from the model's `sentence_bert_config.json`
const MAX_TOKENS: usize = 128;

/// Default location of the model files, relative to the server's working directory.
/// Download with:
/// `hf download sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2 config.json tokenizer.json model.safetensors --local-dir models/paraphrase-multilingual-MiniLM-L12-v2`
const DEFAULT_MODEL_DIR: &str = "models/paraphrase-multilingual-MiniLM-L12-v2";

/// Recorded in each chunk's metadata
pub const EMBEDDING_MODEL: &str = "sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2";

static EMBEDDER: OnceCell<EmbeddingService> = OnceCell::new();

/// Multilingual (incl. Indonesian) sentence embeddings with `paraphrase-multilingual-MiniLM-L12-v2`
/// on the CPU: mean pooling over the attention mask, then L2 normalization so that cosine
/// distance and inner product rank results the same
pub struct EmbeddingService {
    model: BertModel,
    tokenizer: Tokenizer,
    device: Device,
}

impl EmbeddingService {
    /// Shared instance, loaded on first use. Blocking: call from `spawn_blocking`.
    pub fn global() -> Result<&'static Self> {
        EMBEDDER.get_or_try_init(Self::load)
    }

    fn model_dir() -> PathBuf {
        std::env::var("EMBEDDING_MODEL_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| PathBuf::from(DEFAULT_MODEL_DIR))
    }

    fn load() -> Result<Self> {
        let dir = Self::model_dir();
        let device = Device::Cpu;

        let config_path = dir.join("config.json");
        let config: Config = serde_json::from_str(
            &std::fs::read_to_string(&config_path)
                .with_context(|| format!("Failed to read {}", config_path.display()))?,
        )?;

        let mut tokenizer = Tokenizer::from_file(dir.join("tokenizer.json")).map_err(anyhow::Error::msg)?;
        tokenizer.with_padding(Some(PaddingParams::default()));
        tokenizer
            .with_truncation(Some(TruncationParams { max_length: MAX_TOKENS, ..Default::default() }))
            .map_err(anyhow::Error::msg)?;

        // SAFETY: the safetensors file is only read, and is not modified while the server runs
        let vb = unsafe { VarBuilder::from_mmaped_safetensors(&[dir.join("model.safetensors")], DTYPE, &device)? };
        let model = BertModel::load(vb, &config)?;

        Ok(Self { model, tokenizer, device })
    }

    /// Embeds each text into a unit-length 384-dimension vector. Blocking and CPU heavy.
    pub fn embed(&self, texts: &[String]) -> Result<Vec<Vec<f32>>> {
        if texts.is_empty() {
            return Ok(Vec::new());
        }

        let encodings = self
            .tokenizer
            .encode_batch(texts.iter().map(String::as_str).collect::<Vec<_>>(), true)
            .map_err(anyhow::Error::msg)?;

        let ids = encodings
            .iter()
            .map(|e| Tensor::new(e.get_ids(), &self.device))
            .collect::<candle_core::Result<Vec<_>>>()?;
        let masks = encodings
            .iter()
            .map(|e| Tensor::new(e.get_attention_mask(), &self.device))
            .collect::<candle_core::Result<Vec<_>>>()?;

        let input_ids = Tensor::stack(&ids, 0)?;
        let attention_mask = Tensor::stack(&masks, 0)?;
        let token_type_ids = input_ids.zeros_like()?;

        // (batch, tokens, 384)
        let hidden = self.model.forward(&input_ids, &token_type_ids, Some(&attention_mask))?;

        // Mean pooling that ignores padding tokens
        let mask = attention_mask.to_dtype(DTYPE)?.unsqueeze(2)?;
        let summed = hidden.broadcast_mul(&mask)?.sum(1)?;
        let counts = mask.sum(1)?;
        let pooled = summed.broadcast_div(&counts)?;

        let norms = pooled.sqr()?.sum_keepdim(1)?.sqrt()?;
        let normalized = pooled.broadcast_div(&norms)?;

        Ok(normalized.to_vec2::<f32>()?)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Needs the model files in `models/paraphrase-multilingual-MiniLM-L12-v2`
    #[test]
    #[ignore]
    fn embeds_unit_vectors_with_semantic_similarity() {
        let embedder = EmbeddingService::global().unwrap();
        let vectors = embedder
            .embed(&[
                "The cat sits on the mat".to_string(),
                "A kitten is resting on a rug".to_string(),
                "Seekor kucing tidur di atas karpet".to_string(),
                "Quarterly tax filing deadlines".to_string(),
            ])
            .unwrap();

        let dot = |a: &[f32], b: &[f32]| a.iter().zip(b).map(|(x, y)| x * y).sum::<f32>();
        assert_eq!(vectors[0].len(), EMBEDDING_DIMENSION);
        assert!((dot(&vectors[0], &vectors[0]) - 1.0).abs() < 1e-4);
        assert!(dot(&vectors[0], &vectors[1]) > dot(&vectors[0], &vectors[3]));
        // Indonesian and English sentences with the same meaning land close together
        assert!(dot(&vectors[0], &vectors[2]) > dot(&vectors[0], &vectors[3]));
    }
}
