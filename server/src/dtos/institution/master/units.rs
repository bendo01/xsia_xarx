use serde::{Deserialize, Serialize};
use salvo::oapi::ToSchema;
use uuid::Uuid;
use validator::Validate;
use chrono::NaiveDateTime;


#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitQuery {
    pub page: Option<u64>,
    pub page_size: Option<u64>,
    pub name: Option<String>,
    pub code: Option<String>,
    pub with_relations: Option<bool>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitResponse {
    pub id: Uuid,
    pub code: Option<String>,
    pub name: Option<String>,
    pub is_active: bool,
    pub unit_type_id: Uuid,
    pub institution_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub education_id: Uuid,
    pub feeder_id: Option<Uuid>,
    pub lft: Option<i64>,
    pub rght: Option<i64>,
    pub created_at: Option<NaiveDateTime>,
    pub updated_at: Option<NaiveDateTime>,
    pub sync_at: Option<NaiveDateTime>,
    pub deleted_at: Option<NaiveDateTime>,
    pub created_by: Option<Uuid>,
    pub updated_by: Option<Uuid>,

    // Belongs to relations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub unit_type: Option<crate::dtos::common::reference::ReferenceResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub institution: Option<crate::dtos::institution::master::institutions::InstitutionResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub education: Option<crate::dtos::literate::educations::EducationResponse>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub parent: Option<Box<UnitResponse>>,

    // Has many relations
    #[serde(skip_serializing_if = "Option::is_none")]
    pub staffes: Option<Vec<crate::dtos::institution::master::staffes::StaffResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub courses: Option<Vec<crate::dtos::academic::course::master::courses::CourseResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub curriculums: Option<Vec<crate::dtos::academic::course::master::curriculums::CurriculumResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub students: Option<Vec<crate::dtos::academic::student::master::students::StudentResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub rooms: Option<Vec<crate::dtos::building::master::rooms::RoomResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub activities: Option<Vec<crate::dtos::academic::campaign::transaction::activities::ActivityResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub class_codes: Option<Vec<crate::dtos::academic::campaign::transaction::class_codes::ClassCodeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub grades: Option<Vec<crate::dtos::academic::campaign::transaction::grades::GradeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub concentrations: Option<Vec<crate::dtos::academic::course::master::concentrations::ConcentrationResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub homebases: Option<Vec<crate::dtos::academic::lecturer::transaction::homebases::HomebaseResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub recognitions: Option<Vec<crate::dtos::academic::prior_learning_recognition::transaction::recognitions::RecognitionResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub decrees: Option<Vec<crate::dtos::academic::student::adviser::decrees::DecreeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub student_activities: Option<Vec<crate::dtos::academic::student::campaign::student_activities::StudentActivityResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub final_assignment_decrees: Option<Vec<crate::dtos::academic::student::final_assignment::transaction::final_assignment_decrees::FinalAssignmentDecreeResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub candidate_unit: Option<Vec<crate::dtos::academic::candidate::master::candidate_unit::CandidateUnitResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub candidate_unit_choices: Option<Vec<crate::dtos::academic::candidate::transaction::candidate_unit_choices::CandidateUnitChoiceResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub registration_types: Option<Vec<crate::dtos::common::reference::ReferenceResponse>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bundles: Option<Vec<crate::dtos::academic::survey::master::bundles::BundleResponse>>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct CreateUnitRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub is_active: bool,
    pub unit_type_id: Uuid,
    pub institution_id: Uuid,
    pub parent_id: Option<Uuid>,
    pub education_id: Uuid,
    pub feeder_id: Option<Uuid>,
    pub lft: Option<i64>,
    pub rght: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Validate)]
pub struct UpdateUnitRequest {
    pub code: Option<String>,
    pub name: Option<String>,
    pub is_active: Option<bool>,
    pub unit_type_id: Option<Uuid>,
    pub institution_id: Option<Uuid>,
    pub parent_id: Option<Uuid>,
    pub education_id: Option<Uuid>,
    pub feeder_id: Option<Uuid>,
    pub lft: Option<i64>,
    pub rght: Option<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct PaginatedUnitResponse {
    pub data: Vec<UnitResponse>,
    pub total: u64,
    pub page: u64,
    pub page_size: u64,
    pub total_pages: u64,
}
