use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::feeder::master::bidang_minat_perguruan_tinggi::{
    CreateBidangMinatPerguruanTinggiRequest, BidangMinatPerguruanTinggiQuery, BidangMinatPerguruanTinggiResponse, PaginatedBidangMinatPerguruanTinggiResponse,
    UpdateBidangMinatPerguruanTinggiRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::feeder::master::bidang_minat_perguruan_tinggi as entity_mod;

#[endpoint(tags("Feeder - Master - BidangMinatPerguruanTinggi"), status_codes(200, 500))]
pub async fn list_bidang_minat_perguruan_tinggi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedBidangMinatPerguruanTinggiResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: BidangMinatPerguruanTinggiQuery = req.parse_queries().unwrap_or_default();
    let page = query.page.unwrap_or(1);
    let page_size = query.page_size.unwrap_or(10);

    let select = entity_mod::Entity::find().filter(entity_mod::Column::DeletedAt.is_null());

    let paginator = select
        .order_by_asc(entity_mod::Column::Id)
        .paginate(db, page_size);

    let total = paginator.num_items().await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;
    let total_pages = (total as f64 / page_size as f64).ceil() as u64;

    let items = paginator.fetch_page(page.saturating_sub(1)).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let data = items.into_iter().map(|item| BidangMinatPerguruanTinggiResponse {
            id: item.id,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            smt_dimulai: item.smt_dimulai,
            sk_bidang_minat: item.sk_bidang_minat,
            tamat_sk_bidang_minat: item.tamat_sk_bidang_minat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedBidangMinatPerguruanTinggiResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Feeder - Master - BidangMinatPerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn get_bidang_minat_perguruan_tinggi(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<BidangMinatPerguruanTinggiResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("BidangMinatPerguruanTinggi not found"))?;

    Ok(Json(BidangMinatPerguruanTinggiResponse {
            id: item.id,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            smt_dimulai: item.smt_dimulai,
            sk_bidang_minat: item.sk_bidang_minat,
            tamat_sk_bidang_minat: item.tamat_sk_bidang_minat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}#[endpoint(tags("Feeder - Master - BidangMinatPerguruanTinggi"), status_codes(200, 400, 500))]
pub async fn create_bidang_minat_perguruan_tinggi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BidangMinatPerguruanTinggiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateBidangMinatPerguruanTinggiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        id_bidang_minat: Set(payload.id_bidang_minat),
        nm_bidang_minat: Set(payload.nm_bidang_minat),
        id_prodi: Set(payload.id_prodi),
        nama_program_studi: Set(payload.nama_program_studi),
        smt_dimulai: Set(payload.smt_dimulai),
        sk_bidang_minat: Set(payload.sk_bidang_minat),
        tamat_sk_bidang_minat: Set(payload.tamat_sk_bidang_minat),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BidangMinatPerguruanTinggiResponse {
            id: item.id,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            smt_dimulai: item.smt_dimulai,
            sk_bidang_minat: item.sk_bidang_minat,
            tamat_sk_bidang_minat: item.tamat_sk_bidang_minat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}

#[endpoint(tags("Feeder - Master - BidangMinatPerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn update_bidang_minat_perguruan_tinggi(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<BidangMinatPerguruanTinggiResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateBidangMinatPerguruanTinggiRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("BidangMinatPerguruanTinggi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(id_bidang_minat) = payload.id_bidang_minat {
            active_model.id_bidang_minat = Set(Some(id_bidang_minat));
        }
    if let Some(nm_bidang_minat) = payload.nm_bidang_minat {
            active_model.nm_bidang_minat = Set(Some(nm_bidang_minat));
        }
    if let Some(id_prodi) = payload.id_prodi {
            active_model.id_prodi = Set(Some(id_prodi));
        }
    if let Some(nama_program_studi) = payload.nama_program_studi {
            active_model.nama_program_studi = Set(Some(nama_program_studi));
        }
    if let Some(smt_dimulai) = payload.smt_dimulai {
            active_model.smt_dimulai = Set(Some(smt_dimulai));
        }
    if let Some(sk_bidang_minat) = payload.sk_bidang_minat {
            active_model.sk_bidang_minat = Set(Some(sk_bidang_minat));
        }
    if let Some(tamat_sk_bidang_minat) = payload.tamat_sk_bidang_minat {
            active_model.tamat_sk_bidang_minat = Set(Some(tamat_sk_bidang_minat));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(BidangMinatPerguruanTinggiResponse {
            id: item.id,
            id_bidang_minat: item.id_bidang_minat,
            nm_bidang_minat: item.nm_bidang_minat,
            id_prodi: item.id_prodi,
            nama_program_studi: item.nama_program_studi,
            smt_dimulai: item.smt_dimulai,
            sk_bidang_minat: item.sk_bidang_minat,
            tamat_sk_bidang_minat: item.tamat_sk_bidang_minat,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

        }))
}
#[endpoint(tags("Feeder - Master - BidangMinatPerguruanTinggi"), status_codes(200, 400, 404, 500))]
pub async fn delete_bidang_minat_perguruan_tinggi(
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
            .ok_or_else(|| StatusError::not_found().brief("BidangMinatPerguruanTinggi not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "BidangMinatPerguruanTinggi deleted successfully".to_string(),
        }))
}
