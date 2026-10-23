use std::path::PathBuf;

use chrono::Utc;
use pgmq::PGMQueueExt;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseBackend, DatabaseConnection, EntityTrait,
    FromQueryResult, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, Set, Statement,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::document::transaction::archives::{
    CreateArchiveRequest, ArchiveQuery, ArchiveResponse, PaginatedArchiveResponse,
    UpdateArchiveRequest, ArchiveOptionRequest, UploadArchiveResponse, ReindexArchiveResponse,
    ReindexAllRequest, ReindexAllResponse, ReindexSkipped, KnowledgeItemStatus, KnowledgeStatusResponse,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::document::transaction::archives as entity_mod;
use crate::middleware::auth::auth_user_id;
use crate::jobs::embedding::embed::pdf_queue_length;
use crate::services::ai::{docling, knowledge};

#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedArchiveResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ArchiveQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| ArchiveResponse {
            id: item.id,
            name: item.name.clone(),
            dir: item.dir.clone(),
            mimetype: item.mimetype.clone(),
            size: item.size,
            archiveable_id: item.archiveable_id,
            archiveable_type: item.archiveable_type,
            archive_type_id: item.archive_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            description: item.description,
            is_knowledge: item.is_knowledge,

    }).collect();

    Ok(Json(PaginatedArchiveResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ArchiveResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Archive not found"))?;

    Ok(Json(ArchiveResponse {
            id: item.id,
            name: item.name.clone(),
            dir: item.dir.clone(),
            mimetype: item.mimetype.clone(),
            size: item.size,
            archiveable_id: item.archiveable_id,
            archiveable_type: item.archiveable_type,
            archive_type_id: item.archive_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            description: item.description,
            is_knowledge: item.is_knowledge,

    }))
}#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 500))]
pub async fn store(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ArchiveResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateArchiveRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        name: Set(payload.name),
        dir: Set(payload.dir),
        mimetype: Set(payload.mimetype),
        size: Set(payload.size),
        archiveable_id: Set(payload.archiveable_id),
        archiveable_type: Set(payload.archiveable_type),
        archive_type_id: Set(payload.archive_type_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
        description: Set(payload.description),
        is_knowledge: Set(payload.is_knowledge),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ArchiveResponse {
            id: item.id,
            name: item.name.clone(),
            dir: item.dir.clone(),
            mimetype: item.mimetype.clone(),
            size: item.size,
            archiveable_id: item.archiveable_id,
            archiveable_type: item.archiveable_type,
            archive_type_id: item.archive_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            description: item.description,
            is_knowledge: item.is_knowledge,

        }))
}

#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 404, 500))]
pub async fn update(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ArchiveResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateArchiveRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Archive not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(dir) = payload.dir {
            active_model.dir = Set(dir);
        }
    if let Some(mimetype) = payload.mimetype {
            active_model.mimetype = Set(mimetype);
        }
    if let Some(size) = payload.size {
            active_model.size = Set(Some(size));
        }
    if let Some(archiveable_id) = payload.archiveable_id {
            active_model.archiveable_id = Set(Some(archiveable_id));
        }
    if let Some(archiveable_type) = payload.archiveable_type {
            active_model.archiveable_type = Set(Some(archiveable_type));
        }
    if let Some(archive_type_id) = payload.archive_type_id {
            active_model.archive_type_id = Set(archive_type_id);
        }
    if let Some(description) = payload.description {
            active_model.description = Set(Some(description));
        }
    if let Some(is_knowledge) = payload.is_knowledge {
            active_model.is_knowledge = Set(is_knowledge);
            if !is_knowledge {
                knowledge::remove_archive_chunks(db, id, auth_user_id(depot))
                    .await
                    .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
            }
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ArchiveResponse {
            id: item.id,
            name: item.name.clone(),
            dir: item.dir.clone(),
            mimetype: item.mimetype.clone(),
            size: item.size,
            archiveable_id: item.archiveable_id,
            archiveable_type: item.archiveable_type,
            archive_type_id: item.archive_type_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            description: item.description,
            is_knowledge: item.is_knowledge,

        }))
}
#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 404, 500))]
pub async fn delete(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Archive not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
        knowledge::remove_archive_chunks(db, id, auth_user_id(depot))
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Archive deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: ArchiveOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            select = select.filter(entity_mod::Column::Name.contains(search_trimmed));
        }
    }

    if let Some(archive_type_id) = payload.archive_type_id {
        select = select.filter(entity_mod::Column::ArchiveTypeId.eq(archive_type_id));
    }

    let items = select
        .order_by_asc(entity_mod::Column::Name)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: item.name,
        })
        .collect();

    Ok(Json(data))
}

/// Largest file accepted by [`upload`]
const MAX_UPLOAD_BYTES: usize = 50 * 1024 * 1024;

const UPLOAD_ROOT: &str = "public/upload/document/archives";

