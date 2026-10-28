use std::convert::Infallible;
use std::time::Instant;

use chrono::Utc;
use salvo::prelude::*;
use salvo::sse::{self, SseEvent};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    QueryTrait, Set,
};
use serde_json::json;
use tokio::sync::mpsc;
use tokio_stream::StreamExt;
use tokio_stream::wrappers::UnboundedReceiverStream;
use uuid::Uuid;

use crate::controllers::ai::require_administrator;
use crate::dtos::ai::rag::{AskRequest, FeedbackRequest, HitResponse, LlmModelStatus, RagStatusResponse, RetrieveResponse};
use crate::middleware::auth::auth_user_id;
use crate::models::ai::{chunk, conversation, message};
use crate::models::compliance::regulation_document;
use crate::models::document::transaction::archives;
use crate::services::ai::generation::{self, GenParams, LlmKind, LlmService};
use crate::services::ai::EmbeddingService;
use crate::services::compliance::rag::answer::{DEFAULT_BODY_CHARS, build_prompt};
use crate::services::compliance::rag::retrieve::{self as search, Options};

const DEFAULT_TOP_K: usize = 3;
const MAX_QUESTION_CHARS: usize = 1000;

/// Validated settings shared by the retrieval and answer endpoints
struct Settings {
    question: String,
    kind: LlmKind,
    retrieval: Options,
    params: GenParams,
}

fn settings(payload: &AskRequest) -> Result<Settings, StatusError> {
    let question = payload.question.trim().to_owned();
    if question.chars().count() < 3 {
        return Err(StatusError::bad_request().brief("The question must have at least 3 characters"));
    }
    if question.chars().count() > MAX_QUESTION_CHARS {
        return Err(StatusError::bad_request().brief(format!("The question may have at most {MAX_QUESTION_CHARS} characters")));
    }
    let kind = match payload.model.as_deref().filter(|m| !m.trim().is_empty()) {
        None => LlmKind::default(),
        Some(id) => LlmKind::parse(id).ok_or_else(|| StatusError::bad_request().brief("Unknown language model"))?,
    };
    let defaults = GenParams::default();
    Ok(Settings {
        question,
        kind,
        retrieval: Options {
            top_k: payload.top_k.unwrap_or(DEFAULT_TOP_K).clamp(1, 10),
            include_revoked: payload.include_revoked.unwrap_or(false),
            rerank: payload.rerank.unwrap_or(true),
        },
        params: GenParams {
            temperature: payload.temperature.unwrap_or(defaults.temperature).clamp(0.0, 1.0),
            max_new_tokens: payload.max_new_tokens.unwrap_or(defaults.max_new_tokens).clamp(16, 1024),
            ..defaults
        },
    })
}

/// What the tester needs to work: model files, whether the model is in memory and how many chunks are searchable.
#[endpoint(tags("AI - RAG"), status_codes(200, 403, 500))]
pub async fn status(depot: &mut Depot) -> Result<Json<RagStatusResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let live_chunks = |chunkable_type: &str, owners: sea_orm::sea_query::SelectStatement| {
        chunk::Entity::find()
            .filter(chunk::Column::ChunkableType.eq(chunkable_type))
            .filter(chunk::Column::DeletedAt.is_null())
            .filter(chunk::Column::ChunkableId.in_subquery(owners))
            .count(db)
    };
    let regulations = |in_force: bool| {
        let owners = regulation_document::Entity::find()
            .select_only()
            .column(regulation_document::Column::Id)
            .filter(regulation_document::Column::DeletedAt.is_null())
            .filter(if in_force {
                regulation_document::Column::Status.eq("active")
            } else {
                regulation_document::Column::Status.ne("active")
            })
            .into_query();
        live_chunks("Regulation", owners)
    };
    let archive_owners = archives::Entity::find()
        .select_only()
        .column(archives::Column::Id)
        .filter(archives::Column::DeletedAt.is_null())
        .into_query();
    let (active, revoked, from_archives) =
        tokio::try_join!(regulations(true), regulations(false), live_chunks(archives::CHUNKABLE_TYPE, archive_owners))
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    // archive chunks have no regulation status: they are always in force
    let (active_chunks, revoked_chunks) = (active + from_archives, revoked);

    let models: Vec<LlmModelStatus> = LlmKind::ALL
        .into_iter()
        .map(|kind| {
            let path = kind.model_path();
            LlmModelStatus {
                id: kind.id().to_owned(),
                label: kind.label().to_owned(),
                model_present: path.is_file(),
                model_size: std::fs::metadata(&path).ok().map(|m| m.len()),
                tokenizer_present: kind.tokenizer_path().is_file(),
                loaded: generation::is_loaded(kind),
            }
        })
        .collect();
    let default = &models[0];
    Ok(Json(RagStatusResponse {
        llm_model: default.label.clone(),
        llm_model_present: default.model_present,
        llm_model_size: default.model_size,
        tokenizer_present: default.tokenizer_present,
        fast_prompt: std::env::var("CANDLE_DEQUANTIZE_ALL").is_ok_and(|v| v == "1" || v.eq_ignore_ascii_case("true")),
        llm_loaded: default.loaded,
        embedder_present: EmbeddingService::model_dir().join("model.safetensors").exists(),
        models,
        active_chunks: i64::try_from(active_chunks).unwrap_or(i64::MAX),
        revoked_chunks: i64::try_from(revoked_chunks).unwrap_or(i64::MAX),
    }))
}

