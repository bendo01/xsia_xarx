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

/// Aggregated dashboard response for the unit show page.
/// Bundles unit details, related entities, and reference lookups into a single response
/// so the client can load everything in one request instead of 5+ paginated calls.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UnitDashboardResponse {
    /// The unit record with belongs-to relations (education, institution, parent, unit_type)
    pub unit: UnitResponse,
    /// All courses belonging to this unit (unpaginated)
    pub courses: Vec<crate::dtos::academic::course::master::courses::CourseResponse>,
    /// All curriculums belonging to this unit (unpaginated)
    pub curriculums: Vec<crate::dtos::academic::course::master::curriculums::CurriculumResponse>,
    /// All students belonging to this unit (unpaginated, with enriched status/academic_year names)
    pub students: Vec<crate::dtos::academic::student::master::students::StudentResponse>,
    /// All staff belonging to this unit (unpaginated)
    pub staffes: Vec<crate::dtos::institution::master::staffes::StaffResponse>,
    /// Employees map keyed by employee_id for enriching staff on the client
    pub employees: Vec<crate::dtos::institution::master::employees::EmployeeResponse>,
    /// All position types reference data (replaces paginated position-type call)
    pub position_types: Vec<crate::dtos::common::reference::ReferenceResponse>,
    /// All course variety reference data (replaces paginated varieties call)
    pub course_varieties: Vec<crate::dtos::common::reference::ReferenceResponse>,
    /// All course group reference data (replaces paginated groups call)
    pub course_groups: Vec<crate::dtos::common::reference::ReferenceResponse>,
    /// Optional precomputed student academic year trend chart data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub student_yearly_trend: Option<UnitStudentAcademicYearChartResponse>,
    /// Optional precomputed course category distribution pie chart data
    #[serde(skip_serializing_if = "Option::is_none")]
    pub course_category_distribution: Option<UnitCourseCategoryDistributionResponse>,
}

/// Detailed cohort item for student academic year status trend chart.
/// Maps directly to the StudentStatusByYear interface expected by StudentAcademicYearChart.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct StudentStatusByYearResponse {
    #[serde(alias = "year_name")]
    pub year_name: String,
    pub total: i64,
    pub active: i64,
    pub leave: i64,
    pub graduated: i64,
    pub other: i64,
}

/// Descriptive response for student academic year status trend chart based on unit_id.
/// Meets all data needs for StudentAcademicYearChart in show.tsx:L913-L916,
/// providing unit metadata, high-level summary counts, and the detailed data array.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct UnitStudentAcademicYearChartResponse {
    #[serde(alias = "unit_id")]
    pub unit_id: Uuid,
    #[serde(alias = "unit_name")]
    pub unit_name: String,
    #[serde(skip_serializing_if = "Option::is_none", alias = "unit_code")]
    pub unit_code: Option<String>,
    #[serde(alias = "total_students")]
    pub total_students: i64,
    #[serde(alias = "total_active")]
    pub total_active: i64,
    #[serde(alias = "total_leave")]
    pub total_leave: i64,
    #[serde(alias = "total_graduated")]
    pub total_graduated: i64,
    #[serde(alias = "total_other")]
    pub total_other: i64,
    /// Detailed cohorts by academic year for data={studentYearlyTrend()}
    pub data: Vec<StudentStatusByYearResponse>,
    /// Alias field for consumers accessing .trends
    pub trends: Vec<StudentStatusByYearResponse>,
}

/// Item representing a course category slice in the distribution pie/donut chart.
/// Maps directly to CourseCategoryItem expected by CourseCategoryPieChart.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct CourseCategoryItemResponse {
    pub name: String,
    pub count: i64,
    pub credits: f64,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub color: Option<String>,
    pub percentage: f64,
}

/// Descriptive response for course category distribution pie chart based on unit_id.
/// Meets all data needs for CourseCategoryPieChart in show.tsx:L919-L922,
/// providing unit metadata, total course count, total SKS credits, and category slice breakdown.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
#[serde(rename_all = "camelCase")]
pub struct UnitCourseCategoryDistributionResponse {
    #[serde(alias = "unit_id")]
    pub unit_id: Uuid,
    #[serde(alias = "unit_name")]
    pub unit_name: String,
    #[serde(skip_serializing_if = "Option::is_none", alias = "unit_code")]
    pub unit_code: Option<String>,
    #[serde(alias = "total_courses")]
    pub total_courses: i64,
    #[serde(alias = "total_credits")]
    pub total_credits: f64,
    /// Detailed course categories distribution for data={courseCategoryDistribution()}
    pub data: Vec<CourseCategoryItemResponse>,
    /// Alias field for consumers accessing .categories
    pub categories: Vec<CourseCategoryItemResponse>,
}