fn to_response(item: entity_mod::Model) -> ArchiveResponse {
    ArchiveResponse {
        id: item.id,
        name: item.name,
        dir: item.dir,
        mimetype: item.mimetype,
        size: item.size,
        archiveable_id: item.archiveable_id,
        archiveable_type: item.archiveable_type,
        archive_type_id: item.archive_type_id,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        description: item.description,
        is_knowledge: item.is_knowledge,
    }
}

/// Keeps only the file name, with characters that are safe on disk and in URLs
fn sanitize_file_name(name: &str) -> String {
    let base = name.rsplit(['/', '\\']).next().unwrap_or(name);
    let cleaned: String = base
        .chars()
        .map(|c| if c.is_alphanumeric() || matches!(c, '.' | '-' | '_' | ' ') { c } else { '_' })
        .collect();
    let cleaned = cleaned.trim().trim_start_matches('.').to_string();
    if cleaned.is_empty() { "document".to_string() } else { cleaned }
}

/// Upload a file as an archive (multipart). Fields: `file` (required), `archive_type_id` (required),
/// `description`, `is_knowledge`, `archiveable_id`, `archiveable_type`.
/// When `is_knowledge` is true and the file is a PDF, it is converted to Markdown with docling,
/// embedded with paraphrase-multilingual-MiniLM-L12-v2 and stored in `ai.chunks`. If docling is not
/// installed the archive is still saved and the response carries a warning.
#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 500))]
pub async fn upload(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UploadArchiveResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let internal = |e: &dyn std::fmt::Display| StatusError::internal_server_error().brief(e.to_string());

    let form = req
        .form_data_max_size(MAX_UPLOAD_BYTES)
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid multipart form: {}", e)))?;

    let file = form
        .files
        .get("file")
        .ok_or_else(|| StatusError::bad_request().brief("Missing file in field 'file'"))?;
    let size = file.size();
    if size == 0 || size > MAX_UPLOAD_BYTES as u64 {
        return Err(StatusError::bad_request().brief("File size must be between 1 byte and 50 MB"));
    }

    let field = |key: &str| form.fields.get(key).map(|s| s.trim().to_string()).filter(|s| !s.is_empty());
    let parse_uuid = |key: &str| -> Result<Option<Uuid>, StatusError> {
        field(key)
            .map(|v| Uuid::parse_str(&v).map_err(|_| StatusError::bad_request().brief(format!("Invalid {key}"))))
            .transpose()
    };

    let archive_type_id = parse_uuid("archive_type_id")?
        .ok_or_else(|| StatusError::bad_request().brief("archive_type_id is required"))?;
    let archiveable_id = parse_uuid("archiveable_id")?;
    let is_knowledge = matches!(field("is_knowledge").as_deref(), Some("true" | "1" | "on"));

    let bytes = tokio::fs::read(file.path()).await.map_err(|e| internal(&e))?;
    let is_pdf = bytes.starts_with(b"%PDF-");
    if is_knowledge && !is_pdf {
        return Err(StatusError::bad_request().brief("Only PDF files can be added to the knowledge base"));
    }
    let mimetype = if is_pdf {
        "application/pdf".to_string()
    } else {
        file.content_type()
            .map(|m| m.essence_str().to_string())
            .unwrap_or_else(|| "application/octet-stream".to_string())
    };

    let new_id = Uuid::now_v7();
    let name = sanitize_file_name(file.name().unwrap_or("document"));
    let dir = format!("{UPLOAD_ROOT}/{new_id}/");
    tokio::fs::create_dir_all(&dir).await.map_err(|e| internal(&e))?;
    tokio::fs::write(PathBuf::from(&dir).join(&name), &bytes).await.map_err(|e| internal(&e))?;

    let now = Utc::now().naive_utc();
    let user_id = auth_user_id(depot);
    let item = entity_mod::ActiveModel {
        id: Set(new_id),
        name: Set(name),
        dir: Set(dir.clone()),
        mimetype: Set(mimetype),
        size: Set(Some(size.min(i32::MAX as u64) as i32)),
        archiveable_id: Set(archiveable_id),
        archiveable_type: Set(field("archiveable_type")),
        archive_type_id: Set(archive_type_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(user_id),
        updated_by: Set(user_id),
        description: Set(field("description")),
        is_knowledge: Set(is_knowledge),
    }
    .insert(db)
    .await
    .map_err(|e| {
        let _ = std::fs::remove_dir_all(&dir);
        internal(&e)
    })?;

    let (mut knowledge_status, mut warning) = (None, None);
    if is_knowledge {
        let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
            StatusError::internal_server_error().brief("Queue connection missing")
        })?;
        match knowledge::enqueue_archive(queue, &item, user_id).await {
            Ok(_) => knowledge_status = Some("queued".to_string()),
            Err(e) => {
                tracing::warn!("Archive {} not queued for knowledge base: {:#}", item.id, e);
                knowledge_status = Some("skipped".to_string());
                warning = Some(e.to_string());
            }
        }
    }

    Ok(Json(UploadArchiveResponse { archive: to_response(item), knowledge_status, warning }))
}