/// Retrieval only: the chunks the chatbot would be given for a question, without running the language model.
#[endpoint(tags("AI - RAG"), status_codes(200, 400, 403, 500))]
pub async fn retrieve(req: &mut Request, depot: &mut Depot) -> Result<Json<RetrieveResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let payload: AskRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid request: {e}")))?;
    let s = settings(&payload)?;

    let started = Instant::now();
    let hits = search::search(db, &s.question, s.retrieval)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(format!("{e:#}")))?;
    let retrieval_ms = started.elapsed().as_millis();

    // stored as a `retrieval` message (no answer, only the chunks) so the history can show the lookup again
    let user_id = auth_user_id(depot);
    let chunk_ids: Vec<Uuid> = hits.iter().map(|h| h.chunk_id).collect();
    let conversation_id = match start_exchange(db, &s, user_id, payload.conversation_id).await {
        Ok(id) => match insert_message(db, id, "retrieval", "", Some(&chunk_ids), user_id).await {
            Ok(_) => Some(id),
            Err(e) => {
                tracing::warn!("Could not store the retrieval result: {e}");
                Some(id)
            }
        },
        Err(e) => {
            tracing::warn!("Could not store the retrieval question: {e}");
            None
        }
    };
    Ok(Json(RetrieveResponse {
        hits: hits.iter().map(HitResponse::from).collect(),
        retrieval_ms,
        conversation_id,
    }))
}

