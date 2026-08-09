use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::person::master::individual::{
    BiodataQuery, BiodataResponse, CreateBiodataRequest, MessageResponse, PaginatedBiodataResponse,
    UpdateBiodataRequest,
};
use crate::models::person::master::biodata as biodata_mod;

#[endpoint(tags("Person Master - Biodata"), status_codes(200, 500))]
pub async fn list_biodatas(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBiodataResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: BiodataQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = biodata_mod::Entity::find().filter(biodata_mod::Column::DeletedAt.is_null());

    if let Some(individual_id) = query.individual_id {
        select = select.filter(biodata_mod::Column::IndividualId.eq(individual_id));
    }

    let paginator = select
        .order_by_asc(biodata_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator
        .num_items()
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator
        .fetch_page(page.saturating_sub(1))
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(biodata_to_response).collect();

    Ok(Json(PaginatedBiodataResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Person Master - Biodata"), status_codes(200, 400, 404, 500))]
pub async fn get_biodata(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = biodata_mod::Entity::find_by_id(id)
        .filter(biodata_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Biodata not found"))?;

    Ok(Json(biodata_to_response(item)))
}

#[endpoint(tags("Person Master - Biodata"), status_codes(200, 400, 404, 500))]
pub async fn get_biodata_by_individual(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let individual_id_str = req
        .param::<String>("individual_id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter individual_id"))?;

    let individual_id = Uuid::parse_str(&individual_id_str)
        .map_err(|_| StatusError::bad_request().brief("Invalid UUID format for individual_id"))?;

    let item = biodata_mod::Entity::find()
        .filter(biodata_mod::Column::IndividualId.eq(individual_id))
        .filter(biodata_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Biodata not found for this individual"))?;

    Ok(Json(biodata_to_response(item)))
}

#[endpoint(tags("Person Master - Biodata"), status_codes(200, 400, 500))]
pub async fn create_biodata(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateBiodataRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = biodata_mod::ActiveModel {
        id: Set(new_id),
        individual_id: Set(payload.individual_id),
        height: Set(payload.height),
        weight: Set(payload.weight),
        is_positive_blood_rhesus: Set(payload.is_positive_blood_rhesus),
        blood_type_id: Set(payload.blood_type_id),
        hair_type_id: Set(payload.hair_type_id),
        hair_color_id: Set(payload.hair_color_id),
        eye_color_id: Set(payload.eye_color_id),
        bust: Set(payload.bust),
        waist: Set(payload.waist),
        hip: Set(payload.hip),
        arm_circumference: Set(payload.arm_circumference),
        menarche_age: Set(payload.menarche_age),
        menopause_age: Set(payload.menopause_age),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(biodata_to_response(item)))
}

#[endpoint(tags("Person Master - Biodata"), status_codes(200, 400, 404, 500))]
pub async fn update_biodata(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateBiodataRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = biodata_mod::Entity::find_by_id(id)
        .filter(biodata_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Biodata not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(v) = payload.height {
        active_model.height = Set(v);
    }
    if let Some(v) = payload.weight {
        active_model.weight = Set(v);
    }
    if let Some(v) = payload.is_positive_blood_rhesus {
        active_model.is_positive_blood_rhesus = Set(v);
    }
    if let Some(v) = payload.blood_type_id {
        active_model.blood_type_id = Set(v);
    }
    if let Some(v) = payload.hair_type_id {
        active_model.hair_type_id = Set(v);
    }
    if let Some(v) = payload.hair_color_id {
        active_model.hair_color_id = Set(v);
    }
    if let Some(v) = payload.eye_color_id {
        active_model.eye_color_id = Set(v);
    }
    if let Some(v) = payload.bust {
        active_model.bust = Set(v);
    }
    if let Some(v) = payload.waist {
        active_model.waist = Set(v);
    }
    if let Some(v) = payload.hip {
        active_model.hip = Set(v);
    }
    if let Some(v) = payload.arm_circumference {
        active_model.arm_circumference = Set(v);
    }
    if let Some(v) = payload.menarche_age {
        active_model.menarche_age = Set(v);
    }
    if let Some(v) = payload.menopause_age {
        active_model.menopause_age = Set(v);
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(biodata_to_response(item)))
}

#[endpoint(tags("Person Master - Biodata"), status_codes(200, 400, 404, 500))]
pub async fn delete_biodata(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = biodata_mod::Entity::find_by_id(id)
        .filter(biodata_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Biodata not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Biodata deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn biodata_to_response(item: biodata_mod::Model) -> BiodataResponse {
    BiodataResponse {
        id: item.id,
        individual_id: item.individual_id,
        height: item.height,
        weight: item.weight,
        is_positive_blood_rhesus: item.is_positive_blood_rhesus,
        blood_type_id: item.blood_type_id,
        hair_type_id: item.hair_type_id,
        hair_color_id: item.hair_color_id,
        eye_color_id: item.eye_color_id,
        bust: item.bust,
        waist: item.waist,
        hip: item.hip,
        arm_circumference: item.arm_circumference,
        menarche_age: item.menarche_age,
        menopause_age: item.menopause_age,
        created_at: item.created_at,
        updated_at: item.updated_at,
        deleted_at: item.deleted_at,
        sync_at: item.sync_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
    }
}
