//! Persists detections into `compliance.anomaly_events` (the "Daftar Anomali"), one experiment run per save.

use std::collections::HashMap;

use anyhow::Result;
use chrono::Utc;
use pgvector::Vector as PgVector;
use sea_orm::sea_query::Expr;
use sea_orm::{ActiveValue::Set, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, TransactionTrait};
use serde_json::{Value, json};
use uuid::Uuid;

use super::{Detection, EnsembleConfig};
use crate::models::ai::chunk;
use crate::models::compliance::{anomaly_event, experiment_run};
use crate::services::ai::EmbeddingService;
use crate::services::ai::embedding::EMBEDDING_MODEL;
use crate::services::compliance::rag::evidence;
use crate::services::compliance::rag::retrieve::ANOMALY_TYPE;

/// Rows per INSERT; keeps each statement well below PostgreSQL's bind-parameter limit
const INSERT_CHUNK: usize = 1000;

/// Texts embedded per model call
const EMBED_BATCH: usize = 32;

fn entity_label(entity_type: &str) -> &str {
    match entity_type {
        "lecturer" => "dosen",
        "student" => "mahasiswa",
        "class" => "kelas kuliah",
        other => other,
    }
}

/// What a detection says, in Indonesian, for the chatbot: a title line and a body of the facts.
/// The id of the entity is included so an answer can name it.
pub fn describe(d: &Detection) -> (String, String) {
    let what = match d.rule_code {
        Some("LECTURER_SKS_MAX") => "beban mengajar dosen melebihi batas SKS per semester",
        Some("CLASS_CAPACITY_MAX") => "jumlah mahasiswa kelas melebihi daya tampung",
        Some("STUDENT_STUDY_PERIOD_MAX") => "masa studi mahasiswa melebihi batas maksimum",
        Some(_) => "pelanggaran aturan",
        None => "nilai tidak wajar dibanding data semester yang sama (Isolation Forest, LOF, autoencoder)",
    };
    let title = format!("Anomali {}: {what}", entity_label(d.entity_type));
    let mut body = format!(
        "{} dengan id {} ditandai oleh {} ({}). Tingkat: {}, skor: {:.2}.",
        entity_label(d.entity_type),
        d.entity_id,
        d.detector,
        d.rule_code.unwrap_or("deteksi statistik"),
        d.severity.as_str(),
        d.score
    );
    if let Value::Object(map) = &d.evidence {
        let facts: Vec<String> = map
            .iter()
            .map(|(k, v)| match v {
                Value::Number(n) => format!("{k}: {}", n.as_f64().map_or_else(|| n.to_string(), |f| format!("{}", (f * 100.0).round() / 100.0))),
                Value::String(t) => format!("{k}: {t}"),
                other => format!("{k}: {other}"),
            })
            .collect();
        if !facts.is_empty() {
            body.push_str(&format!(" Data: {}.", facts.join(", ")));
        }
    }
    (title, body)
}

/// Replaces the indexed anomalies in `ai.chunks` with `events` (id, detection), embedding each one.
async fn index(db: &DatabaseConnection, run_id: Uuid, events: &[(Uuid, &Detection)]) -> Result<()> {
    let texts: Vec<String> = events
        .iter()
        .map(|(_, d)| {
            let (title, body) = describe(d);
            format!("{title}\n\n{body}")
        })
        .collect();
    let inputs = texts.clone();
    let vectors = tokio::task::spawn_blocking(move || -> Result<Vec<Vec<f32>>> {
        let embedder = EmbeddingService::global()?;
        let mut out = Vec::with_capacity(inputs.len());
        for batch in inputs.chunks(EMBED_BATCH) {
            out.extend(embedder.embed_passages(batch)?);
        }
        Ok(out)
    })
    .await??;

    let now = Utc::now().naive_utc();
    let txn = db.begin().await?;
    // Only the latest run is searchable
    chunk::Entity::update_many()
        .col_expr(chunk::Column::DeletedAt, Expr::value(now))
        .filter(chunk::Column::ChunkableType.eq(ANOMALY_TYPE))
        .filter(chunk::Column::DeletedAt.is_null())
        .exec(&txn)
        .await?;
    for batch in events.iter().zip(texts).zip(vectors).collect::<Vec<_>>().chunks(INSERT_CHUNK) {
        let rows = batch.iter().map(|(((id, d), content), vector)| chunk::ActiveModel {
            id: Set(Uuid::now_v7()),
            chunkable_type: Set(Some(ANOMALY_TYPE.to_owned())),
            chunkable_id: Set(*id),
            content: Set(content.clone()),
            heading_context: Set(None),
            title_hierarchy: Set(Some(d.rule_code.unwrap_or(d.detector).to_owned())),
            markdown_content: Set(None),
            metadata: Set(Some(json!({ "source": "anomaly", "run_id": run_id, "embedding_model": EMBEDDING_MODEL }))),
            embedding: Set(Some(PgVector::from(vector.clone()))),
            created_at: Set(now),
            updated_at: Set(now),
            deleted_at: Set(None),
            sync_at: Set(None),
            created_by: Set(None),
            updated_by: Set(None),
        });
        chunk::Entity::insert_many(rows).exec(&txn).await?;
    }
    txn.commit().await?;
    Ok(())
}