/// One server-sent event: a name and a JSON payload
struct Event(&'static str, serde_json::Value);

impl Event {
    fn into_sse(self) -> SseEvent {
        SseEvent::default().name(self.0).text(self.1.to_string())
    }
}

/// Answers a question from the knowledge base, streaming the answer as server-sent events:
/// `sources` (retrieved chunks), `token` (text pieces), `done` (answer and timings) or `error`.
/// The exchange is stored as a conversation so the answer can be rated with [`feedback`].
#[endpoint(tags("AI - RAG"), status_codes(200, 400, 403, 500))]
pub async fn ask(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    require_administrator(depot)?;
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?
        .clone();
    let payload: AskRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid request: {e}")))?;
    let s = settings(&payload)?;
    if !s.kind.model_path().is_file() || !s.kind.tokenizer_path().is_file() {
        return Err(StatusError::bad_request().brief("The language model files are missing on the server"));
    }
    let user_id = auth_user_id(depot);
    let conversation_id = payload.conversation_id;

    let (tx, rx) = mpsc::unbounded_channel::<Event>();
    tokio::spawn(async move {
        if let Err(e) = run_ask(&db, s, user_id, conversation_id, &tx).await {
            tracing::warn!("RAG question failed: {e:#}");
            let _ = tx.send(Event("error", json!({ "message": format!("{e:#}") })));
        }
    });

    sse::stream(res, UnboundedReceiverStream::new(rx).map(|event| Ok::<_, Infallible>(event.into_sse())));
    Ok(())
}

async fn run_ask(
    db: &DatabaseConnection,
    s: Settings,
    user_id: Option<Uuid>,
    conversation_id: Option<Uuid>,
    tx: &mpsc::UnboundedSender<Event>,
) -> anyhow::Result<()> {
    let started = Instant::now();
    let hits = search::search(db, &s.question, s.retrieval).await?;
    let retrieval_ms = started.elapsed().as_millis();
    let conversation_id = start_exchange(db, &s, user_id, conversation_id).await?;
    let _ = tx.send(Event(
        "sources",
        json!({
            "conversation_id": conversation_id,
            "retrieval_ms": retrieval_ms,
            "hits": hits.iter().map(HitResponse::from).collect::<Vec<_>>(),
        }),
    ));

    let kind = s.kind;
    let prompt = build_prompt(kind, &s.question, &hits, DEFAULT_BODY_CHARS);
    let stream_tx = tx.clone();
    let params = s.params.clone();
    // Loading the model and generating are CPU bound, so they run off the async threads.
    // A closed connection makes `send` fail, which stops the generation.
    let stats = tokio::task::spawn_blocking(move || {
        LlmService::global(kind)?.generate(&prompt, &params, |piece| {
            stream_tx.send(Event("token", json!({ "text": piece }))).is_ok()
        })
    })
    .await??;

    let chunk_ids: Vec<Uuid> = hits.iter().map(|h| h.chunk_id).collect();
    let message_id = finish_exchange(db, conversation_id, &stats.text, &chunk_ids, user_id).await;
    let tokens_per_second =
        if stats.generation_ms > 0 { stats.new_tokens as f64 * 1000.0 / stats.generation_ms as f64 } else { 0.0 };
    let _ = tx.send(Event(
        "done",
        json!({
            "message_id": message_id,
            "conversation_id": conversation_id,
            "answer": stats.text.trim(),
            "prompt_tokens": stats.prompt_tokens,
            "new_tokens": stats.new_tokens,
            "retrieval_ms": retrieval_ms,
            "prompt_ms": stats.prompt_ms,
            "generation_ms": stats.generation_ms,
            "tokens_per_second": tokens_per_second,
            "finish_reason": stats.finish_reason,
            "model": kind.label(),
            "model_id": kind.id(),
        }),
    ));
    Ok(())
}

/// Creates the conversation when needed and stores the question. The settings of the latest question are
/// kept on the conversation.
async fn start_exchange(
    db: &DatabaseConnection,
    s: &Settings,
    user_id: Option<Uuid>,
    conversation_id: Option<Uuid>,
) -> anyhow::Result<Uuid> {
    let now = Utc::now().naive_utc();
    let max_new_tokens = Set(Some(s.params.max_new_tokens as i32));
    let model = Set(Some(s.kind.id().to_owned()));
    let rerank = Set(Some(s.retrieval.rerank));
    let temperature = Set(Some(s.params.temperature));
    let top_k = Set(Some(s.retrieval.top_k as i32));
    let conversation_id = match conversation_id {
        Some(id) => {
            conversation::ActiveModel {
                id: Set(id),
                max_new_tokens,
                model,
                rerank,
                temperature,
                top_k,
                updated_at: Set(now),
                updated_by: Set(user_id),
                ..Default::default()
            }
            .update(db)
            .await?;
            id
        }
        None => {
            let id = Uuid::now_v7();
            conversation::ActiveModel {
                id: Set(id),
                title: Set(Some(s.question.chars().take(80).collect())),
                user_id: Set(user_id),
                max_new_tokens,
                model,
                rerank,
                temperature,
                top_k,
                created_at: Set(now),
                updated_at: Set(now),
                created_by: Set(user_id),
                updated_by: Set(user_id),
                ..Default::default()
            }
            .insert(db)
            .await?;
            id
        }
    };
    insert_message(db, conversation_id, "user", &s.question, None, user_id).await?;
    Ok(conversation_id)
}

async fn insert_message(
    db: &DatabaseConnection,
    conversation_id: Uuid,
    role: &str,
    content: &str,
    chunk_ids: Option<&[Uuid]>,
    user_id: Option<Uuid>,
) -> Result<Uuid, sea_orm::DbErr> {
    let now = Utc::now().naive_utc();
    let id = Uuid::now_v7();
    message::ActiveModel {
        id: Set(id),
        conversation_id: Set(conversation_id),
        role: Set(role.to_owned()),
        content: Set(content.to_owned()),
        context_reference: Set(chunk_ids.map(|ids| json!(ids))),
        created_at: Set(now),
        updated_at: Set(now),
        created_by: Set(user_id),
        updated_by: Set(user_id),
        ..Default::default()
    }
    .insert(db)
    .await?;
    Ok(id)
}

/// Stores the answer; a failure is logged and only costs the ability to rate it
async fn finish_exchange(
    db: &DatabaseConnection,
    conversation_id: Uuid,
    answer: &str,
    chunk_ids: &[Uuid],
    user_id: Option<Uuid>,
) -> Option<Uuid> {
    match insert_message(db, conversation_id, "assistant", answer.trim(), Some(chunk_ids), user_id).await {
        Ok(id) => Some(id),
        Err(e) => {
            tracing::warn!("Could not store the RAG answer: {e}");
            None
        }
    }
}

/// Rates an answer (1 good, -1 bad, 0 clear) with an optional note.
#[endpoint(tags("AI - RAG"), status_codes(200, 400, 403, 404, 500))]
pub async fn feedback(req: &mut Request, depot: &mut Depot) -> Result<Json<serde_json::Value>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let id = req
        .param::<String>("id")
        .and_then(|s| Uuid::parse_str(&s).ok())
        .ok_or_else(|| StatusError::bad_request().brief("Invalid message id"))?;
    let payload: FeedbackRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid request: {e}")))?;
    if !(-1..=1).contains(&payload.feedback) {
        return Err(StatusError::bad_request().brief("feedback must be -1, 0 or 1"));
    }

    let row = message::Entity::find_by_id(id)
        .filter(message::Column::DeletedAt.is_null())
        .filter(message::Column::Role.eq("assistant"))
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Answer not found"))?;

    let mut active: message::ActiveModel = row.into();
    active.feedback = Set(Some(payload.feedback));
    active.feedback_note = Set(payload.note.map(|n| n.trim().to_owned()).filter(|n| !n.is_empty()));
    active.updated_at = Set(Utc::now().naive_utc());
    active.updated_by = Set(auth_user_id(depot));
    active.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    Ok(Json(json!({ "message": "Feedback saved" })))
}

