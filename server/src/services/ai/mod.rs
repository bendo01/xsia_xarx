pub mod docling;
pub mod embedding;
pub mod generation;
pub mod ingest;
pub mod knowledge;

pub use embedding::EmbeddingService;

use std::time::Instant;

use generation::{LlmKind, LlmService};

/// Loads the RAG models at startup so the first question or embedding job does not pay for it.
/// `RAG_PRELOAD=false` turns it off; `RAG_PRELOAD_LLMS` (comma separated, default `qwen`) picks the language models.
/// A model that fails to load only logs a warning, and is then loaded on first use as before.
pub async fn preload_rag_models() {
    if std::env::var("RAG_PRELOAD").is_ok_and(|v| v.eq_ignore_ascii_case("false") || v == "0") {
        tracing::info!("RAG model preload disabled");
        return;
    }

    let kinds: Vec<LlmKind> = match std::env::var("RAG_PRELOAD_LLMS") {
        Ok(list) => list.split(',').filter(|s| !s.trim().is_empty()).filter_map(LlmKind::parse).collect(),
        Err(_) => vec![LlmKind::default()],
    };

    let embedder = tokio::task::spawn_blocking(|| {
        let start = Instant::now();
        let result = EmbeddingService::global().and_then(|e| {
            // One embedding touches the mmapped weights, so the first real query does not page them in
            e.embed_query("warm up").map(|_| ())
        });
        (result, start.elapsed())
    });

    let llms = kinds.into_iter().map(|kind| {
        tokio::task::spawn_blocking(move || {
            let start = Instant::now();
            if !kind.model_path().exists() {
                return (kind, Err(anyhow::anyhow!("{} not found", kind.model_path().display())), start.elapsed());
            }
            (kind, LlmService::global(kind).map(|_| ()), start.elapsed())
        })
    });

    let (embedder, llms) = tokio::join!(embedder, futures_util::future::join_all(llms));

    match embedder {
        Ok((Ok(()), took)) => tracing::info!("Embedding model preloaded in {took:?}"),
        Ok((Err(e), _)) => tracing::warn!("Embedding model preload failed, it will load on first use: {e:#}"),
        Err(e) => tracing::warn!("Embedding model preload task failed: {e}"),
    }
    for llm in llms {
        match llm {
            Ok((kind, Ok(()), took)) => tracing::info!("LLM {} preloaded in {took:?}", kind.id()),
            Ok((kind, Err(e), _)) => tracing::warn!("LLM {} preload failed, it will load on first use: {e:#}", kind.id()),
            Err(e) => tracing::warn!("LLM preload task failed: {e}"),
        }
    }
}
