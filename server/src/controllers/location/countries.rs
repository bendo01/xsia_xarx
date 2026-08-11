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
use crate::models::location::countries as countries_mod;

#[endpoint(tags("Location - Country"), status_codes(200, 500))]
pub async fn list_countries(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedCountryResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let query: CountryQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let mut select =
        countries_mod::Entity::find().filter(countries_mod::Column::DeletedAt.is_null());

    if let Some(val) = query.code {
        select = select.filter(countries_mod::Column::Code.eq(val));
    }
    if let Some(ref val) = query.name {
        select = select.filter(countries_mod::Column::Name.contains(val));
    }
    if let Some(val) = query.continent_id {
        select = select.filter(countries_mod::Column::ContinentId.eq(val));
    }
    if let Some(val) = query.region_id {
        select = select.filter(countries_mod::Column::RegionId.eq(val));
    }

    let paginator = select
        .order_by_asc(countries_mod::Column::Code)
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

    let data = items.into_iter().map(countries_to_response).collect();

    Ok(Json(PaginatedCountryResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Location - Country"), status_codes(200, 400, 404, 500))]
pub async fn get_country(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CountryResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let item = countries_mod::Entity::find_by_id(id)
        .filter(countries_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Country not found"))?;

    Ok(Json(countries_to_response(item)))
}

#[endpoint(tags("Location - Country"), status_codes(200, 400, 500))]
pub async fn create_country(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CountryResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let payload: CreateCountryRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let new_id = Uuid::new_v4();

    let active_model = countries_mod::ActiveModel {
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
        created_at: Set(Some(Utc::now().naive_utc())),
        updated_at: Set(Some(Utc::now().naive_utc())),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model
        .insert(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(countries_to_response(item)))
}

#[endpoint(tags("Location - Country"), status_codes(200, 400, 404, 500))]
pub async fn update_country(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<CountryResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let payload: UpdateCountryRequest = req
        .parse_json()
        .await
        .map_err(|e| StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e)))?;

    payload
        .validate()
        .map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = countries_mod::Entity::find_by_id(id)
        .filter(countries_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Country not found"))?;

    let mut active_model = existing.into_active_model();

    if let Some(val) = payload.code {
        active_model.code = Set(val.into());
    }
    if let Some(val) = payload.name {
        active_model.name = Set(val.into());
    }
    if let Some(val) = payload.alpha2_code {
        active_model.alpha2_code = Set(val.into());
    }
    if let Some(val) = payload.alpha3_code {
        active_model.alpha3_code = Set(val.into());
    }
    if let Some(val) = payload.iso3166_2_code {
        active_model.iso3166_2_code = Set(val.into());
    }
    if let Some(val) = payload.dikti_code {
        active_model.dikti_code = Set(val.into());
    }
    if let Some(val) = payload.continent_id {
        active_model.continent_id = Set(val.into());
    }
    if let Some(val) = payload.region_id {
        active_model.region_id = Set(val.into());
    }
    if let Some(val) = payload.slug {
        active_model.slug = Set(val.into());
    }
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    let item = active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(countries_to_response(item)))
}

#[endpoint(tags("Location - Country"), status_codes(200, 400, 404, 500))]
pub async fn delete_country(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<MessageResponse>, StatusError> {
    let db = depot
        .get_typed::<DatabaseConnection>()
        .map_err(|_| StatusError::internal_server_error().brief("Database connection missing"))?;

    let id = parse_uuid(req)?;

    let existing = countries_mod::Entity::find_by_id(id)
        .filter(countries_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Country not found"))?;

    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(Utc::now().naive_utc()));
    active_model.updated_at = Set(Some(Utc::now().naive_utc()));

    active_model
        .update(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Country deleted successfully".to_string(),
    }))
}

// Helpers
fn parse_uuid(req: &mut Request) -> Result<Uuid, StatusError> {
    let id_str = req
        .param::<String>("id")
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))
}

fn countries_to_response(item: countries_mod::Model) -> CountryResponse {
    CountryResponse {
        id: item.id,
        code: item.code,
        name: item.name,
        alpha2_code: item.alpha2_code,
        alpha3_code: item.alpha3_code,
        iso3166_2_code: item.iso3166_2_code,
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
    }
}
