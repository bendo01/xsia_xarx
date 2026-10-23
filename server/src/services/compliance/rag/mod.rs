//! Retrieval for the compliance RAG: hybrid (dense + lexical) search over regulation chunks in
//! `ai.chunks`, and the link from detected anomalies to the regulation text that governs them.
//! Retrieval itself uses no LLM; [`answer`] turns hits into the prompt for the generator.

pub mod answer;
pub mod eval;
pub mod evidence;
pub mod fusion;
pub mod rerank;
pub mod retrieve;

use uuid::Uuid;

/// A regulation chunk returned by retrieval.
#[derive(Clone, Debug)]
pub struct Hit {
    pub chunk_id: Uuid,
    pub regulation_id: Uuid,
    pub regulation: String,
    pub number: Option<String>,
    pub year: Option<i16>,
    pub status: String,
    /// Heading path of the chunk, e.g. `Pasal 10`
    pub heading: Option<String>,
    pub content: String,
    /// Fused reciprocal-rank score; higher is better
    pub score: f64,
}

impl Hit {
    /// Short citation such as `PP No 37 2009, Pasal 10`.
    pub fn citation(&self) -> String {
        match self.heading.as_deref().map(str::trim).filter(|h| !h.is_empty() && *h != "-") {
            Some(h) => format!("{}, {h}", self.regulation),
            None => self.regulation.clone(),
        }
    }

    /// The chunk text without the leading heading line that ingestion prepends.
    pub fn body(&self) -> &str {
        self.content.split_once("\n\n").map_or(self.content.as_str(), |(_, rest)| rest).trim()
    }
}
