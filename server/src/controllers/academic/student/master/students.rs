use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::academic::student::master::students::{
    CreateStudentRequest, StudentQuery, StudentResponse, PaginatedStudentResponse,
    UpdateStudentRequest,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::academic::student::master::students as entity_mod;

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 500))]
pub async fn list_students(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedStudentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: StudentQuery = req.parse_queries().unwrap_or_default();
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

    let data = items.into_iter().map(|item| StudentResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            selection_type_id: item.selection_type_id,
            registered: item.registered,
            individual_id: item.individual_id,
            status_id: item.status_id,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            registration_id: item.registration_id,
            nisn: item.nisn,
            resign_status_id: item.resign_status_id,
            concentration_id: item.concentration_id,
            curriculum_id: item.curriculum_id,
            class_code_id: item.class_code_id,
            transfer_code: item.transfer_code,
            transfer_unit_id: item.transfer_unit_id,
            id_mahasiswa: item.id_mahasiswa,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            finance_fee: item.finance_fee,
            finance_id: item.finance_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }).collect();

    Ok(Json(PaginatedStudentResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 404, 500))]
pub async fn get_student(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

    Ok(Json(StudentResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            selection_type_id: item.selection_type_id,
            registered: item.registered,
            individual_id: item.individual_id,
            status_id: item.status_id,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            registration_id: item.registration_id,
            nisn: item.nisn,
            resign_status_id: item.resign_status_id,
            concentration_id: item.concentration_id,
            curriculum_id: item.curriculum_id,
            class_code_id: item.class_code_id,
            transfer_code: item.transfer_code,
            transfer_unit_id: item.transfer_unit_id,
            id_mahasiswa: item.id_mahasiswa,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            finance_fee: item.finance_fee,
            finance_id: item.finance_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 500))]
pub async fn create_student(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let payload: CreateStudentRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let now = Utc::now().naive_utc();
    let new_id = Uuid::new_v4();

    let active_model = entity_mod::ActiveModel {
        id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        selection_type_id: Set(payload.selection_type_id),
        registered: Set(payload.registered),
        individual_id: Set(payload.individual_id),
        status_id: Set(payload.status_id),
        unit_id: Set(payload.unit_id),
        academic_year_id: Set(payload.academic_year_id),
        registration_id: Set(payload.registration_id),
        nisn: Set(payload.nisn),
        resign_status_id: Set(payload.resign_status_id),
        concentration_id: Set(payload.concentration_id),
        curriculum_id: Set(payload.curriculum_id),
        class_code_id: Set(payload.class_code_id),
        transfer_code: Set(payload.transfer_code),
        transfer_unit_id: Set(payload.transfer_unit_id),
        id_mahasiswa: Set(payload.id_mahasiswa),
        id_registrasi_mahasiswa: Set(payload.id_registrasi_mahasiswa),
        finance_fee: Set(payload.finance_fee),
        finance_id: Set(payload.finance_id),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        deleted_at: Set(None),
        sync_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

    let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(StudentResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            selection_type_id: item.selection_type_id,
            registered: item.registered,
            individual_id: item.individual_id,
            status_id: item.status_id,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            registration_id: item.registration_id,
            nisn: item.nisn,
            resign_status_id: item.resign_status_id,
            concentration_id: item.concentration_id,
            curriculum_id: item.curriculum_id,
            class_code_id: item.class_code_id,
            transfer_code: item.transfer_code,
            transfer_unit_id: item.transfer_unit_id,
            id_mahasiswa: item.id_mahasiswa,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            finance_fee: item.finance_fee,
            finance_id: item.finance_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 404, 500))]
