//! Chatbot for a student's own data, open to every role the permission `ai.assistant.ask` is granted to.
//!
//! The model never chooses what to read. The server finds the student ([`resolve_student`]), asks
//! [`student_scope`] whether the caller may see them, loads fixed sections with [`student_data`] and only then lets
//! the local model word an answer. Every attempt, allowed or refused, leaves a row in `ai.assistant_audits`.

use std::convert::Infallible;
use std::time::Instant;

use chrono::Utc;
use salvo::prelude::*;
use salvo::sse;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, Set,
};
use serde_json::json;
use tokio::sync::mpsc;
use tokio_stream::StreamExt;
use tokio_stream::wrappers::UnboundedReceiverStream;
use uuid::Uuid;

use super::rag::{Event, insert_message};
use crate::dtos::ai::assistant::AssistantAskRequest;
use crate::middleware::auth::auth_user_id;
use crate::models::academic::student::master::students;
use crate::models::ai::conversation;
use crate::models::auth::role;
use crate::services::ai::generation::{GenParams, LlmKind, LlmService};
use crate::services::ai::student_assistant::{self, Intent, Limits, Viewpoint};
use crate::services::ai::student_audit;
use crate::services::ai::student_data::{self, StudentData};
use crate::services::ai::student_scope::{self, Actor, DataScope};
use crate::services::compliance::rag::Hit;
use crate::services::compliance::rag::retrieve::{self as search, Options};

const MAX_QUESTION_CHARS: usize = 1000;
/// Regulation chunks added when the question is about rules
const REGULATION_SOURCES: usize = 2;
/// Stored in place of an answer that restates personal data, so history never holds that data
const SENSITIVE_PLACEHOLDER: &str = "[Jawaban memuat data pribadi dan tidak disimpan di riwayat]";

fn internal(e: impl std::fmt::Display) -> StatusError {
    StatusError::internal_server_error().brief(e.to_string())
}

/// Who asked, for the audit row
struct Who {
    user_id: Option<Uuid>,
    role: role::Model,
}

/// Records an attempt. A refusal that cannot be recorded is only logged; an allowed one is not served without its row
async fn audit(
    db: &DatabaseConnection,
    who: &Who,
    student_id: Option<Uuid>,
    conversation_id: Option<Uuid>,
    outcome: &str,
    categories: &[&str],
    withheld: &[&str],
) -> Result<(), sea_orm::DbErr> {
    student_audit::record(
        db,
        &student_audit::Entry {
            user_id: who.user_id,
            role_id: who.role.id,
            position_type_id: who.role.position_type_id,
            student_id,
            conversation_id,
            outcome,
            categories,
            withheld,
        },
    )
    .await
}

async fn audit_denied(db: &DatabaseConnection, who: &Who, student_id: Option<Uuid>) {
    if let Err(e) = audit(db, who, student_id, None, "denied", &[], &[]).await {
        tracing::warn!("Could not record a refused assistant request: {e}");
    }
}

/// What a caller is told when no student they may see matches: unknown and not-allowed look the same, so the
/// chatbot cannot be used to find out whether a student number or name exists
const NOT_FOUND: &str = "No student you may see matches. Give the student's number (NIM) or full name";

/// The one student the question is about and what may be read of them. A student is always themselves and the text
/// is not read for a number. For anyone else every candidate is checked, and only the ones the caller may see count:
/// two visible matches are listed for the caller to choose from, an invisible one is never mentioned.
async fn resolve_student(
    db: &DatabaseConnection,
    who: &Who,
    actor: &Actor,
    question: &str,
    carried_over: Option<Uuid>,
) -> Result<(Uuid, DataScope), StatusError> {
    if matches!(actor, Actor::Student(_)) {
        return student_scope::authorize_student(db, &who.role, None).await;
    }
    let found = student_scope::candidates(db, question, carried_over).await?;
    let mut visible: Vec<(Uuid, DataScope)> = Vec::new();
    for id in &found {
        match student_scope::authorize_student(db, &who.role, Some(*id)).await {
            Ok(allowed) => visible.push(allowed),
            Err(e) if e.code == StatusCode::FORBIDDEN => {}
            Err(e) => return Err(e),
        }
    }
    match visible.len() {
        0 => {
            if !found.is_empty() {
                audit_denied(db, who, found.first().copied()).await;
            }
            Err(StatusError::bad_request().brief(NOT_FOUND))
        }
        1 => Ok(visible.remove(0)),
        _ => {
            let ids: Vec<Uuid> = visible.iter().map(|(id, _)| *id).collect();
            let rows = students::Entity::find().filter(students::Column::Id.is_in(ids)).all(db).await.map_err(internal)?;
            let list: Vec<String> = rows.iter().map(|s| format!("{} ({})", s.code, s.name)).collect();
            Err(StatusError::bad_request().brief(format!("More than one student matches; give the student number (NIM): {}", list.join(", "))))
        }
    }
}