/// Conversations listed in the history panel
const HISTORY_LIMIT: u64 = 50;

/// The signed-in user's conversations, newest first
#[endpoint(tags("AI - RAG"), status_codes(200, 403, 500))]
pub async fn conversations(depot: &mut Depot) -> Result<Json<serde_json::Value>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let mut query = conversation::Entity::find().filter(conversation::Column::DeletedAt.is_null());
    if let Some(user_id) = auth_user_id(depot) {
        query = query.filter(conversation::Column::UserId.eq(user_id));
    }
    let rows = query
        .order_by_desc(conversation::Column::UpdatedAt)
        .limit(HISTORY_LIMIT)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let items: Vec<_> = rows
        .into_iter()
        .map(|c| json!({ "id": c.id, "title": c.title, "updated_at": c.updated_at.and_utc().to_rfc3339() }))
        .collect();
    Ok(Json(json!({ "conversations": items })))
}

/// Finds a conversation the signed-in user may open
async fn own_conversation(
    db: &DatabaseConnection,
    depot: &Depot,
    req: &Request,
) -> Result<conversation::Model, StatusError> {
    let id = req
        .param::<String>("id")
        .and_then(|s| Uuid::parse_str(&s).ok())
        .ok_or_else(|| StatusError::bad_request().brief("Invalid conversation id"))?;
    let row = conversation::Entity::find_by_id(id)
        .filter(conversation::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Conversation not found"))?;
    match (auth_user_id(depot), row.user_id) {
        (Some(me), Some(owner)) if me != owner => Err(StatusError::not_found().brief("Conversation not found")),
        _ => Ok(row),
    }
}

/// A conversation's turns: each question with its answer, the sources it was given and its rating
#[endpoint(tags("AI - RAG"), status_codes(200, 400, 403, 404, 500))]
pub async fn conversation_turns(req: &mut Request, depot: &mut Depot) -> Result<Json<serde_json::Value>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let conv = own_conversation(db, depot, req).await?;
    let messages = message::Entity::find()
        .filter(message::Column::ConversationId.eq(conv.id))
        .filter(message::Column::DeletedAt.is_null())
        .order_by_asc(message::Column::CreatedAt)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let mut turns = Vec::new();
    let mut question: Option<String> = None;
    for m in messages {
        if m.role == "user" {
            // a question whose answer never arrived still shows up
            if let Some(q) = question.replace(m.content) {
                turns.push(json!({ "question": q, "answer": "", "hits": [], "message_id": null, "feedback": 0, "note": "", "retrieval_only": false }));
            }
            continue;
        }
        let ids: Vec<Uuid> = m
            .context_reference
            .as_ref()
            .and_then(|v| serde_json::from_value(v.clone()).ok())
            .unwrap_or_default();
        let hits = search::hits_by_ids(db, &ids)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        turns.push(json!({
            "question": question.take().unwrap_or_default(),
            "answer": m.content,
            "hits": hits.iter().map(HitResponse::from).collect::<Vec<_>>(),
            "message_id": m.id,
            "feedback": m.feedback.unwrap_or(0),
            "note": m.feedback_note.unwrap_or_default(),
            "retrieval_only": m.role == "retrieval",
        }));
    }
    if let Some(q) = question {
        turns.push(json!({ "question": q, "answer": "", "hits": [], "message_id": null, "feedback": 0, "note": "", "retrieval_only": false }));
    }
    Ok(Json(json!({ "id": conv.id, "title": conv.title, "turns": turns })))
}

/// Removes a conversation from the history (soft delete; its messages stay in the table)
#[endpoint(tags("AI - RAG"), status_codes(200, 400, 403, 404, 500))]
pub async fn delete_conversation(req: &mut Request, depot: &mut Depot) -> Result<Json<serde_json::Value>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let conv = own_conversation(db, depot, req).await?;
    let now = Utc::now().naive_utc();
    let mut active: conversation::ActiveModel = conv.into();
    active.deleted_at = Set(Some(now));
    active.updated_at = Set(now);
    active.updated_by = Set(auth_user_id(depot));
    active.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    Ok(Json(json!({ "message": "Conversation deleted" })))
}
