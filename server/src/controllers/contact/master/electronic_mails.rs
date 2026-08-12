use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::contact::master::electronic_mails::{
    CreateElectronicMailRequest, ElectronicMailQuery, ElectronicMailResponse, PaginatedElectronicMailResponse,
    UpdateElectronicMailRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::contact::master::electronic_mails as entity_mod;

#[endpoint(tags("Contact - Master - ElectronicMail"), status_codes(200, 500))]
pub async fn list_electronic_mails(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedElectronicMailResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: ElectronicMailQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| ElectronicMailResponse {
            id: item.id,
            email_address: item.email_address.clone(),
            electronic_mail_type_id: item.electronic_mail_type_id,
            electronic_mailable_id: item.electronic_mailable_id,
            electronic_mailable_type: item.electronic_mailable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedElectronicMailResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Contact - Master - ElectronicMail"), status_codes(200, 400, 404, 500))]
pub async fn get_electronic_mail(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<ElectronicMailResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("ElectronicMail not found"))?;

    Ok(Json(ElectronicMailResponse {
            id: item.id,
            email_address: item.email_address.clone(),
            electronic_mail_type_id: item.electronic_mail_type_id,
            electronic_mailable_id: item.electronic_mailable_id,
            electronic_mailable_type: item.electronic_mailable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Contact - Master - ElectronicMail"), status_codes(200, 400, 500))]
pub async fn create_electronic_mail(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ElectronicMailResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateElectronicMailRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        email_address: Set(payload.email_address),
        electronic_mail_type_id: Set(payload.electronic_mail_type_id),
        electronic_mailable_id: Set(payload.electronic_mailable_id),
        electronic_mailable_type: Set(payload.electronic_mailable_type),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ElectronicMailResponse {
            id: item.id,
            email_address: item.email_address.clone(),
            electronic_mail_type_id: item.electronic_mail_type_id,
            electronic_mailable_id: item.electronic_mailable_id,
            electronic_mailable_type: item.electronic_mailable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Contact - Master - ElectronicMail"), status_codes(200, 400, 404, 500))]
pub async fn update_electronic_mail(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<ElectronicMailResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateElectronicMailRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("ElectronicMail not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(email_address) = payload.email_address {
            active_model.email_address = Set(email_address);
        }
    if let Some(electronic_mail_type_id) = payload.electronic_mail_type_id {
            active_model.electronic_mail_type_id = Set(Some(electronic_mail_type_id));
        }
    if let Some(electronic_mailable_id) = payload.electronic_mailable_id {
            active_model.electronic_mailable_id = Set(electronic_mailable_id);
        }
    if let Some(electronic_mailable_type) = payload.electronic_mailable_type {
            active_model.electronic_mailable_type = Set(electronic_mailable_type);
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(ElectronicMailResponse {
            id: item.id,
            email_address: item.email_address.clone(),
            electronic_mail_type_id: item.electronic_mail_type_id,
            electronic_mailable_id: item.electronic_mailable_id,
            electronic_mailable_type: item.electronic_mailable_type.clone(),
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Contact - Master - ElectronicMail"), status_codes(200, 400, 404, 500))]
pub async fn delete_electronic_mail(
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
            .ok_or_else(|| StatusError::not_found().brief("ElectronicMail not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "ElectronicMail deleted successfully".to_string(),
        }))
}
