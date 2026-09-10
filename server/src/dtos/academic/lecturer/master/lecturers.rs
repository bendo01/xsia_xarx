use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct LecturerQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub individual_id: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct LecturerResponse {
    pub id: Uuid,
    pub code: String,
    pub name: Option<String>,
    pub individual_id: Uuid,
    pub institution_id: Option<Uuid>,
    pub alternative_code: Option<String>,
    pub accessor_number: Option<String>,
    pub identification_number: Option<String>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
    pub rank_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub nuptk: Option<String>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,

    // Belongs to relations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub individual: Option<Box<crate::dtos::person::master::individual::IndividualResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub institution: Option<crate::dtos::institution::master::institutions::InstitutionResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<crate::dtos::common::reference::ReferenceResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contract: Option<crate::dtos::common::reference::ReferenceResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rank: Option<crate::dtos::common::reference::ReferenceResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group: Option<crate::dtos::common::reference::ReferenceResponse>,

    // Has many relations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homebases: Option<Vec<crate::dtos::academic::lecturer::transaction::homebases::HomebaseResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub academic_ranks: Option<Vec<crate::dtos::academic::lecturer::transaction::academic_ranks::AcademicRankResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub academic_groups: Option<Vec<crate::dtos::academic::lecturer::transaction::academic_groups::AcademicGroupResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub teach_lecturers: Option<Vec<crate::dtos::academic::campaign::transaction::teach_lecturers::TeachLecturerResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub counsellors: Option<Vec<crate::dtos::academic::student::adviser::counsellors::CounsellorResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub advisers: Option<Vec<crate::dtos::academic::student::final_assignment::transaction::advisers::AdviserResponse>>,

    // Enriched fields for lecturer profile
    #[serde(skip_serializing_if = "Option::is_none")]
    pub assigned_teaches: Option<Vec<crate::dtos::academic::campaign::transaction::teaches::LecturerAssignedTeachResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rank_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub group_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status_name: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub contract_name: Option<String>,
}

impl Default for LecturerResponse {
    fn default() -> Self {
        Self {
            id: Uuid::nil(),
            code: String::new(),
            name: None,
            individual_id: Uuid::nil(),
            institution_id: None,
            alternative_code: None,
            accessor_number: None,
            identification_number: None,
            status_id: None,
            contract_id: None,
            rank_id: None,
            start_date: None,
            end_date: None,
            front_title: None,
            last_title: None,
            id_dosen: None,
            group_id: None,
            nuptk: None,
            created_at: None,
            updated_at: None,
            deleted_at: None,
            sync_at: None,
            created_by: None,
            updated_by: None,
            individual: None,
            institution: None,
            status: None,
            contract: None,
            rank: None,
            group: None,
            homebases: None,
            academic_ranks: None,
            academic_groups: None,
            teach_lecturers: None,
            counsellors: None,
            advisers: None,
            assigned_teaches: None,
            unit_name: None,
            rank_name: None,
            group_name: None,
            status_name: None,
            contract_name: None,
        }
    }
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateLecturerRequest {
    pub code: String,
    pub name: Option<String>,
    pub individual_id: Uuid,
    pub institution_id: Option<Uuid>,
    pub alternative_code: Option<String>,
    pub accessor_number: Option<String>,
    pub identification_number: Option<String>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
    pub rank_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateLecturerRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub individual_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub alternative_code: Option<String>,
    pub accessor_number: Option<String>,
    pub identification_number: Option<String>,
    pub status_id: Option<Uuid>,
    pub contract_id: Option<Uuid>,
    pub rank_id: Option<Uuid>,
    pub start_date: Option<NaiveDate>,
    pub end_date: Option<NaiveDate>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub group_id: Option<Uuid>,
    pub nuptk: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedLecturerResponse {
    pub data: Vec<LecturerResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
