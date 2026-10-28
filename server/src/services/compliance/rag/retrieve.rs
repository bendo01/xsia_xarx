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
use super::fusion::{Reference, extract_reference, query_terms, rrf};
use crate::models::document::transaction::archives::CHUNKABLE_TYPE as ARCHIVE_TYPE;
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

/// Regulation chunks, plus chunks of knowledge-base archives (which have no regulation row: always in force)
fn select() -> String {
    "SELECT c.id AS chunk_id, c.chunkable_id AS regulation_id, coalesce(d.title, a.name) AS regulation, d.number, d.year, \
     coalesce(d.status, 'active') AS status, c.title_hierarchy AS heading, c.content \
     FROM ai.chunks c \
     LEFT JOIN compliance.regulation_documents d ON c.chunkable_type = 'Regulation' AND d.id = c.chunkable_id \
     LEFT JOIN document_transaction.archives a ON c.chunkable_type = $ARCHIVE AND a.id = c.chunkable_id"
        .replace("$ARCHIVE", &format!("'{ARCHIVE_TYPE}'"))
}

/// Shared filter: `$1` = include revoked, `$2` = minimum body length.
fn filter(scope: Option<&[Uuid]>) -> String {
    let scope = scope.map_or_else(String::new, |ids| {
        let ids: Vec<String> = ids.iter().map(|id| format!("'{id}'")).collect();
        format!(" AND c.chunkable_id IN ({})", ids.join(","))
    });
    format!("{}{scope}", base_filter())
}

fn base_filter() -> String {
    "((c.chunkable_type = 'Regulation' AND d.id IS NOT NULL AND d.deleted_at IS NULL AND ($1 OR d.status = 'active')) \
      OR (c.chunkable_type = $ARCHIVE AND a.id IS NOT NULL AND a.deleted_at IS NULL)) \
     AND c.deleted_at IS NULL \
     AND length(regexp_replace(c.content, '^.*?\\n\\n', '')) >= $2"
        .replace("$ARCHIVE", &format!("'{ARCHIVE_TYPE}'"))
}

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

async fn dense(db: &DatabaseConnection, query: &str, opts: Options, scope: Option<&[Uuid]>) -> Result<Vec<Hit>> {
    let vector = embed_query(query).await?;
    let (select, filter) = (select(), filter(scope));
    let sql = format!("{select} WHERE {filter} AND c.embedding IS NOT NULL ORDER BY c.embedding <=> $3::vector LIMIT {CANDIDATES}");
    let rows = Row::find_by_statement(Statement::from_sql_and_values(
        db.get_database_backend(),
        sql,
        [opts.include_revoked.into(), MIN_BODY_CHARS.into(), vector.into()],
    ))
    .all(db)
    .await?;
    Ok(rows.into_iter().map(Row::into_hit).collect())
}

async fn lexical(db: &DatabaseConnection, query: &str, opts: Options, scope: Option<&[Uuid]>) -> Result<Vec<Hit>> {
    let terms = query_terms(query);
    if terms.is_empty() {
        return Ok(Vec::new());
    }
    // terms are alphanumeric only, so joining them cannot inject tsquery syntax
    let tsquery = terms.join(" | ");
    let doc = "to_tsvector('simple', c.content || ' ' || coalesce(c.title_hierarchy, ''))";
    let (select, filter) = (select(), filter(scope));
    let sql = format!(
        "{select} WHERE {filter} AND {doc} @@ to_tsquery('simple', $3) \
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

/// Archives whose file name carries the cited regulation, e.g. `Tahun_2012_UU_No_12.pdf` for UU 12/2012
async fn referenced_archives(db: &DatabaseConnection, r: &Reference) -> Result<Vec<Uuid>> {
    #[derive(FromQueryResult)]
    struct Id {
        id: Uuid,
    }
    let kind = r.kind.map_or_else(String::new, |k| format!("(^|[^a-z0-9]){}([^a-z0-9]|$)", k.to_lowercase()));
    let rows = Id::find_by_statement(Statement::from_sql_and_values(
        db.get_database_backend(),
        "SELECT id FROM document_transaction.archives WHERE deleted_at IS NULL \
         AND name ~* $1 AND name ~* $2 AND ($3 = '' OR name ~* $3)",
        [
            format!("(^|[^0-9]){}([^0-9]|$)", r.year).into(),
            format!("(^|[^0-9])0*{}([^0-9]|$)", r.number).into(),
            kind.into(),
        ],
    ))
    .all(db)
    .await?;
    Ok(rows.into_iter().map(|r| r.id).collect())
}

/// Hybrid search: dense + lexical candidates fused with RRF, duplicate chunks removed, then reranked.
/// When the question cites a regulation ("undang undang nomor 12 tahun 2012") the citation is taken out of the
/// query, and that regulation is searched again on its own so its chunks compete with the rest.
pub async fn search(db: &DatabaseConnection, query: &str, opts: Options) -> Result<Vec<Hit>> {
    let mut query = query.to_owned();
    let mut scope: Vec<Uuid> = Vec::new();
    if let Some((reference, rest)) = extract_reference(&query)
        && !query_terms(&rest).is_empty()
    {
        scope = referenced_archives(db, &reference).await?;
        if !scope.is_empty() {
            query = rest;
        }
    }
    let pool = if opts.rerank { opts.top_k.max(RERANK_POOL) } else { opts.top_k };
    let fused = fuse(db, &query, opts, pool, &scope).await?;
    let mut hits = if opts.rerank { super::rerank::rerank(&query, fused) } else { fused };
    hits.truncate(opts.top_k);
    Ok(hits)
}

/// Candidates reranked per query
const RERANK_POOL: usize = 20;

async fn fuse(db: &DatabaseConnection, query: &str, opts: Options, limit: usize, scope: &[Uuid]) -> Result<Vec<Hit>> {
    let mut retrieved = vec![dense(db, query, opts, None).await?, lexical(db, query, opts, None).await?];
    if !scope.is_empty() {
        retrieved.push(dense(db, query, opts, Some(scope)).await?);
        retrieved.push(lexical(db, query, opts, Some(scope)).await?);
    }

    let mut by_id = std::collections::HashMap::new();
    let lists: Vec<Vec<Uuid>> = retrieved
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