pub async fn update_student(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<StudentResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
    let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let payload: UpdateStudentRequest = req.parse_json().await.map_err(|e| {
        StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
    })?;

    payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

    let existing = entity_mod::Entity::find_by_id(id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
        active_model.code = Set(code);
    }
    if let Some(name) = payload.name {
        active_model.name = Set(name);
    }
    if let Some(selection_type_id) = payload.selection_type_id {
        active_model.selection_type_id = Set(selection_type_id);
    }
    if let Some(registered) = payload.registered {
        active_model.registered = Set(registered);
    }
    if let Some(individual_id) = payload.individual_id {
        active_model.individual_id = Set(individual_id);
    }
    if let Some(status_id) = payload.status_id {
        active_model.status_id = Set(status_id);
    }
    if let Some(unit_id) = payload.unit_id {
        active_model.unit_id = Set(unit_id);
    }
    if let Some(academic_year_id) = payload.academic_year_id {
        active_model.academic_year_id = Set(academic_year_id);
    }
    if let Some(registration_id) = payload.registration_id {
        active_model.registration_id = Set(registration_id);
    }
    if let Some(nisn) = payload.nisn {
        active_model.nisn = Set(Some(nisn));
    }
    if let Some(resign_status_id) = payload.resign_status_id {
        active_model.resign_status_id = Set(resign_status_id);
    }
    if let Some(concentration_id) = payload.concentration_id {
        active_model.concentration_id = Set(concentration_id);
    }
    if let Some(curriculum_id) = payload.curriculum_id {
        active_model.curriculum_id = Set(curriculum_id);
    }
    if let Some(class_code_id) = payload.class_code_id {
        active_model.class_code_id = Set(class_code_id);
    }
    if let Some(transfer_code) = payload.transfer_code {
        active_model.transfer_code = Set(Some(transfer_code));
    }
    if let Some(transfer_unit_id) = payload.transfer_unit_id {
        active_model.transfer_unit_id = Set(transfer_unit_id);
    }
    if let Some(id_mahasiswa) = payload.id_mahasiswa {
        active_model.id_mahasiswa = Set(Some(id_mahasiswa));
    }
    if let Some(id_registrasi_mahasiswa) = payload.id_registrasi_mahasiswa {
        active_model.id_registrasi_mahasiswa = Set(Some(id_registrasi_mahasiswa));
    }
    if let Some(finance_fee) = payload.finance_fee {
        active_model.finance_fee = Set(Some(finance_fee));
    }
    if let Some(finance_id) = payload.finance_id {
        active_model.finance_id = Set(Some(finance_id));
    }
    active_model.updated_at = Set(Some(now));

    let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(StudentResponse {
            id: item.id,
            code: item.code.clone(),
            name: item.name.clone(),
            selection_type_id: item.selection_type_id,
            registered: item.registered,
            individual_id: item.individual_id,
            status_id: item.status_id,
            unit_id: item.unit_id,
            academic_year_id: item.academic_year_id,
            registration_id: item.registration_id,
            nisn: item.nisn,
            resign_status_id: item.resign_status_id,
            concentration_id: item.concentration_id,
            curriculum_id: item.curriculum_id,
            class_code_id: item.class_code_id,
            transfer_code: item.transfer_code,
            transfer_unit_id: item.transfer_unit_id,
            id_mahasiswa: item.id_mahasiswa,
            id_registrasi_mahasiswa: item.id_registrasi_mahasiswa,
            finance_fee: item.finance_fee,
            finance_id: item.finance_id,
            created_at: item.created_at,
            updated_at: item.updated_at,
            deleted_at: item.deleted_at,
            sync_at: item.sync_at,
            created_by: item.created_by,
            updated_by: item.updated_by,

    }))
}

#[endpoint(tags("Academic - Student - Master - Student"), status_codes(200, 400, 404, 500))]
pub async fn delete_student(
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
        .ok_or_else(|| StatusError::not_found().brief("Student not found"))?;

    let now = Utc::now().naive_utc();
    let mut active_model = existing.into_active_model();
    active_model.deleted_at = Set(Some(now));
    active_model.updated_at = Set(Some(now));

    active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(Json(MessageResponse {
        message: "Student deleted successfully".to_string(),
    }))
}
