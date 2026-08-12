use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::{NaiveDate, NaiveDateTime, NaiveTime, DateTime, FixedOffset};


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct IndividualQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
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
