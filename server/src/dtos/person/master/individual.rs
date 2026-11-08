use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct IndividualQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub search: Option<String>,
    pub sort_by: Option<String>,
    pub sort_dir: Option<String>,
    pub order_by: Option<String>,
    pub order_dir: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualResponse {
    pub id: Uuid,
    pub code: String,
    pub name: String,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub birth_date: NaiveDate,
    pub birth_place: String,
    pub gender_id: Uuid,
    pub religion_id: Uuid,
    pub occupation_id: Uuid,
    pub education_id: Uuid,
    pub income_id: Uuid,
    pub identification_type_id: Uuid,
    pub marital_status_id: Uuid,
    pub profession_id: Uuid,
    pub age_classification_id: Uuid,
    pub is_special_need: bool,
    pub is_social_protection_card_recipient: bool,
    pub is_deceased: bool,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub deleted_at: Option<DateTime<FixedOffset>>,
    pub sync_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateIndividualRequest {
    pub code: String,
    pub name: String,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub birth_date: NaiveDate,
    pub birth_place: String,
    pub gender_id: Uuid,
    pub religion_id: Uuid,
    pub occupation_id: Uuid,
    pub education_id: Uuid,
    pub income_id: Uuid,
    pub identification_type_id: Uuid,
    pub marital_status_id: Uuid,
    pub profession_id: Uuid,
    pub age_classification_id: Uuid,
    pub is_special_need: bool,
    pub is_social_protection_card_recipient: bool,
    pub is_deceased: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateIndividualRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub front_title: Option<String>,
    pub last_title: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub birth_place: Option<String>,
    pub gender_id: Option<Uuid>,
    pub religion_id: Option<Uuid>,
    pub occupation_id: Option<Uuid>,
    pub education_id: Option<Uuid>,
    pub income_id: Option<Uuid>,
    pub identification_type_id: Option<Uuid>,
    pub marital_status_id: Option<Uuid>,
    pub profession_id: Option<Uuid>,
    pub age_classification_id: Option<Uuid>,
    pub is_special_need: Option<bool>,
    pub is_social_protection_card_recipient: Option<bool>,
    pub is_deceased: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedIndividualResponse {
    pub data: Vec<IndividualResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualDetailResponse {
    #[serde(flatten)]
    pub individual: IndividualResponse,
    pub gender: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub religion: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub occupation: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub income: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub identification_type: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub marital_status: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub profession: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub education: Option<crate::dtos::literate::educations::EducationResponse>,
    pub age_classification: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub biodata: Option<crate::dtos::person::master::biodata::BiodataResponse>,
    pub user: Option<crate::dtos::auth::user::UserResponse>,
    pub lecturer: Option<crate::dtos::academic::lecturer::master::lecturers::LecturerResponse>,
    pub employees: Vec<crate::dtos::institution::master::employees::EmployeeResponse>,
    pub candidates: Vec<crate::dtos::academic::candidate::master::candidates::CandidateResponse>,
    pub evaluators: Vec<crate::dtos::academic::prior_learning_recognition::transaction::evaluators::EvaluatorResponse>,
    pub students: Vec<crate::dtos::academic::student::master::students::StudentResponse>,
    pub phones: Vec<IndividualContactItem>,
    pub electronic_mails: Vec<IndividualContactItem>,
    pub residences: Vec<IndividualResidenceItem>,
    pub family_cards: Vec<IndividualFamilyCardItem>,
}

/// Phone number or e-mail address with its human-readable type.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualContactItem {
    pub id: Uuid,
    pub value: String,
    pub type_name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualResidenceItem {
    pub id: Uuid,
    pub street: String,
    pub citizens_association: i32,
    pub neighborhood_association: i32,
    pub residence_type_name: Option<String>,
    pub province_name: Option<String>,
    pub regency_name: Option<String>,
    pub sub_district_name: Option<String>,
    pub village_name: Option<String>,
    pub latitude: Option<f64>,
    pub longitude: Option<f64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualFamilyCardMemberItem {
    pub id: Uuid,
    pub individual_id: Uuid,
    pub individual_name: Option<String>,
    pub relative_id: Uuid,
    pub relative_name: Option<String>,
    pub relative_type_name: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualFamilyCardItem {
    pub id: Uuid,
    pub code: Option<String>,
    pub head_individual_id: Option<Uuid>,
    pub head_name: Option<String>,
    pub members: Vec<IndividualFamilyCardMemberItem>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualStatisticItem {
    pub name: String,
    pub count: i64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualStatisticDistribution {
    pub key: String,
    pub label: String,
    pub items: Vec<IndividualStatisticItem>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct IndividualStatisticsResponse {
    pub total: i64,
    pub deceased: i64,
    pub special_need: i64,
    pub social_protection_card_recipient: i64,
    pub distributions: Vec<IndividualStatisticDistribution>,
    pub age_groups: Vec<IndividualStatisticItem>,
}
