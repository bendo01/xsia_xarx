//! Hybrid retrieval over regulation chunks.
//!
//! Dense: cosine distance on `ai.chunks.embedding` (same MiniLM model as ingestion).
//! Lexical: Postgres full-text search with the `simple` config (no built-in Indonesian stemmer),
//! matching any query term and ranked by `ts_rank_cd`. The two rankings are merged with RRF.
//!
//! Chunks that carry no text beyond their heading (about 10% after docling) are never returned,
//! and so are chunks of removed regulations. Revoked regulations are excluded unless asked for.

use std::collections::HashSet;

use anyhow::{Context, Result};
use sea_orm::{DatabaseConnection, FromQueryResult, Statement};
use uuid::Uuid;

use super::Hit;
use super::fusion::{query_terms, rrf};
use crate::services::ai::EmbeddingService;

/// Constant of Reciprocal Rank Fusion
const RRF_K: f64 = 60.0;

/// Candidates fetched from each retriever before fusion
const CANDIDATES: i64 = 30;

/// A chunk needs at least this many characters after its heading line to be searchable
const MIN_BODY_CHARS: i32 = 30;

#[derive(Clone, Copy, Debug)]
pub struct Options {
    /// Number of fused hits to return
    pub top_k: usize,
    /// Also search regulations whose status is not `active`
    pub include_revoked: bool,
    /// Rerank the fused candidates (see [`super::rerank`]); off gives plain RRF order
    pub rerank: bool,
}

impl Default for Options {
    fn default() -> Self {
        Self { top_k: 5, include_revoked: false, rerank: true }
    }
}

#[derive(FromQueryResult)]
struct Row {
    chunk_id: Uuid,
    regulation_id: Uuid,
    regulation: String,
    number: Option<String>,
    year: Option<i16>,
    status: String,
    heading: Option<String>,
    content: String,
}

impl Row {
    fn into_hit(self) -> Hit {
        Hit {
            chunk_id: self.chunk_id,
            regulation_id: self.regulation_id,
            regulation: self.regulation,
            number: self.number,
            year: self.year,
            status: self.status,
            heading: self.heading,
            content: self.content,
            score: 0.0,
        }
    }
}

const SELECT: &str = "SELECT c.id AS chunk_id, d.id AS regulation_id, d.title AS regulation, d.number, d.year, d.status, \
     c.title_hierarchy AS heading, c.content \
     FROM ai.chunks c JOIN compliance.regulation_documents d ON d.id = c.chunkable_id";

/// Shared filter: `$1` = include revoked, `$2` = minimum body length.
const FILTER: &str = "c.chunkable_type = 'Regulation' AND c.deleted_at IS NULL AND d.deleted_at IS NULL \
     AND ($1 OR d.status = 'active') \
     AND length(regexp_replace(c.content, '^.*?\\n\\n', '')) >= $2";

async fn embed_query(query: &str) -> Result<String> {
    let text = query.to_owned();
    let vector = tokio::task::spawn_blocking(move || -> Result<Vec<f32>> {
        let mut v = EmbeddingService::global()?.embed(&[text])?;
        v.pop().context("embedder returned no vector")
    })
    .await??;
    let parts: Vec<String> = vector.iter().map(f32::to_string).collect();
    Ok(format!("[{}]", parts.join(",")))
}

async fn dense(db: &DatabaseConnection, query: &str, opts: Options) -> Result<Vec<Hit>> {
    let vector = embed_query(query).await?;
    let sql = format!("{SELECT} WHERE {FILTER} AND c.embedding IS NOT NULL ORDER BY c.embedding <=> $3::vector LIMIT {CANDIDATES}");
    let rows = Row::find_by_statement(Statement::from_sql_and_values(
        db.get_database_backend(),
        sql,
        [opts.include_revoked.into(), MIN_BODY_CHARS.into(), vector.into()],
    ))
    .all(db)
    .await?;
    Ok(rows.into_iter().map(Row::into_hit).collect())
}

async fn lexical(db: &DatabaseConnection, query: &str, opts: Options) -> Result<Vec<Hit>> {
    let terms = query_terms(query);
    if terms.is_empty() {
        return Ok(Vec::new());
    }
    // terms are alphanumeric only, so joining them cannot inject tsquery syntax
    let tsquery = terms.join(" | ");
    let doc = "to_tsvector('simple', c.content || ' ' || coalesce(c.title_hierarchy, ''))";
    let sql = format!(
        "{SELECT} WHERE {FILTER} AND {doc} @@ to_tsquery('simple', $3) \
         ORDER BY ts_rank_cd({doc}, to_tsquery('simple', $3)) DESC LIMIT {CANDIDATES}"
    );
    let rows = Row::find_by_statement(Statement::from_sql_and_values(
        db.get_database_backend(),
        sql,
        [opts.include_revoked.into(), MIN_BODY_CHARS.into(), tsquery.into()],
    ))
    .all(db)
    .await?;
    Ok(rows.into_iter().map(Row::into_hit).collect())
}

/// Hybrid search: dense + lexical candidates fused with RRF, duplicate chunks removed, then reranked.
pub async fn search(db: &DatabaseConnection, query: &str, opts: Options) -> Result<Vec<Hit>> {
    let pool = if opts.rerank { opts.top_k.max(RERANK_POOL) } else { opts.top_k };
    let fused = fuse(db, query, opts, pool).await?;
    let mut hits = if opts.rerank { super::rerank::rerank(query, fused) } else { fused };
    hits.truncate(opts.top_k);
    Ok(hits)
}

/// Candidates reranked per query
const RERANK_POOL: usize = 20;

async fn fuse(db: &DatabaseConnection, query: &str, opts: Options, limit: usize) -> Result<Vec<Hit>> {
    let (dense_hits, lexical_hits) = (dense(db, query, opts).await?, lexical(db, query, opts).await?);

    let mut by_id = std::collections::HashMap::new();
    let lists: Vec<Vec<Uuid>> = [dense_hits, lexical_hits]
        .into_iter()
        .map(|hits| {
            hits.into_iter()
                .map(|h| {
                    let id = h.chunk_id;
                    by_id.entry(id).or_insert(h);
                    id
                })
                .collect()
        })
        .collect();

    // the same text can sit in two chunks of one regulation (docling repeats); keep the best-ranked
    let mut seen: HashSet<(Uuid, String)> = HashSet::new();
    let mut out = Vec::new();
    for (id, score) in rrf(&lists, RRF_K) {
        let mut hit = by_id.remove(&id).expect("every fused id came from a list");
        if !seen.insert((hit.regulation_id, hit.content.trim().to_owned())) {
            continue;
        }
        hit.score = score;
        out.push(hit);
        if out.len() == limit {
            break;
        }
    }
    Ok(out)
}
