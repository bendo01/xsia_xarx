use std::collections::HashMap;
use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, PaginatorTrait,
    QueryFilter, QueryOrder, Set, QuerySelect,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::person::master::biodata::{
    CreateBiodataRequest, BiodataQuery, BiodataResponse, PaginatedBiodataResponse,
    UpdateBiodataRequest, BiodataOptionRequest,
};
use crate::dtos::common::reference::{MessageResponse, OptionItem};
use crate::models::person::master::biodata as entity_mod;
use crate::models::person::master::individual as individual_mod;
use crate::middleware::auth::auth_user_id;

#[endpoint(tags("Person - Master - Biodata"), status_codes(200, 500))]
pub async fn index(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBiodataResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BiodataQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| BiodataResponse {
            id: item.id,
            height: item.height,
            weight: item.weight,
            is_positive_blood_rhesus: item.is_positive_blood_rhesus,
            blood_type_id: item.blood_type_id,
            hair_type_id: item.hair_type_id,
            hair_color_id: item.hair_color_id,
            eye_color_id: item.eye_color_id,
            individual_id: item.individual_id,
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

    }).collect();

    Ok(Json(PaginatedBiodataResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Person - Master - Biodata"), status_codes(200, 400, 404, 500))]
pub async fn show(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Biodata not found"))?;

    Ok(Json(BiodataResponse {
            id: item.id,
            height: item.height,
            weight: item.weight,
            is_positive_blood_rhesus: item.is_positive_blood_rhesus,
            blood_type_id: item.blood_type_id,
            hair_type_id: item.hair_type_id,
            hair_color_id: item.hair_color_id,
            eye_color_id: item.eye_color_id,
            individual_id: item.individual_id,
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

    }))
}#[endpoint(tags("Person - Master - Biodata"), status_codes(200, 400, 500))]
pub async fn store(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateBiodataRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        height: Set(payload.height),
        weight: Set(payload.weight),
        is_positive_blood_rhesus: Set(payload.is_positive_blood_rhesus),
        blood_type_id: Set(payload.blood_type_id),
        hair_type_id: Set(payload.hair_type_id),
        hair_color_id: Set(payload.hair_color_id),
        eye_color_id: Set(payload.eye_color_id),
        individual_id: Set(payload.individual_id),
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
        created_by: Set(auth_user_id(depot)),
        updated_by: Set(auth_user_id(depot)),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BiodataResponse {
            id: item.id,
            height: item.height,
            weight: item.weight,
            is_positive_blood_rhesus: item.is_positive_blood_rhesus,
            blood_type_id: item.blood_type_id,
            hair_type_id: item.hair_type_id,
            hair_color_id: item.hair_color_id,
            eye_color_id: item.eye_color_id,
            individual_id: item.individual_id,
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

        }))
}

#[endpoint(tags("Person - Master - Biodata"), status_codes(200, 400, 404, 500))]
pub async fn update(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BiodataResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateBiodataRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Biodata not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(height) = payload.height {
            active_model.height = Set(height);
        }
    if let Some(weight) = payload.weight {
            active_model.weight = Set(weight);
        }
    if let Some(is_positive_blood_rhesus) = payload.is_positive_blood_rhesus {
            active_model.is_positive_blood_rhesus = Set(is_positive_blood_rhesus);
        }
    if let Some(blood_type_id) = payload.blood_type_id {
            active_model.blood_type_id = Set(blood_type_id);
        }
    if let Some(hair_type_id) = payload.hair_type_id {
            active_model.hair_type_id = Set(hair_type_id);
        }
    if let Some(hair_color_id) = payload.hair_color_id {
            active_model.hair_color_id = Set(hair_color_id);
        }
    if let Some(eye_color_id) = payload.eye_color_id {
            active_model.eye_color_id = Set(eye_color_id);
        }
    if let Some(individual_id) = payload.individual_id {
            active_model.individual_id = Set(individual_id);
        }
    if let Some(bust) = payload.bust {
            active_model.bust = Set(bust);
        }
    if let Some(waist) = payload.waist {
            active_model.waist = Set(waist);
        }
    if let Some(hip) = payload.hip {
            active_model.hip = Set(hip);
        }
    if let Some(arm_circumference) = payload.arm_circumference {
            active_model.arm_circumference = Set(arm_circumference);
        }
    if let Some(menarche_age) = payload.menarche_age {
            active_model.menarche_age = Set(menarche_age);
        }
    if let Some(menopause_age) = payload.menopause_age {
            active_model.menopause_age = Set(menopause_age);
        }
    active_model.updated_at = Set(Some(now));
    active_model.updated_by = Set(auth_user_id(depot));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BiodataResponse {
            id: item.id,
            height: item.height,
            weight: item.weight,
            is_positive_blood_rhesus: item.is_positive_blood_rhesus,
            blood_type_id: item.blood_type_id,
            hair_type_id: item.hair_type_id,
            hair_color_id: item.hair_color_id,
            eye_color_id: item.eye_color_id,
            individual_id: item.individual_id,
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

        }))
}
#[endpoint(tags("Person - Master - Biodata"), status_codes(200, 400, 404, 500))]
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
            .ok_or_else(|| StatusError::not_found().brief("Biodata not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));
        active_model.updated_by = Set(auth_user_id(depot));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Biodata deleted successfully".to_string(),
        }))
}

#[endpoint(tags("Person - Master - Biodata"), status_codes(200, 500))]
pub async fn option_select(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<Vec<OptionItem>>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: BiodataOptionRequest = req
        .parse_json()
        .await
        .ok()
        .or_else(|| req.parse_queries().ok())
        .unwrap_or_default();

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());
    let mut is_scoped = false;

    if let Some(individual_id) = payload.individual_id {
        select = select.filter(entity_mod::Column::IndividualId.eq(individual_id));
        is_scoped = true;
    }

    if let Some(ref search) = payload.search {
        let search_trimmed = search.trim();
        if !search_trimmed.is_empty() {
            let individual_ids: Vec<Uuid> = individual_mod::Entity::find()
                .filter(individual_mod::Column::DeletedAt.is_null())
                .filter(individual_mod::Column::Name.contains(search_trimmed))
                .select_only()
                .column(individual_mod::Column::Id)
                .into_tuple()
                .all(db)
                .await
                .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

            select = select.filter(entity_mod::Column::IndividualId.is_in(individual_ids));
        }
    }

    // Unscoped requests are capped; slim-select narrows the list through `search`.
    if !is_scoped {
        select = select.limit(100);
    }

    let items = select
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let individual_names: HashMap<Uuid, String> = individual_mod::Entity::find()
        .filter(individual_mod::Column::Id.is_in(items.iter().map(|item| item.individual_id).collect::<Vec<_>>()))
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|m| (m.id, m.name))
        .collect();

    let mut data: Vec<OptionItem> = items
        .into_iter()
        .map(|item| OptionItem {
            id: item.id,
            name: [
                individual_names.get(&item.individual_id).cloned(),
            ]
            .into_iter()
            .flatten()
            .collect::<Vec<_>>()
            .join(" - "),
        })
        .collect();
    data.sort_by(|a, b| a.name.cmp(&b.name));

    Ok(Json(data))
}
