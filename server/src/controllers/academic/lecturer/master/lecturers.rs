use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::lecturer::master::lecturers::{
    CreateLecturerRequest, LecturerQuery, LecturerResponse, PaginatedLecturerResponse,
    UpdateLecturerRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::lecturer::master::lecturers as entity_mod;

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 500))]
pub async fn list_lecturers(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedLecturerResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: LecturerQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    if let Some(individual_id) = query.individual_id {
        select = select.filter(entity_mod::Column::IndividualId.eq(individual_id));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedLecturerResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 404, 500))]
pub async fn get_lecturer(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<LecturerResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Lecturer not found"))?;

    Ok(Json(LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 500))]
pub async fn create_lecturer(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<LecturerResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateLecturerRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
            id_registrasi_dosen: Set(None),
        code: Set(payload.code),
        name: Set(payload.name),
        individual_id: Set(payload.individual_id),
        institution_id: Set(payload.institution_id),
        alternative_code: Set(payload.alternative_code),
        accessor_number: Set(payload.accessor_number),
        identification_number: Set(payload.identification_number),
        status_id: Set(payload.status_id),
        contract_id: Set(payload.contract_id),
        rank_id: Set(payload.rank_id),
        start_date: Set(payload.start_date),
        end_date: Set(payload.end_date),
        front_title: Set(payload.front_title),
        last_title: Set(payload.last_title),
        id_dosen: Set(payload.id_dosen),
        group_id: Set(payload.group_id),
        nuptk: Set(payload.nuptk),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 404, 500))]
pub async fn update_lecturer(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<LecturerResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateLecturerRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Lecturer not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(institution_id) = payload.institution_id {
            active_model.institution_id = Set(Some(institution_id));
        }
    if let Some(alternative_code) = payload.alternative_code {
            active_model.alternative_code = Set(Some(alternative_code));
        }
    if let Some(accessor_number) = payload.accessor_number {
            active_model.accessor_number = Set(Some(accessor_number));
        }
    if let Some(identification_number) = payload.identification_number {
            active_model.identification_number = Set(Some(identification_number));
        }
    if let Some(status_id) = payload.status_id {
            active_model.status_id = Set(Some(status_id));
        }
    if let Some(contract_id) = payload.contract_id {
            active_model.contract_id = Set(Some(contract_id));
        }
    if let Some(rank_id) = payload.rank_id {
            active_model.rank_id = Set(Some(rank_id));
        }
    if let Some(start_date) = payload.start_date {
            active_model.start_date = Set(Some(start_date));
        }
    if let Some(end_date) = payload.end_date {
            active_model.end_date = Set(Some(end_date));
        }
    if let Some(front_title) = payload.front_title {
            active_model.front_title = Set(Some(front_title));
        }
    if let Some(last_title) = payload.last_title {
            active_model.last_title = Set(Some(last_title));
        }
    if let Some(id_dosen) = payload.id_dosen {
            active_model.id_dosen = Set(Some(id_dosen));
        }
    if let Some(group_id) = payload.group_id {
            active_model.group_id = Set(Some(group_id));
        }
    if let Some(nuptk) = payload.nuptk {
            active_model.nuptk = Set(Some(nuptk));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(LecturerResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name,
            individual_id: item.individual_id,
            institution_id: item.institution_id,
            alternative_code: item.alternative_code,
            accessor_number: item.accessor_number,
            identification_number: item.identification_number,
            status_id: item.status_id,
            contract_id: item.contract_id,
            rank_id: item.rank_id,
            start_date: item.start_date,
            end_date: item.end_date,
            front_title: item.front_title,
            last_title: item.last_title,
            id_dosen: item.id_dosen,
            group_id: item.group_id,
            nuptk: item.nuptk,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Academic - Lecturer - Master - Lecturer"), status_codes(200, 400, 404, 500))]
pub async fn delete_lecturer(
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
            .ok_or_else(|| StatusError::not_found().brief("Lecturer not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Lecturer deleted successfully".to_string(),
        }))
}