/// Writes `detections` as `anomaly_events` rows linked to a new `experiment_runs` row (kind `anomaly`).
/// Rule detections also get the id of the best-matching regulation chunk, when one is found.
/// With `embed`, the anomalies are also indexed in `ai.chunks` (replacing the previous run's) so the chatbot
/// can retrieve them. Returns the run id and the number of rows saved.
pub async fn save(db: &DatabaseConnection, detections: &[Detection], cfg: &EnsembleConfig, top_fraction: f64, seed: u64, embed: bool) -> Result<(Uuid, usize)> {
    let started = Utc::now().naive_utc();

    // One regulation lookup per rule code, not per detection
    let mut chunk_by_rule: HashMap<&'static str, Option<Uuid>> = HashMap::new();
    for d in detections {
        if let Some(code) = d.rule_code {
            if !chunk_by_rule.contains_key(code) {
                let chunk = evidence::regulation_for(db, d, 1).await?.first().map(|h| h.chunk_id);
                chunk_by_rule.insert(code, chunk);
            }
        }
    }

    let run_id = Uuid::now_v7();
    let txn = db.begin().await?;
    experiment_run::Entity::insert(experiment_run::ActiveModel {
        id: Set(run_id),
        name: Set(format!("anomaly {}", started.format("%Y-%m-%d %H:%M"))),
        kind: Set("anomaly".to_owned()),
        model_version: Set(Some("rules + iforest + lof + autoencoder (soft vote)".to_owned())),
        seed: Set(Some(i64::try_from(seed).unwrap_or(0))),
        config: Set(json!({ "weights": cfg.weights, "epochs": cfg.epochs, "max_train_rows": cfg.max_train_rows, "top_fraction": top_fraction })),
        started_at: Set(Some(started)),
        finished_at: Set(Some(Utc::now().naive_utc())),
        status: Set("done".to_owned()),
        created_at: Set(Some(started)),
        updated_at: Set(Some(started)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    })
    .exec(&txn)
    .await?;

    let ids: Vec<Uuid> = detections.iter().map(|_| Uuid::now_v7()).collect();
    for (batch, batch_ids) in detections.chunks(INSERT_CHUNK).zip(ids.chunks(INSERT_CHUNK)) {
        let rows = batch.iter().zip(batch_ids).map(|(d, id)| anomaly_event::ActiveModel {
            id: Set(*id),
            entity_type: Set(d.entity_type.to_owned()),
            entity_id: Set(d.entity_id),
            detector: Set(d.detector.to_owned()),
            rule_code: Set(d.rule_code.map(str::to_owned)),
            score: Set(d.score),
            severity: Set(d.severity.as_str().to_owned()),
            evidence: Set(Some(d.evidence.clone())),
            regulation_chunk_id: Set(d.rule_code.and_then(|c| chunk_by_rule.get(c).copied().flatten())),
            run_id: Set(Some(run_id)),
            created_at: Set(Some(started)),
            updated_at: Set(Some(started)),
            deleted_at: Set(None),
            sync_at: Set(None),
            created_by: Set(None),
            updated_by: Set(None),
        });
        anomaly_event::Entity::insert_many(rows).exec(&txn).await?;
    }
    txn.commit().await?;
    if embed {
        let events: Vec<(Uuid, &Detection)> = ids.iter().copied().zip(detections).collect();
        index(db, run_id, &events).await?;
    }
    Ok((run_id, detections.len()))
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::services::compliance::anomaly::Severity;

    #[test]
    fn describes_a_rule_detection_with_its_facts() {
        let d = Detection {
            entity_type: "lecturer",
            entity_id: Uuid::nil(),
            detector: "rule",
            rule_code: Some("LECTURER_SKS_MAX"),
            score: 0.75,
            severity: Severity::Medium,
            evidence: json!({ "semester": "20241", "credits": 20.0 }),
        };
        let (title, body) = describe(&d);
        assert!(title.starts_with("Anomali dosen"));
        assert!(body.contains("LECTURER_SKS_MAX") && body.contains("credits: 20") && body.contains("semester: 20241"));
    }
}