/// Regulation chunks for a question about rules; without them the answer simply rests on the student's data
async fn regulation_sources(db: &DatabaseConnection, question: &str) -> Vec<Hit> {
    let options = Options { top_k: REGULATION_SOURCES, ..Options::default() };
    search::search(db, question, options).await.unwrap_or_else(|e| {
        tracing::warn!("Could not search regulations for the assistant: {e:#}");
        Vec::new()
    })
}

/// Builds the prompt and shrinks the student's record, then the regulations, until it fits the model's token budget.
/// It loads the model's tokenizer, so it is blocking.
fn fit_prompt(kind: LlmKind, viewpoint: Viewpoint, question: &str, data: &StudentData, mut regulations: Vec<Hit>) -> anyhow::Result<String> {
    let llm = LlmService::global(kind)?;
    let budget = kind.max_prompt_tokens();
    let mut limits = Limits::START;
    loop {
        let context = student_assistant::render_context(data, limits);
        let prompt = student_assistant::build_prompt(kind, viewpoint, question, &context, &regulations);
        if llm.count_tokens(&prompt)? <= budget {
            return Ok(prompt);
        }
        match limits.shrink() {
            Some(smaller) => limits = smaller,
            None if !regulations.is_empty() => {
                regulations.pop();
                limits = Limits::START;
            }
            // Nothing left to drop: the model gets what it can take rather than nothing
            None => return Ok(prompt),
        }
    }
}

fn categories_read(data: &StudentData) -> Vec<&'static str> {
    [
        (data.profile.is_some(), "profile"),
        (data.academic.is_some(), "academic"),
        (data.finance.is_some(), "finance"),
        (data.sensitive.is_some(), "sensitive"),
    ]
    .into_iter()
    .filter_map(|(read, name)| read.then_some(name))
    .collect()
}

