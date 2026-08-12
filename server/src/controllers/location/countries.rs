use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::location::countries::{
    CreateCountryRequest, CountryQuery, CountryResponse, PaginatedCountryResponse,
    UpdateCountryRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::location::countries as entity_mod;

#[endpoint(tags("Location -  - Country"), status_codes(200, 500))]
pub async fn list_countries(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCountryResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: CountryQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    if let Some(ref name) = query.name {
        select = select.filter(entity_mod::Column::Name.contains(name));
    }

    if let Some(code) = query.code {
        select = select.filter(entity_mod::Column::Code.eq(code));
    }

    let paginator = select
        .order_by_asc(entity_mod::Column::Name)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| CountryResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            alpha2_code: item.alpha2_code.clone(),
            alpha3_code: item.alpha3_code.clone(),
            iso3166_2_code: item.iso3166_2_code.clone(),
            dikti_code: item.dikti_code,
            continent_id: item.continent_id,
            region_id: item.region_id,
            slug: item.slug,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedCountryResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Location -  - Country"), status_codes(200, 400, 404, 500))]
pub async fn get_countrie(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CountryResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Country not found"))?;

    Ok(Json(CountryResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            alpha2_code: item.alpha2_code.clone(),
            alpha3_code: item.alpha3_code.clone(),
            iso3166_2_code: item.iso3166_2_code.clone(),
            dikti_code: item.dikti_code,
            continent_id: item.continent_id,
            region_id: item.region_id,
            slug: item.slug,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Location -  - Country"), status_codes(200, 400, 500))]
pub async fn create_countrie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CountryResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateCountryRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        alpha2_code: Set(payload.alpha2_code),
        alpha3_code: Set(payload.alpha3_code),
        iso3166_2_code: Set(payload.iso3166_2_code),
        dikti_code: Set(payload.dikti_code),
        continent_id: Set(payload.continent_id),
        region_id: Set(payload.region_id),
        slug: Set(payload.slug),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CountryResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            alpha2_code: item.alpha2_code.clone(),
            alpha3_code: item.alpha3_code.clone(),
            iso3166_2_code: item.iso3166_2_code.clone(),
            dikti_code: item.dikti_code,
            continent_id: item.continent_id,
            region_id: item.region_id,
            slug: item.slug,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Location -  - Country"), status_codes(200, 400, 404, 500))]
pub async fn update_countrie(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<CountryResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateCountryRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Country not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(code);
        }
    if let Some(name) = payload.name {
            active_model.name = Set(name);
        }
    if let Some(alpha2_code) = payload.alpha2_code {
            active_model.alpha2_code = Set(alpha2_code);
        }
    if let Some(alpha3_code) = payload.alpha3_code {
            active_model.alpha3_code = Set(alpha3_code);
        }
    if let Some(iso3166_2_code) = payload.iso3166_2_code {
            active_model.iso3166_2_code = Set(iso3166_2_code);
        }
    if let Some(dikti_code) = payload.dikti_code {
            active_model.dikti_code = Set(Some(dikti_code));
        }
    if let Some(continent_id) = payload.continent_id {
            active_model.continent_id = Set(Some(continent_id));
        }
    if let Some(region_id) = payload.region_id {
            active_model.region_id = Set(Some(region_id));
        }
    if let Some(slug) = payload.slug {
            active_model.slug = Set(Some(slug));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(CountryResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            alpha2_code: item.alpha2_code.clone(),
            alpha3_code: item.alpha3_code.clone(),
            iso3166_2_code: item.iso3166_2_code.clone(),
            dikti_code: item.dikti_code,
            continent_id: item.continent_id,
            region_id: item.region_id,
            slug: item.slug,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Location -  - Country"), status_codes(200, 400, 404, 500))]
pub async fn delete_countrie(
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
            .ok_or_else(|| StatusError::not_found().brief("Country not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Country deleted successfully".to_string(),
        }))
}
