use std::collections::HashMap;
use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};

use sea_orm::{ColumnTrait, DatabaseConnection, EntityTrait, QueryFilter, QueryOrder};

pub async fn list_students_by_unit(
    db: &DatabaseConnection,
    unit_id: Uuid,
) -> Result<Vec<StudentResponse>, sea_orm::DbErr> {
    let items = crate::models::academic::student::master::students::Entity::find()
        .filter(crate::models::academic::student::master::students::Column::UnitId.eq(unit_id))
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .order_by_asc(crate::models::academic::student::master::students::Column::Code)
        .all(db)
        .await?;

    // Collect relation IDs
    let status_ids: Vec<Uuid> = items.iter().map(|i| i.status_id).filter(|id| *id != Uuid::nil()).collect();
    let academic_year_ids: Vec<Uuid> = items.iter().map(|i| i.academic_year_id).filter(|id| *id != Uuid::nil()).collect();
    let curriculum_ids: Vec<Uuid> = items.iter().map(|i| i.curriculum_id).filter(|id| *id != Uuid::nil()).collect();
    let selection_type_ids: Vec<Uuid> = items.iter().map(|i| i.selection_type_id).filter(|id| *id != Uuid::nil()).collect();

    // Batch load unit info
    let unit_info = crate::models::institution::master::units::Entity::find_by_id(unit_id)
        .filter(crate::models::institution::master::units::Column::DeletedAt.is_null())
        .one(db)
        .await?;
    let unit_name = unit_info.as_ref().and_then(|u| u.name.clone());
    let unit_code = unit_info.as_ref().and_then(|u| u.code.clone());

    let statuses_map: HashMap<Uuid, String> = if status_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::statuses::Entity::find()
            .filter(crate::models::academic::student::reference::statuses::Column::Id.is_in(status_ids))
            .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
            .all(db)
            .await?
            .into_iter()
            .map(|s| (s.id, s.name))
            .collect()
    };

    let academic_years_map: HashMap<Uuid, String> = if academic_year_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::general::reference::academic_years::Entity::find()
            .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(academic_year_ids))
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .all(db)
            .await?
            .into_iter()
            .map(|a| (a.id, a.name))
            .collect()
    };

    let curriculums_map: HashMap<Uuid, String> = if curriculum_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::course::master::curriculums::Entity::find()
            .filter(crate::models::academic::course::master::curriculums::Column::Id.is_in(curriculum_ids))
            .filter(crate::models::academic::course::master::curriculums::Column::DeletedAt.is_null())
            .all(db)
            .await?
            .into_iter()
            .map(|c| (c.id, c.name))
            .collect()
    };

    let selection_types_map: HashMap<Uuid, String> = if selection_type_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::selection_types::Entity::find()
            .filter(crate::models::academic::student::reference::selection_types::Column::Id.is_in(selection_type_ids))
            .filter(crate::models::academic::student::reference::selection_types::Column::DeletedAt.is_null())
            .all(db)
            .await?
            .into_iter()
            .map(|st| (st.id, st.name))
            .collect()
    };

    let data = items
        .into_iter()
        .map(|item| StudentResponse {
            id: item.id,
            code: item.code,
            name: item.name,
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
            unit_name: unit_name.clone(),
            unit_code: unit_code.clone(),
            status_name: statuses_map.get(&item.status_id).cloned(),
            academic_year_name: academic_years_map.get(&item.academic_year_id).cloned(),
            curriculum_name: curriculums_map.get(&item.curriculum_id).cloned(),
            selection_type_name: selection_types_map.get(&item.selection_type_id).cloned(),
        })
        .collect();

    Ok(data)
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct StudentQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub individual_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub status_id: Option<Uuid>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
    pub order_by: Option<String>,
    pub order_dir: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct StudentResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub selection_type_id: Uuid,
    pub registered: NaiveDate,
    pub individual_id: Uuid,
    pub status_id: Uuid,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub registration_id: Uuid,
    pub nisn: Option<String>,
    pub resign_status_id: Uuid,
    pub concentration_id: Uuid,
    pub curriculum_id: Uuid,
    pub class_code_id: Uuid,
    pub transfer_code: Option<String>,
    pub transfer_unit_id: Uuid,
    pub id_mahasiswa: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub finance_fee: Option<f64>,
    pub finance_id: Option<Uuid>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
    pub unit_name: Option<String>,
    pub unit_code: Option<String>,
    pub status_name: Option<String>,
    pub academic_year_name: Option<String>,
    pub curriculum_name: Option<String>,
    pub selection_type_name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateStudentRequest {
    pub code: String,
    pub name: String,
    pub selection_type_id: Uuid,
    pub registered: NaiveDate,
    pub individual_id: Uuid,
    pub status_id: Uuid,
    pub unit_id: Uuid,
    pub academic_year_id: Uuid,
    pub registration_id: Uuid,
    pub nisn: Option<String>,
    pub resign_status_id: Uuid,
    pub concentration_id: Uuid,
    pub curriculum_id: Uuid,
    pub class_code_id: Uuid,
    pub transfer_code: Option<String>,
    pub transfer_unit_id: Uuid,
    pub id_mahasiswa: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub finance_fee: Option<f64>,
    pub finance_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateStudentRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub selection_type_id: Option<Uuid>,
    pub registered: Option<NaiveDate>,
    pub individual_id: Option<Uuid>,
    pub status_id: Option<Uuid>,
    pub unit_id: Option<Uuid>,
    pub academic_year_id: Option<Uuid>,
    pub registration_id: Option<Uuid>,
    pub nisn: Option<String>,
    pub resign_status_id: Option<Uuid>,
    pub concentration_id: Option<Uuid>,
    pub curriculum_id: Option<Uuid>,
    pub class_code_id: Option<Uuid>,
    pub transfer_code: Option<String>,
    pub transfer_unit_id: Option<Uuid>,
    pub id_mahasiswa: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub finance_fee: Option<f64>,
    pub finance_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedStudentResponse {
    pub data: Vec<StudentResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct DistinctAcademicYearQuery {
    pub unit_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct DistinctAcademicYearResponse {
    pub id: Uuid,
    pub code: i32,
    pub year: i32,
    pub name: String,
    pub feeder_name: Option<String>,
    pub is_active: Option<bool>,
}
