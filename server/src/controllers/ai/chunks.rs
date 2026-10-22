use std::path::PathBuf;

use pgmq::PGMQueueExt;
use salvo::prelude::*;
use uuid::Uuid;

use crate::dtos::ai::chunks::UploadChunkResponse;
use crate::jobs::embedding::embed::{PdfEmbeddingJob, enqueue_pdf_embedding};
use crate::middleware::auth::auth_user_id;
use crate::middleware::rbac::is_administrator;
use crate::models::auth::role;

/// Largest PDF accepted by [`upload`]
const MAX_UPLOAD_BYTES: usize = 50 * 1024 * 1024;

const DEFAULT_CHUNKABLE_TYPE: &str = "Document";

/// Where uploaded PDFs wait for the embedding worker; override with `AI_UPLOAD_DIR`
const DEFAULT_UPLOAD_DIR: &str = "storage/ai/uploads";

/// Upload a PDF (administrators only) to be embedded in the background. The worker converts it
/// to Markdown with docling, splits it into chunks, embeds them with
/// paraphrase-multilingual-MiniLM-L12-v2 and stores them in `ai.chunks`.
///
/// Multipart fields: `file` (PDF, required), `chunkable_type` (default `Document`) and
/// `chunkable_id` (default: a new id). Uploading again with the same type and id replaces the old chunks.
#[endpoint(tags("AI - Chunk"), status_codes(202, 400, 403, 500))]
pub async fn upload(
    req: &mut Request,
    depot: &mut Depot,
    res: &mut Response,
) -> Result<Json<UploadChunkResponse>, StatusError> {
    let is_admin = depot.get::<role::Model>("active_role").map(is_administrator).unwrap_or(false);
    if !is_admin {
        return Err(StatusError::forbidden().brief("Only administrators can upload knowledge documents"));
    }

    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue connection missing")
    })?;

    let form = req
        .form_data_max_size(MAX_UPLOAD_BYTES)
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid multipart form: {}", e)))?;

    let file = form
        .files
        .get("file")
        .ok_or_else(|| StatusError::bad_request().brief("Missing PDF in field 'file'"))?;
    let file_name = file.name().unwrap_or("document.pdf").to_string();
    let file_size = file.size();

    let chunkable_type = form
        .fields
        .get("chunkable_type")
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| DEFAULT_CHUNKABLE_TYPE.to_string());
    let chunkable_id = match form.fields.get("chunkable_id").map(|s| s.trim()).filter(|s| !s.is_empty()) {
        Some(id) => Uuid::parse_str(id).map_err(|_| StatusError::bad_request().brief("Invalid chunkable_id"))?,
        None => Uuid::now_v7(),
    };

    let bytes = tokio::fs::read(file.path())
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    if !bytes.starts_with(b"%PDF-") {
        return Err(StatusError::bad_request().brief("Uploaded file is not a PDF"));
    }

    // The multipart temp file is gone after this request, so keep a copy for the worker
    let upload_dir = std::env::var("AI_UPLOAD_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| PathBuf::from(DEFAULT_UPLOAD_DIR));
    let pdf_path = upload_dir.join(format!("{}.pdf", Uuid::now_v7()));
    tokio::fs::create_dir_all(&upload_dir)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    tokio::fs::write(&pdf_path, &bytes)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let job = PdfEmbeddingJob {
        pdf_path: pdf_path.to_string_lossy().into_owned(),
        file_name: file_name.clone(),
        file_size,
        chunkable_type: chunkable_type.clone(),
        chunkable_id,
        user_id: auth_user_id(depot),
        markdown_path: None,
    };

    let msg_id = match enqueue_pdf_embedding(queue, &job).await {
        Ok(id) => id,
        Err(e) => {
            let _ = tokio::fs::remove_file(&pdf_path).await;
            return Err(StatusError::internal_server_error().brief(format!("Failed to queue PDF: {}", e)));
        }
    };

    res.status_code(StatusCode::ACCEPTED);
    Ok(Json(UploadChunkResponse {
        msg_id,
        chunkable_type,
        chunkable_id,
        file_name,
        file_size,
    }))
}