/// Creates the conversation when needed and stores the question
async fn start_conversation(
    db: &DatabaseConnection,
    question: &str,
    kind: LlmKind,
    params: &GenParams,
    user_id: Option<Uuid>,
    conversation_id: Option<Uuid>,
) -> anyhow::Result<Uuid> {
    let now = Utc::now().naive_utc();
    let conversation_id = match conversation_id {
        Some(id) => {
            let owned = conversation::Entity::find_by_id(id)
                .filter(conversation::Column::DeletedAt.is_null())
                .filter(conversation::Column::UserId.eq(user_id))
                .one(db)
                .await?;
            anyhow::ensure!(owned.is_some(), "Conversation not found");
            conversation::ActiveModel { id: Set(id), updated_at: Set(now), updated_by: Set(user_id), ..Default::default() }
                .update(db)
                .await?;
            id
        }
        None => {
            let id = Uuid::now_v7();
            conversation::ActiveModel {
                id: Set(id),
                title: Set(Some(question.chars().take(80).collect())),
                user_id: Set(user_id),
                max_new_tokens: Set(Some(params.max_new_tokens as i32)),
                model: Set(Some(kind.id().to_owned())),
                temperature: Set(Some(params.temperature)),
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
    insert_message(db, conversation_id, "user", question, None, user_id).await?;
    Ok(conversation_id)
}

/// Answers a question about a student's data, streaming server-sent events: `student` (who the answer is about),
/// `token` (text pieces), `done` (answer and timings) or `error`.
#[endpoint(tags("AI - Assistant"), status_codes(200, 400, 403, 500))]
pub async fn ask(req: &mut Request, depot: &mut Depot, res: &mut Response) -> Result<(), StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?
        .clone();
    if !crate::controllers::preference::application::is_llm_enabled(&db).await {
        return Err(StatusError::forbidden().brief("The chatbot is disabled in the application preferences"));
    }
    crate::controllers::preference::application::apply_backend_preference(&db).await;

    let role = depot
        .get::<role::Model>("active_role")
        .map_err(|_| StatusError::forbidden().brief("Select an active role first"))?
        .clone();
    let who = Who { user_id: auth_user_id(depot), role };

    let payload: AssistantAskRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid request: {e}")))?;
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
    if !kind.model_path().is_file() || !kind.tokenizer_path().is_file() {
        return Err(StatusError::bad_request().brief("The language model files are missing on the server"));
    }
    let params = GenParams {
        temperature: payload.temperature.unwrap_or(0.0).clamp(0.0, 1.0),
        max_new_tokens: payload.max_new_tokens.unwrap_or(GenParams::default().max_new_tokens).clamp(16, 1024),
        ..GenParams::default()
    };

    // 1. Who is the question about, and may the caller see them? Refusals and unknown students look the same.
    let actor = student_scope::actor_of(&db, &who.role).await.inspect_err(|_| {
        tracing::info!("Assistant refused a role that is not linked to a person");
    })?;
    let (student_id, scope): (Uuid, DataScope) = match resolve_student(&db, &who, &actor, &question, payload.student_id).await {
        Ok(found) => found,
        Err(e) => {
            if e.code == StatusCode::FORBIDDEN {
                audit_denied(&db, &who, None).await;
            }
            return Err(e);
        }
    };

    // 2. What is asked, and what of it is allowed. Sections named by the client replace the keyword guess.
    let Intent { wanted: guessed_wanted, semester, regulation, guessed } = student_assistant::classify(&question);
    let (wanted, guessed) = match payload.sections.as_deref().filter(|s| !s.is_empty()) {
        Some(names) => {
            let wanted = student_assistant::parse_sections(names)
                .ok_or_else(|| StatusError::bad_request().brief("sections may only be profile, academic, finance and sensitive"))?;
            (wanted, false)
        }
        None => (guessed_wanted, guessed),
    };
    let data = student_data::load(&db, student_id, &scope, wanted, semester.as_deref()).await?;
    let regulations = if regulation { regulation_sources(&db, &question).await } else { Vec::new() };

    // 3. Store the exchange and its audit row before anything is sent
    let conversation_id = start_conversation(&db, &question, kind, &params, who.user_id, payload.conversation_id)
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("{e:#}")))?;
    let read = categories_read(&data);
    audit(&db, &who, Some(student_id), Some(conversation_id), "allowed", &read, &data.withheld)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(format!("Could not record the request: {e}")))?;

    let student_event = json!({
        "conversation_id": conversation_id,
        "student_id": student_id,
        "student": data.profile.as_ref().map(|p| json!({ "code": p.code, "name": p.name })),
        "categories": read,
        "withheld": data.withheld,
        // true when no keyword matched and the default sections were taken: the client can offer `sections`
        "guessed": guessed,
    });
    let stores_answer = data.sensitive.is_none();
    let viewpoint = if matches!(actor, Actor::Student(_)) { Viewpoint::Own } else { Viewpoint::Other };
    let user_id = who.user_id;

    let (tx, rx) = mpsc::unbounded_channel::<Event>();
    tokio::spawn(async move {
        match run_ask(kind, viewpoint, params, &question, data, regulations, student_event, tx.clone()).await {
            Ok(answer) => {
                let stored = if stores_answer { answer.trim().to_owned() } else { SENSITIVE_PLACEHOLDER.to_owned() };
                if let Err(e) = insert_message(&db, conversation_id, "assistant", &stored, None, user_id).await {
                    tracing::warn!("Could not store the assistant answer: {e}");
                }
            }
            Err(e) => {
                tracing::warn!("Assistant question failed: {e:#}");
                let _ = tx.send(Event("error", json!({ "message": format!("{e:#}") })));
            }
        }
    });

    sse::stream(res, UnboundedReceiverStream::new(rx).map(|event| Ok::<_, Infallible>(event.into_sse())));
    Ok(())
}

/// Builds the prompt, streams the answer and returns its text
async fn run_ask(
    kind: LlmKind,
    viewpoint: Viewpoint,
    params: GenParams,
    question: &str,
    data: StudentData,
    regulations: Vec<Hit>,
    student_event: serde_json::Value,
    tx: mpsc::UnboundedSender<Event>,
) -> anyhow::Result<String> {
    let started = Instant::now();
    let q = question.to_owned();
    let prompt = tokio::task::spawn_blocking(move || fit_prompt(kind, viewpoint, &q, &data, regulations)).await??;
    let _ = tx.send(Event("student", student_event));

    let stream_tx = tx.clone();
    let stats = tokio::task::spawn_blocking(move || {
        LlmService::global(kind)?.generate(&prompt, &params, |piece| {
            stream_tx.send(Event("token", json!({ "text": piece }))).is_ok()
        })
    })
    .await??;

    let _ = tx.send(Event(
        "done",
        json!({
            "answer": stats.text.trim(),
            "prompt_tokens": stats.prompt_tokens,
            "new_tokens": stats.new_tokens,
            "total_ms": started.elapsed().as_millis(),
            "finish_reason": stats.finish_reason,
            "model": kind.label(),
            "model_id": kind.id(),
        }),
    ));
    Ok(stats.text)
}
