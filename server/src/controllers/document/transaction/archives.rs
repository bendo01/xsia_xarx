use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::document::transaction::archives::{
    CreateArchivRequest, ArchivQuery, ArchivResponse, PaginatedArchivResponse,
    UpdateArchivRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::document::transaction::archives as entity_mod;

#[endpoint(tags("Document - Transaction - Archiv"), status_codes(200, 500))]
pub async fn list_archives(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedArchivResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ArchivQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| ArchivResponse {
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

    Ok(Json(PaginatedArchivResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Document - Transaction - Archiv"), status_codes(200, 400, 404, 500))]
pub async fn get_archive(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ArchivResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Archiv not found"))?;

    Ok(Json(ArchivResponse {
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
}#[endpoint(tags("Document - Transaction - Archiv"), status_codes(200, 400, 500))]
pub async fn create_archive(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ArchivResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateArchivRequest = req.parse_json().await.map_err(|e| {
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
        created_by: Set(None),
        updated_by: Set(None),
        description: Set(payload.description),
        is_knowledge: Set(payload.is_knowledge),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ArchivResponse {
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

#[endpoint(tags("Document - Transaction - Archiv"), status_codes(200, 400, 404, 500))]
pub async fn update_archive(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ArchivResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateArchivRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Archiv not found"))?;

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
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ArchivResponse {
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
#[endpoint(tags("Document - Transaction - Archiv"), status_codes(200, 400, 404, 500))]
pub async fn delete_archive(
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
            .ok_or_else(|| StatusError::not_found().brief("Archiv not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(Utc::now().into()));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Archiv deleted successfully".to_string(),
        }))
}
