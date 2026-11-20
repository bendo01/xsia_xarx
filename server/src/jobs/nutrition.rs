use std::time::Duration;

use pgmq::PGMQueueExt;
use pgmq::errors::PgmqError;
use sea_orm::DatabaseConnection;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::services::ai::generation::LlmKind;
use crate::services::nutrition::calculate::{calculate, mark_failed};

pub const INTAKE_CALCULATION_QUEUE: &str = "intake_calculation";

/// A CPU model can take minutes for one entry; the job stays hidden from other reads this long
const VISIBILITY_TIMEOUT_SECS: i32 = 15 * 60;
const MAX_ATTEMPTS: i32 = 3;

/// A nutritional intake log waiting for its nutrients to be calculated
#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct IntakeCalculationJob {
    pub intake_log_id: Uuid,
}

/// Language model used for the calculation: `INTAKE_LLM` (`qwen` or `gemma`), Qwen by default
fn llm_kind() -> LlmKind {
    std::env::var("INTAKE_LLM").ok().and_then(|id| LlmKind::parse(&id)).unwrap_or_default()
}

pub async fn init_intake_calculation_queue(queue: &PGMQueueExt) -> Result<(), PgmqError> {
    queue.create(INTAKE_CALCULATION_QUEUE).await?;
    Ok(())
}

pub async fn enqueue_intake_calculation(queue: &PGMQueueExt, intake_log_id: Uuid) -> Result<i64, PgmqError> {
    queue.send(INTAKE_CALCULATION_QUEUE, &IntakeCalculationJob { intake_log_id }).await
}

/// Starts the background worker. Entries are calculated one at a time: a model keeps its KV cache between
/// passes, so it generates for one entry at a time.
pub fn start_intake_calculation_worker(queue: PGMQueueExt, db: DatabaseConnection) -> tokio::task::JoinHandle<()> {
    tokio::spawn(async move {
        tracing::info!("PGMQ intake calculation worker loop started on queue '{INTAKE_CALCULATION_QUEUE}'");

        loop {
            let polled = queue
                .read_with_poll::<IntakeCalculationJob>(
                    INTAKE_CALCULATION_QUEUE,
                    VISIBILITY_TIMEOUT_SECS,
                    Some(Duration::from_secs(5)),
                    Some(Duration::from_millis(500)),
                )
                .await;

            match polled {
                Ok(Some(msg)) => {
                    let id = msg.message.intake_log_id;
                    tracing::info!("Calculating intake log {id} (msg_id: {})", msg.msg_id);
                    match calculate(&db, id, llm_kind()).await {
                        Ok(()) => archive(&queue, msg.msg_id).await,
                        Err(e) => {
                            tracing::error!("Intake log {id} failed (attempt {}): {e:#}", msg.read_ct);
                            if msg.read_ct >= MAX_ATTEMPTS {
                                if let Err(db_err) = mark_failed(&db, id, &format!("{e:#}")).await {
                                    tracing::error!("Cannot mark intake log {id} as failed: {db_err}");
                                }
                                archive(&queue, msg.msg_id).await;
                            } else {
                                // Retry soon instead of waiting out the long visibility timeout
                                let _ = queue
                                    .set_vt::<IntakeCalculationJob>(INTAKE_CALCULATION_QUEUE, msg.msg_id, 30i32)
                                    .await;
                            }
                        }
                    }
                }
                Ok(None) => {}
                Err(e) => {
                    tracing::error!("Error reading from PGMQ intake calculation queue: {e}");
                    tokio::time::sleep(Duration::from_secs(2)).await;
                }
            }
        }
    })
}

async fn archive(queue: &PGMQueueExt, msg_id: i64) {
    if let Err(e) = queue.archive(INTAKE_CALCULATION_QUEUE, msg_id).await {
        tracing::error!("Failed to archive intake calculation job {msg_id}: {e}");
    }
}
