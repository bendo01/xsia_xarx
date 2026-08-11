use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::candidate::transaction::documents::{
    CreateDocumentRequest, DocumentQuery, DocumentResponse, PaginatedDocumentResponse,
    UpdateDocumentRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::candidate::transaction::documents as entity_mod;

#[endpoint(tags("Academic - Candidate - Transaction - Document"), status_codes(200, 500))]
pub async fn list_documents(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedDocumentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: DocumentQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| DocumentResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            document_type_id: item.document_type_id,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            size: item.size,
            is_verified: item.is_verified,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedDocumentResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Candidate - Transaction - Document"), status_codes(200, 400, 404, 500))]
pub async fn get_document(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DocumentResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Document not found"))?;

    Ok(Json(DocumentResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            document_type_id: item.document_type_id,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            size: item.size,
            is_verified: item.is_verified,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Candidate - Transaction - Document"), status_codes(200, 400, 500))]
pub async fn create_document(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DocumentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateDocumentRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        candidate_id: Set(payload.candidate_id),
        document_type_id: Set(payload.document_type_id),
        filename: Set(payload.filename),
        dir: Set(payload.dir),
        r#type: Set(payload.r#type),
        size: Set(payload.size),
        is_verified: Set(payload.is_verified),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(DocumentResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            document_type_id: item.document_type_id,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            size: item.size,
            is_verified: item.is_verified,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Candidate - Transaction - Document"), status_codes(200, 400, 404, 500))]
pub async fn update_document(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<DocumentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateDocumentRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Document not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(candidate_id) = payload.candidate_id {
        active_model.candidate_id = Set(candidate_id);
    }
    if let Some(document_type_id) = payload.document_type_id {
        active_model.document_type_id = Set(document_type_id);
    }
    if let Some(filename) = payload.filename {
        active_model.filename = Set(Some(filename));
    }
    if let Some(dir) = payload.dir {
        active_model.dir = Set(Some(dir));
    }
    if let Some(r#type) = payload.r#type {
        active_model.r#type = Set(Some(r#type));
    }
    if let Some(size) = payload.size {
        active_model.size = Set(Some(size));
    }
    if let Some(is_verified) = payload.is_verified {
        active_model.is_verified = Set(Some(is_verified));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(DocumentResponse {
            id: item.id,
            candidate_id: item.candidate_id,
            document_type_id: item.document_type_id,
            filename: item.filename,
            dir: item.dir,
            r#type: item.r#type,
            size: item.size,
            is_verified: item.is_verified,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Candidate - Transaction - Document"), status_codes(200, 400, 404, 500))]
pub async fn delete_document(
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
        .ok_or_else(|| StatusError::not_found().brief("Document not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Document deleted successfully".to_string(),
    }))
}
