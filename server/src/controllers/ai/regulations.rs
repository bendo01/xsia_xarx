use pgmq::PGMQueueExt;
use salvo::prelude::*;
use sea_orm::{
    ColumnTrait, DatabaseBackend, DatabaseConnection, EntityTrait, FromQueryResult, QueryFilter, QueryOrder,
    Statement,
};
use uuid::Uuid;

use crate::dtos::ai::regulations::{
    RebuildRegulationsRequest, RebuildRegulationsResponse, RegulationItemStatus, RegulationSkipped,
    RegulationStatusResponse,
};
use crate::jobs::embedding::embed::pdf_queue_length;
use crate::middleware::auth::auth_user_id;
use crate::middleware::rbac::is_administrator;
use crate::models::auth::role;
use crate::models::compliance::regulation_document;
use crate::services::ai::docling;
use crate::tasks::rag::rag_02_ingest_regulations::{
    REGULATION_CHUNKABLE_TYPE, default_dir, enqueue_directory, list_pdfs,
};

#[derive(FromQueryResult)]
struct ChunkCount {
    chunkable_id: Uuid,
    chunk_count: i64,
}

fn require_administrator(depot: &Depot) -> Result<(), StatusError> {
    if depot.get::<role::Model>("active_role").map(is_administrator).unwrap_or(false) {
        Ok(())
    } else {
        Err(StatusError::forbidden().brief("Only administrators can manage the regulation knowledge base"))
    }
}

/// Registered regulations with their chunk counts, the PDFs in the regulation folder and the
/// length of the embedding queue (administrators only).
#[endpoint(tags("AI - Regulation"), status_codes(200, 403, 500))]
pub async fn status(depot: &mut Depot) -> Result<Json<RegulationStatusResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let internal = |e: &dyn std::fmt::Display| StatusError::internal_server_error().brief(e.to_string());

    let docs = regulation_document::Entity::find()
        .filter(regulation_document::Column::DeletedAt.is_null())
        .order_by_asc(regulation_document::Column::Year)
        .order_by_asc(regulation_document::Column::Number)
        .all(db)
        .await
        .map_err(|e| internal(&e))?;

    let counts = ChunkCount::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        "SELECT chunkable_id, COUNT(*)::bigint AS chunk_count FROM ai.chunks \
         WHERE chunkable_type = $1 AND deleted_at IS NULL GROUP BY chunkable_id",
        [REGULATION_CHUNKABLE_TYPE.into()],
    ))
    .all(db)
    .await
    .map_err(|e| internal(&e))?;

    let (files, folder_available) = match list_pdfs(&default_dir(), None) {
        Ok(files) => (files, true),
        Err(_) => (Vec::new(), false),
    };
    let unregistered = files
        .iter()
        .filter_map(|p| p.file_name().map(|n| n.to_string_lossy().into_owned()))
        .filter(|name| !docs.iter().any(|d| d.source.as_deref() == Some(name.as_str())))
        .collect();

    let items: Vec<RegulationItemStatus> = docs
        .into_iter()
        .map(|d| RegulationItemStatus {
            chunk_count: counts.iter().find(|c| c.chunkable_id == d.id).map_or(0, |c| c.chunk_count),
            id: d.id,
            title: d.title,
            number: d.number,
            year: d.year,
            status: d.status,
            source: d.source,
        })
        .collect();
    let total_chunks = items.iter().map(|i| i.chunk_count).sum();
    let indexed_count = items.iter().filter(|i| i.chunk_count > 0).count();

    Ok(Json(RegulationStatusResponse {
        items,
        folder_pdf_count: files.len(),
        unregistered,
        total_chunks,
        docling_available: docling::is_available().await,
        folder_available,
        indexed_count,
        queue_length: pdf_queue_length(db).await,
    }))
}

/// Registers the regulation PDFs and queues them on the PGMQ embedding queue (administrators only).
/// The embedding worker processes them one at a time; poll [`status`] for the queue length and chunk counts.
/// Equivalent to the `compliance:ingest-regulations` task, but through the queue.
#[endpoint(tags("AI - Regulation"), status_codes(200, 400, 403, 500))]
pub async fn rebuild(req: &mut Request, depot: &mut Depot) -> Result<Json<RebuildRegulationsResponse>, StatusError> {
    require_administrator(depot)?;
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue connection missing")
    })?;
    let payload: RebuildRegulationsRequest = req.parse_json().await.unwrap_or_default();

    let dir = default_dir();
    match list_pdfs(&dir, None) {
        Ok(files) if !files.is_empty() => {}
        Ok(_) => return Err(StatusError::bad_request().brief("The regulation folder has no PDF files")),
        Err(_) => return Err(StatusError::bad_request().brief("The regulation folder was not found on the server")),
    }
    if !docling::is_available().await {
        return Err(StatusError::bad_request().brief(crate::services::ai::knowledge::DOCLING_MISSING_WARNING));
    }

    let (queued, skipped) = enqueue_directory(db, queue, &dir, payload.force.unwrap_or(false), auth_user_id(depot))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let skipped: Vec<RegulationSkipped> =
        skipped.into_iter().map(|s| RegulationSkipped { name: s.name, reason: s.reason }).collect();

    Ok(Json(RebuildRegulationsResponse {
        queued,
        message: format!("{queued} regulation(s) queued, {} skipped", skipped.len()),
        skipped,
    }))
}
