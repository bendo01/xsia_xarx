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

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitDashboardMatakuliah {
    pub total_matakuliah: i64,
    pub total_credit: f64,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ChartTooltip {
    pub trigger: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ChartLegend {
    pub data: Vec<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ChartGrid {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub left: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub right: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub bottom: Option<String>,
    #[serde(rename = "containLabel")]
    pub contain_label: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ChartXAxisCategory {
    #[serde(rename = "type")]
    pub axis_type: String,
    #[serde(rename = "boundaryGap")]
    pub boundary_gap: bool,
    pub data: Vec<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ChartYAxisValue {
    #[serde(rename = "type")]
    pub axis_type: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct ChartLineSeriesItem {
    pub name: String,
    #[serde(rename = "type")]
    pub series_type: String,
    pub data: Vec<i64>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitDashboardAcademicYearChart {
    pub tooltip: ChartTooltip,
    pub legend: ChartLegend,
    pub grid: ChartGrid,
    #[serde(rename = "xAxis")]
    pub x_axis: ChartXAxisCategory,
    #[serde(rename = "yAxis")]
    pub y_axis: ChartYAxisValue,
    pub series: Vec<ChartLineSeriesItem>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieLegend {
    pub top: String,
    pub left: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieItemStyle {
    #[serde(rename = "borderRadius")]
    pub border_radius: i32,
    #[serde(rename = "borderColor")]
    pub border_color: String,
    #[serde(rename = "borderWidth")]
    pub border_width: i32,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieLabel {
    pub show: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub position: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "fontSize")]
    pub font_size: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none", rename = "fontWeight")]
    pub font_weight: Option<String>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieEmphasis {
    pub label: PieLabel,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieLabelLine {
    pub show: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieDataItem {
    pub value: i64,
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct PieSeriesItem {
    pub name: String,
    #[serde(rename = "type")]
    pub series_type: String,
    pub radius: Vec<String>,
    #[serde(rename = "avoidLabelOverlap")]
    pub avoid_label_overlap: bool,
    #[serde(rename = "itemStyle")]
    pub item_style: PieItemStyle,
    pub label: PieLabel,
    pub emphasis: PieEmphasis,
    #[serde(rename = "labelLine")]
    pub label_line: PieLabelLine,
    pub data: Vec<PieDataItem>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitDashboardCourseCategoryDistribution {
    pub tooltip: ChartTooltip,
    pub legend: PieLegend,
    pub series: Vec<PieSeriesItem>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RegencyDataset {
    pub source: Vec<Vec<serde_json::Value>>,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RegencyGrid {
    #[serde(rename = "containLabel")]
    pub contain_label: bool,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RegencyXAxis {
    pub name: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct RegencyYAxis {
    #[serde(rename = "type")]
    pub axis_type: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BarEncode {
    pub x: String,
    pub y: String,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct BarSeriesItem {
    #[serde(rename = "type")]
    pub series_type: String,
    pub encode: BarEncode,
}

#[derive(Serialize, Deserialize, ToSchema, Debug, Clone, Default)]
pub struct UnitDashboardStudentRegencyDistribution {
    pub dataset: RegencyDataset,
    pub grid: RegencyGrid,
    #[serde(rename = "xAxis")]
    pub x_axis: RegencyXAxis,
    #[serde(rename = "yAxis")]
    pub y_axis: RegencyYAxis,
    pub series: Vec<BarSeriesItem>,
}

// Backward compatibility type aliases
pub type SubDistrictDataset = RegencyDataset;
pub type SubDistrictGrid = RegencyGrid;
pub type SubDistrictXAxis = RegencyXAxis;
pub type SubDistrictYAxis = RegencyYAxis;
pub type UnitDashboardStudentSubDistrictDistribution = UnitDashboardStudentRegencyDistribution;

/// Aggregated dashboard response for the unit show page.
#[derive(Serialize, Deserialize, ToSchema, Debug, Clone)]
pub struct UnitDashboardResponse {
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

    pub unit_type: Option<crate::dtos::common::reference::ReferenceResponse>,
    pub institution: Option<crate::dtos::institution::master::institutions::InstitutionResponse>,
    pub education: Option<crate::dtos::literate::educations::EducationResponse>,
    pub parent: Option<Box<UnitResponse>>,

    pub staffes: Vec<crate::dtos::institution::master::staffes::StaffResponse>,
    pub total_curriculum: i64,
    pub matakuliah: UnitDashboardMatakuliah,
    pub student_academic_year_chart: UnitDashboardAcademicYearChart,
    pub registered_student_academic_year_chart: UnitDashboardAcademicYearChart,
    pub course_category_distribution: UnitDashboardCourseCategoryDistribution,
    #[serde(alias = "student_sub_district_distribution")]
    pub student_regency_distribution: UnitDashboardStudentRegencyDistribution,
}

/// Detailed cohort item for student academic year status trend chart.
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
    pub data: Vec<StudentStatusByYearResponse>,
    pub trends: Vec<StudentStatusByYearResponse>,
}

/// Item representing a course category slice in the distribution pie/donut chart.
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
    pub data: Vec<CourseCategoryItemResponse>,
    pub categories: Vec<CourseCategoryItemResponse>,
}