/// (Re-)build the knowledge base chunks of a PDF archive in the background.
/// Fails with a warning message when docling is not installed.
#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 404, 500))]
pub async fn reindex(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReindexArchiveResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let item = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Archive not found"))?;

    if !item.is_knowledge {
        return Err(StatusError::bad_request().brief("Archive is not marked as knowledge"));
    }

    let msg_id = knowledge::enqueue_archive(queue, &item, auth_user_id(depot))
        .await
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    Ok(Json(ReindexArchiveResponse {
        msg_id,
        message: "Archive queued for the knowledge base".to_string(),
    }))
}

/// Queues every PDF archive marked as knowledge (or only `ids`) for a rebuild of its chunks.
/// Existing chunks of an archive are replaced when its job finishes, so the knowledge base stays
/// searchable meanwhile. Archives that cannot be queued are listed in `skipped`.
#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 400, 500))]
pub async fn reindex_all(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ReindexAllResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let queue = depot.get_typed::<PGMQueueExt>().map_err(|_| {
        StatusError::internal_server_error().brief("Queue connection missing")
    })?;

    let payload: ReindexAllRequest = req.parse_json().await.unwrap_or_default();

    let mut select = entity_mod::Entity::find()
        .filter(entity_mod::Column::DeletedAt.is_null())
        .filter(entity_mod::Column::IsKnowledge.eq(true));
    if let Some(ids) = payload.ids.filter(|ids| !ids.is_empty()) {
        select = select.filter(entity_mod::Column::Id.is_in(ids));
    }
    let items = select
        .order_by_asc(entity_mod::Column::Name)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    if items.is_empty() {
        return Err(StatusError::bad_request().brief("No knowledge archives to rebuild"));
    }
    if !docling::is_available().await {
        return Err(StatusError::bad_request().brief(knowledge::DOCLING_MISSING_WARNING));
    }

    let user_id = auth_user_id(depot);
    let (mut queued, mut skipped) = (0, Vec::new());
    for item in items {
        match knowledge::enqueue_archive(queue, &item, user_id).await {
            Ok(_) => queued += 1,
            Err(e) => {
                tracing::warn!("Archive {} not queued for rebuild: {:#}", item.id, e);
                skipped.push(ReindexSkipped { id: item.id, name: item.name, reason: e.to_string() });
            }
        }
    }

    Ok(Json(ReindexAllResponse {
        queued,
        message: format!("{queued} archive(s) queued, {} skipped", skipped.len()),
        skipped,
    }))
}

#[derive(FromQueryResult)]
struct ChunkStat {
    chunkable_id: Uuid,
    chunk_count: i64,
    last_indexed_at: Option<chrono::NaiveDateTime>,
}

/// Knowledge archives with their chunk counts, the embedding queue length and whether docling is installed.
#[endpoint(tags("Document - Transaction - Archive"), status_codes(200, 500))]
pub async fn knowledge_overview(depot: &mut Depot) -> Result<Json<KnowledgeStatusResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;
    let internal = |e: &dyn std::fmt::Display| StatusError::internal_server_error().brief(e.to_string());

    let archives = entity_mod::Entity::find()
        .filter(entity_mod::Column::DeletedAt.is_null())
        .filter(entity_mod::Column::IsKnowledge.eq(true))
        .order_by_asc(entity_mod::Column::Name)
        .all(db)
        .await
        .map_err(|e| internal(&e))?;

    let stats = ChunkStat::find_by_statement(Statement::from_sql_and_values(
        DatabaseBackend::Postgres,
        "SELECT chunkable_id, COUNT(*)::bigint AS chunk_count, MAX(updated_at) AS last_indexed_at \
         FROM ai.chunks WHERE chunkable_type = $1 AND deleted_at IS NULL GROUP BY chunkable_id",
        [entity_mod::CHUNKABLE_TYPE.into()],
    ))
    .all(db)
    .await
    .map_err(|e| internal(&e))?;

    let queue_length = pdf_queue_length(db).await;

    let items: Vec<KnowledgeItemStatus> = archives
        .into_iter()
        .map(|a| {
            let stat = stats.iter().find(|s| s.chunkable_id == a.id);
            KnowledgeItemStatus {
                id: a.id,
                name: a.name,
                size: a.size,
                chunk_count: stat.map_or(0, |s| s.chunk_count),
                last_indexed_at: stat.and_then(|s| s.last_indexed_at),
            }
        })
        .collect();
    let total_chunks = items.iter().map(|i| i.chunk_count).sum();

    Ok(Json(KnowledgeStatusResponse {
        items,
        queue_length,
        docling_available: docling::is_available().await,
        total_chunks,
    }))
}
