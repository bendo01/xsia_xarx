use chrono::Utc;
use salvo::prelude::*;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, EntityTrait, IntoActiveModel, ModelTrait,
    PaginatorTrait, QueryFilter, QueryOrder, Set,
};
use uuid::Uuid;
use validator::Validate;

use crate::dtos::institution::master::units::{
    CreateUnitRequest, UnitQuery, UnitResponse, PaginatedUnitResponse,
    UpdateUnitRequest, UnitDashboardResponse,
    UnitDashboardMatakuliah, UnitDashboardAcademicYearChart,
    UnitDashboardCourseCategoryDistribution, UnitDashboardStudentSubDistrictDistribution,
    ChartTooltip, ChartLegend, ChartGrid, ChartXAxisCategory, ChartYAxisValue,
    ChartLineSeriesItem, PieLegend, PieItemStyle, PieLabel, PieEmphasis,
    PieLabelLine, PieDataItem, PieSeriesItem, SubDistrictDataset,
    SubDistrictGrid, SubDistrictXAxis, SubDistrictYAxis, BarEncode, BarSeriesItem,
};
use crate::dtos::common::reference::MessageResponse;
use crate::models::institution::master::units as entity_mod;

pub async fn load_unit_with_relations(
    item: &entity_mod::Model,
    db: &DatabaseConnection,
) -> Result<UnitResponse, StatusError> {
    // 1. Belongs to: unit_type
    let unit_type = item
        .find_related(crate::models::institution::reference::unit_types::Entity)
        .filter(crate::models::institution::reference::unit_types::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::common::reference::ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at.unwrap_or_default(),
            updated_at: m.updated_at.unwrap_or_default(),
            deleted_at: m.deleted_at.map(|dt| dt.naive_utc()),
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    // 2. Belongs to: institution
    let institution = item
        .find_related(crate::models::institution::master::institutions::Entity)
        .filter(crate::models::institution::master::institutions::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::institution::master::institutions::InstitutionResponse {
            id: m.id,
            code: m.code,
            name: m.name,
            alphabet_code: m.alphabet_code,
            is_active: m.is_active,
            variety_id: m.variety_id,
            category_id: m.category_id,
            country_id: m.country_id,
            parent_id: m.parent_id,
            feeder_id: m.feeder_id,
            academic_year_id: m.academic_year_id,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    // 3. Belongs to: education
    let education = item
        .find_related(crate::models::literate::educations::Entity)
        .filter(crate::models::literate::educations::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::literate::educations::EducationResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            abbreviation: m.abbreviation,
            name: m.name,
            level_id: m.level_id,
            group_id: m.group_id,
            category_id: m.category_id,
            variety_id: m.variety_id,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    // 4. Belongs to: parent unit
    let parent = if let Some(pid) = item.parent_id {
        entity_mod::Entity::find_by_id(pid)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| Box::new(UnitResponse {
                id: m.id,
                code: m.code,
                name: m.name,
                is_active: m.is_active,
                unit_type_id: m.unit_type_id,
                institution_id: m.institution_id,
                parent_id: m.parent_id,
                education_id: m.education_id,
                feeder_id: m.feeder_id,
                lft: m.lft,
                rght: m.rght,
                created_at: m.created_at,
                updated_at: m.updated_at,
                sync_at: m.sync_at,
                deleted_at: m.deleted_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
                ..Default::default()
            }))
    } else {
        None
    };

    // Has many: staffes
    let staffes = item
        .find_related(crate::models::institution::master::staffes::Entity)
        .filter(crate::models::institution::master::staffes::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|s| crate::dtos::institution::master::staffes::StaffResponse {
            id: s.id,
            code: s.code,
            name: s.name,
            decree_number: s.decree_number,
            decree_date: s.decree_date,
            start_date: s.start_date,
            end_date: s.end_date,
            employee_id: s.employee_id,
            unit_id: s.unit_id,
            position_type_id: s.position_type_id,
            created_at: s.created_at,
            updated_at: s.updated_at,
            deleted_at: s.deleted_at,
            sync_at: s.sync_at,
            created_by: s.created_by,
            updated_by: s.updated_by,
        })
        .collect();

    // Has many: courses
    let courses = item
        .find_related(crate::models::academic::course::master::courses::Entity)
        .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| crate::dtos::academic::course::master::courses::CourseResponse {
            id: c.id,
            code: c.code,
            name: c.name,
            implementation_method: c.implementation_method,
            total_credit: c.total_credit,
            lecture_credit: c.lecture_credit,
            practice_credit: c.practice_credit,
            field_practice_credit: c.field_practice_credit,
            simulation_credit: c.simulation_credit,
            has_unit: c.has_unit,
            has_syllabus: c.has_syllabus,
            has_material: c.has_material,
            has_practice: c.has_practice,
            has_dictation: c.has_dictation,
            group_id: c.group_id,
            variety_id: c.variety_id,
            unit_id: c.unit_id,
            competence_id: c.competence_id,
            feeder_course_group_id: c.feeder_course_group_id,
            feeder_course_type_id: c.feeder_course_type_id,
            feeder_course_id: c.feeder_course_id,
            start_date: c.start_date,
            end_date: c.end_date,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
        })
        .collect();

    // Has many: curriculums
    let curriculums = item
        .find_related(crate::models::academic::course::master::curriculums::Entity)
        .filter(crate::models::academic::course::master::curriculums::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| crate::dtos::academic::course::master::curriculums::CurriculumResponse {
            id: c.id,
            name: c.name,
            unit_id: c.unit_id,
            academic_year_id: c.academic_year_id,
            curriculum_type_id: c.curriculum_type_id,
            total_credit: c.total_credit,
            mandatory_course_credit: c.mandatory_course_credit,
            optional_course_credit: c.optional_course_credit,
            feeder_id: c.feeder_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
            start_date: c.start_date,
            end_date: c.end_date,
            is_active: c.is_active,
        })
        .collect();

    // Has many: students
    let students = item
        .find_related(crate::models::academic::student::master::students::Entity)
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|s| crate::dtos::academic::student::master::students::StudentResponse {
            id: s.id,
            code: s.code,
            name: s.name,
            selection_type_id: s.selection_type_id,
            registered: s.registered,
            individual_id: s.individual_id,
            status_id: s.status_id,
            unit_id: s.unit_id,
            academic_year_id: s.academic_year_id,
            registration_id: s.registration_id,
            nisn: s.nisn,
            resign_status_id: s.resign_status_id,
            concentration_id: s.concentration_id,
            curriculum_id: s.curriculum_id,
            class_code_id: s.class_code_id,
            transfer_code: s.transfer_code,
            transfer_unit_id: s.transfer_unit_id,
            id_mahasiswa: s.id_mahasiswa,
            id_registrasi_mahasiswa: s.id_registrasi_mahasiswa,
            finance_fee: s.finance_fee,
            finance_id: s.finance_id,
            created_at: s.created_at,
            updated_at: s.updated_at,
            deleted_at: s.deleted_at,
            sync_at: s.sync_at,
            created_by: s.created_by,
            updated_by: s.updated_by,
            unit_name: None,
            unit_code: None,
            status_name: None,
            academic_year_name: None,
            curriculum_name: None,
            selection_type_name: None,
        })
        .collect();

    // Has many: rooms
    let rooms = item
        .find_related(crate::models::building::master::rooms::Entity)
        .filter(crate::models::building::master::rooms::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|r| crate::dtos::building::master::rooms::RoomResponse {
            id: r.id,
            alphabet_code: r.alphabet_code,
            name: r.name,
            long: r.long,
            wide: r.wide,
            high: r.high,
            room_type_id: r.room_type_id,
            unit_id: r.unit_id,
            building_id: r.building_id,
            condition_id: r.condition_id,
            created_at: r.created_at,
            updated_at: r.updated_at,
            deleted_at: r.deleted_at,
            sync_at: r.sync_at,
            created_by: r.created_by,
            updated_by: r.updated_by,
        })
        .collect();

    // Has many: activities
    let activities = item
        .find_related(crate::models::academic::campaign::transaction::activities::Entity)
        .filter(crate::models::academic::campaign::transaction::activities::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|a| crate::dtos::academic::campaign::transaction::activities::ActivityResponse {
            id: a.id,
            name: a.name,
            week_quantity: a.week_quantity,
            student_target: a.student_target,
            candidate_number: a.candidate_number,
            candidate_pass: a.candidate_pass,
            became_student: a.became_student,
            transfer_student: a.transfer_student,
            total_class_member: a.total_class_member,
            start_date: a.start_date,
            end_date: a.end_date,
            start_transaction: a.start_transaction,
            end_transaction: a.end_transaction,
            unit_id: a.unit_id,
            academic_year_id: a.academic_year_id,
            is_active: a.is_active,
            feeder_id: a.feeder_id,
            created_at: a.created_at,
            updated_at: a.updated_at,
            deleted_at: a.deleted_at,
            sync_at: a.sync_at,
            created_by: a.created_by,
            updated_by: a.updated_by,
        })
        .collect();

    // Has many: class_codes
    let class_codes = item
        .find_related(crate::models::academic::campaign::transaction::class_codes::Entity)
        .filter(crate::models::academic::campaign::transaction::class_codes::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| crate::dtos::academic::campaign::transaction::class_codes::ClassCodeResponse {
            id: c.id,
            code: c.code,
            alphabet_code: c.alphabet_code,
            name: c.name,
            activity_id: c.activity_id,
            start_effective_date: c.start_effective_date,
            end_effective_date: c.end_effective_date,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
            unit_id: c.unit_id,
            capacity: c.capacity,
        })
        .collect();

    // Has many: grades
    let grades = item
        .find_related(crate::models::academic::campaign::transaction::grades::Entity)
        .filter(crate::models::academic::campaign::transaction::grades::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|g| crate::dtos::academic::campaign::transaction::grades::GradeResponse {
            id: g.id,
            code: g.code,
            alphabet_code: g.alphabet_code,
            name: g.name,
            grade: g.grade,
            minimum: g.minimum,
            maximum: g.maximum,
            start_date: g.start_date,
            end_date: g.end_date,
            unit_id: g.unit_id,
            created_at: g.created_at,
            updated_at: g.updated_at,
            deleted_at: g.deleted_at,
            sync_at: g.sync_at,
            created_by: g.created_by,
            updated_by: g.updated_by,
            feeder_id: g.feeder_id,
        })
        .collect();

    // Has many: concentrations
    let concentrations = item
        .find_related(crate::models::academic::course::master::concentrations::Entity)
        .filter(crate::models::academic::course::master::concentrations::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|c| crate::dtos::academic::course::master::concentrations::ConcentrationResponse {
            id: c.id,
            code: c.code,
            name: c.name,
            unit_id: c.unit_id,
            created_at: c.created_at,
            updated_at: c.updated_at,
            deleted_at: c.deleted_at,
            sync_at: c.sync_at,
            created_by: c.created_by,
            updated_by: c.updated_by,
        })
        .collect();

    // Has many: homebases
    let homebases = item
        .find_related(crate::models::academic::lecturer::transaction::homebases::Entity)
        .filter(crate::models::academic::lecturer::transaction::homebases::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|h| crate::dtos::academic::lecturer::transaction::homebases::HomebaseResponse {
            id: h.id,
            lecturer_id: h.lecturer_id,
            unit_id: h.unit_id,
            institution_id: h.institution_id,
            status_id: h.status_id,
            contract_id: h.contract_id,
            created_at: h.created_at,
            updated_at: h.updated_at,
            deleted_at: h.deleted_at,
            sync_at: h.sync_at,
            created_by: h.created_by,
            updated_by: h.updated_by,
            unit_name: None,
            status_name: None,
            contract_name: None,
            unit: None,
            status: None,
            contract: None,
        })
        .collect();

    // Has many: recognitions
    let recognitions = item
        .find_related(crate::models::academic::prior_learning_recognition::transaction::recognitions::Entity)
        .filter(crate::models::academic::prior_learning_recognition::transaction::recognitions::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|r| crate::dtos::academic::prior_learning_recognition::transaction::recognitions::RecognitionResponse {
            id: r.id,
            name: r.name,
            candidate_id: r.candidate_id,
            created_at: r.created_at,
            updated_at: r.updated_at,
            deleted_at: r.deleted_at,
            sync_at: r.sync_at,
            created_by: r.created_by,
            updated_by: r.updated_by,
            curriculum_id: r.curriculum_id,
            unit_id: r.unit_id,
        })
        .collect();

    // Has many: decrees
    let decrees = item
        .find_related(crate::models::academic::student::adviser::decrees::Entity)
        .filter(crate::models::academic::student::adviser::decrees::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|d| crate::dtos::academic::student::adviser::decrees::DecreeResponse {
            id: d.id,
            decree_date: d.decree_date,
            decree_number: d.decree_number,
            unit_id: d.unit_id,
            staff_id: d.staff_id,
            created_at: d.created_at,
            updated_at: d.updated_at,
            deleted_at: d.deleted_at,
            sync_at: d.sync_at,
            created_by: d.created_by,
            updated_by: d.updated_by,
        })
        .collect();

    // Has many: student_activities
    let student_activities = item
        .find_related(crate::models::academic::student::campaign::student_activities::Entity)
        .filter(crate::models::academic::student::campaign::student_activities::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|sa| crate::dtos::academic::student::campaign::student_activities::StudentActivityResponse {
            id: sa.id,
            name: sa.name,
            cumulative_index: sa.cumulative_index,
            grand_cumulative_index: sa.grand_cumulative_index,
            total_credit: sa.total_credit,
            grand_total_credit: sa.grand_total_credit,
            student_id: sa.student_id,
            unit_activity_id: sa.unit_activity_id,
            status_id: sa.status_id,
            resign_status_id: sa.resign_status_id,
            unit_id: sa.unit_id,
            is_lock: sa.is_lock,
            created_at: sa.created_at,
            updated_at: sa.updated_at,
            deleted_at: sa.deleted_at,
            sync_at: sa.sync_at,
            created_by: sa.created_by,
            updated_by: sa.updated_by,
            feeder_id: sa.feeder_id,
            finance_id: sa.finance_id,
            finance_fee: sa.finance_fee,
            academic_year: None,
            academic_year_name: None,
        })
        .collect();

    // Has many: final_assignment_decrees
    let final_assignment_decrees = item
        .find_related(crate::models::academic::student::final_assignment::transaction::final_assignment_decrees::Entity)
        .filter(crate::models::academic::student::final_assignment::transaction::final_assignment_decrees::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|fad| crate::dtos::academic::student::final_assignment::transaction::final_assignment_decrees::FinalAssignmentDecreeResponse {
            id: fad.id,
            decree_number: fad.decree_number,
            decree_date: fad.decree_date,
            unit_id: fad.unit_id,
            activity_id: fad.activity_id,
            staff_id: fad.staff_id,
            created_at: fad.created_at,
            updated_at: fad.updated_at,
            deleted_at: fad.deleted_at,
            sync_at: fad.sync_at,
            created_by: fad.created_by,
            updated_by: fad.updated_by,
        })
        .collect();

    // Has many: candidate_unit
    let candidate_unit = item
        .find_related(crate::models::academic::candidate::master::candidate_unit::Entity)
        .filter(crate::models::academic::candidate::master::candidate_unit::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|cu| crate::dtos::academic::candidate::master::candidate_unit::CandidateUnitResponse {
            id: cu.id,
            candidate_id: cu.candidate_id,
            unit_id: cu.unit_id,
            registration_category_id: cu.registration_category_id,
            created_at: cu.created_at,
            updated_at: cu.updated_at,
            deleted_at: cu.deleted_at,
            sync_at: cu.sync_at,
            created_by: cu.created_by,
            updated_by: cu.updated_by,
        })
        .collect();

    // Has many: candidate_unit_choices
    let candidate_unit_choices = item
        .find_related(crate::models::academic::candidate::transaction::candidate_unit_choices::Entity)
        .filter(crate::models::academic::candidate::transaction::candidate_unit_choices::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|cuc| crate::dtos::academic::candidate::transaction::candidate_unit_choices::CandidateUnitChoiceResponse {
            id: cuc.id,
            candidate_id: cuc.candidate_id,
            unit_id: cuc.unit_id,
            student_registration_id: cuc.student_registration_id,
            registration_category_id: cuc.registration_category_id,
            phase_id: cuc.phase_id,
            priority: cuc.priority,
            created_at: cuc.created_at,
            updated_at: cuc.updated_at,
            deleted_at: cuc.deleted_at,
            sync_at: cuc.sync_at,
            created_by: cuc.created_by,
            updated_by: cuc.updated_by,
        })
        .collect();

    // Has many: registration_types
    let registration_types = item
        .find_related(crate::models::academic::candidate::reference::registration_types::Entity)
        .filter(crate::models::academic::candidate::reference::registration_types::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|rt| crate::dtos::common::reference::ReferenceResponse {
            id: rt.id,
            code: rt.code.unwrap_or_default(),
            alphabet_code: rt.alphabet_code.unwrap_or_default(),
            name: rt.name,
            created_at: rt.created_at.unwrap_or_default(),
            updated_at: rt.updated_at.unwrap_or_default(),
            deleted_at: rt.deleted_at,
            sync_at: rt.sync_at,
            created_by: rt.created_by,
            updated_by: rt.updated_by,
        })
        .collect();

    // Has many: bundles
    let bundles = item
        .find_related(crate::models::academic::survey::master::bundles::Entity)
        .filter(crate::models::academic::survey::master::bundles::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .into_iter()
        .map(|b| crate::dtos::academic::survey::master::bundles::BundleResponse {
            id: b.id,
            code: b.code,
            alphabet_code: b.alphabet_code,
            name: b.name,
            institution_id: b.institution_id,
            bundle_category_id: b.bundle_category_id,
            unit_id: b.unit_id,
            suggestion: b.suggestion,
            created_at: b.created_at,
            updated_at: b.updated_at,
            sync_at: b.sync_at,
            deleted_at: b.deleted_at,
            created_by: b.created_by,
            updated_by: b.updated_by,
        })
        .collect();

    Ok(UnitResponse {
        id: item.id,
        code: item.code.clone(),
        name: item.name.clone(),
        is_active: item.is_active,
        unit_type_id: item.unit_type_id,
        institution_id: item.institution_id,
        parent_id: item.parent_id,
        education_id: item.education_id,
        feeder_id: item.feeder_id,
        lft: item.lft,
        rght: item.rght,
        created_at: item.created_at,
        updated_at: item.updated_at,
        sync_at: item.sync_at,
        deleted_at: item.deleted_at,
        created_by: item.created_by,
        updated_by: item.updated_by,
        unit_type,
        institution,
        education,
        parent,
        staffes: Some(staffes),
        courses: Some(courses),
        curriculums: Some(curriculums),
        students: Some(students),
        rooms: Some(rooms),
        activities: Some(activities),
        class_codes: Some(class_codes),
        grades: Some(grades),
        concentrations: Some(concentrations),
        homebases: Some(homebases),
        recognitions: Some(recognitions),
        decrees: Some(decrees),
        student_activities: Some(student_activities),
        final_assignment_decrees: Some(final_assignment_decrees),
        candidate_unit: Some(candidate_unit),
        candidate_unit_choices: Some(candidate_unit_choices),
        registration_types: Some(registration_types),
        bundles: Some(bundles),
    })
}

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 500))]
pub async fn list_units(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<PaginatedUnitResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let query: UnitQuery = req.parse_queries().unwrap_or_default();
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

    let data: Vec<UnitResponse> = if query.with_relations.unwrap_or(false) {
        let mut full_items = Vec::new();
        for item in &items {
            full_items.push(load_unit_with_relations(item, db).await?);
        }
        full_items
    } else {
        items.into_iter().map(|item| UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }).collect()
    };

    Ok(Json(PaginatedUnitResponse {
        data,
        total,
        page,
        page_size,
        total_pages,
    }))
}

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_unit(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitResponse>, StatusError> {
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
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

    let response = load_unit_with_relations(&item, db).await?;
    Ok(Json(response))
}

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 500))]
pub async fn create_unit(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UnitResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let payload: CreateUnitRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let now = Utc::now().naive_utc();
        let new_id = Uuid::new_v4();

        let active_model = entity_mod::ActiveModel {
            id: Set(new_id),
        code: Set(payload.code),
        name: Set(payload.name),
        is_active: Set(payload.is_active),
        unit_type_id: Set(payload.unit_type_id),
        institution_id: Set(payload.institution_id),
        parent_id: Set(payload.parent_id),
        education_id: Set(payload.education_id),
        feeder_id: Set(payload.feeder_id),
        lft: Set(payload.lft),
        rght: Set(payload.rght),
        created_at: Set(Some(now)),
        updated_at: Set(Some(now)),
        sync_at: Set(None),
        deleted_at: Set(None),
        created_by: Set(None),
        updated_by: Set(None),
    };

        let item = active_model.insert(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }))
}

#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn update_unit(
        req: &mut Request,
        depot: &mut Depot,
) -> Result<Json<UnitResponse>, StatusError> {
        let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
            StatusError::internal_server_error().brief("Database connection missing")
        })?;

        let id_str = req.param::<String>("id").ok_or_else(|| StatusError::bad_request().brief("Missing parameter id"))?;
        let id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

        let payload: UpdateUnitRequest = req.parse_json().await.map_err(|e| {
            StatusError::bad_request().brief(format!("Invalid JSON payload: {}", e))
        })?;

        payload.validate().map_err(|e| StatusError::bad_request().brief(e.to_string()))?;

        let existing = entity_mod::Entity::find_by_id(id)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

    if let Some(code) = payload.code {
            active_model.code = Set(Some(code));
        }
    if let Some(name) = payload.name {
            active_model.name = Set(Some(name));
        }
    if let Some(is_active) = payload.is_active {
            active_model.is_active = Set(is_active);
        }
    if let Some(unit_type_id) = payload.unit_type_id {
            active_model.unit_type_id = Set(unit_type_id);
        }
    if let Some(institution_id) = payload.institution_id {
            active_model.institution_id = Set(institution_id);
        }
    if let Some(parent_id) = payload.parent_id {
            active_model.parent_id = Set(Some(parent_id));
        }
    if let Some(education_id) = payload.education_id {
            active_model.education_id = Set(education_id);
        }
    if let Some(feeder_id) = payload.feeder_id {
            active_model.feeder_id = Set(Some(feeder_id));
        }
    if let Some(lft) = payload.lft {
            active_model.lft = Set(Some(lft));
        }
    if let Some(rght) = payload.rght {
            active_model.rght = Set(Some(rght));
        }
    active_model.updated_at = Set(Some(now));

        let item = active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(UnitResponse {
            id: item.id,
            code: item.code,
            name: item.name,
            is_active: item.is_active,
            unit_type_id: item.unit_type_id,
            institution_id: item.institution_id,
            parent_id: item.parent_id,
            education_id: item.education_id,
            feeder_id: item.feeder_id,
            lft: item.lft,
            rght: item.rght,
            created_at: item.created_at,
            updated_at: item.updated_at,
            sync_at: item.sync_at,
            deleted_at: item.deleted_at,
            created_by: item.created_by,
            updated_by: item.updated_by,
            ..Default::default()
        }))
}
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn delete_unit(
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
            .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

        let now = Utc::now().naive_utc();
        let mut active_model = existing.into_active_model();

        active_model.deleted_at = Set(Some(now));
        active_model.updated_at = Set(Some(now));

        active_model.update(db).await.map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

        Ok(Json(MessageResponse {
            message: "Unit deleted successfully".to_string(),
        }))
}

/// Dashboard endpoint: returns unit with all data needed by the show page in a single response,
/// including academic statistics, student yearly trends, course category distribution, and demographic sub-district distribution.
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_unit_dashboard(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitDashboardResponse>, StatusError> {
    use std::collections::{HashMap, HashSet};

    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .or_else(|| req.query::<String>("unit_id"))
        .or_else(|| req.query::<String>("id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;
    let unit_id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    // 1. Fetch unit
    let unit_item = entity_mod::Entity::find_by_id(unit_id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

    // 2. Belongs-to relations: unit_type, institution, education, parent
    let unit_type = unit_item
        .find_related(crate::models::institution::reference::unit_types::Entity)
        .filter(crate::models::institution::reference::unit_types::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::common::reference::ReferenceResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            name: m.name,
            created_at: m.created_at.unwrap_or_default(),
            updated_at: m.updated_at.unwrap_or_default(),
            deleted_at: m.deleted_at.map(|dt| dt.naive_utc()),
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let institution = unit_item
        .find_related(crate::models::institution::master::institutions::Entity)
        .filter(crate::models::institution::master::institutions::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::institution::master::institutions::InstitutionResponse {
            id: m.id,
            code: m.code,
            name: m.name,
            alphabet_code: m.alphabet_code,
            is_active: m.is_active,
            variety_id: m.variety_id,
            category_id: m.category_id,
            country_id: m.country_id,
            parent_id: m.parent_id,
            feeder_id: m.feeder_id,
            academic_year_id: m.academic_year_id,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let education = unit_item
        .find_related(crate::models::literate::educations::Entity)
        .filter(crate::models::literate::educations::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .map(|m| crate::dtos::literate::educations::EducationResponse {
            id: m.id,
            code: m.code,
            alphabet_code: m.alphabet_code,
            abbreviation: m.abbreviation,
            name: m.name,
            level_id: m.level_id,
            group_id: m.group_id,
            category_id: m.category_id,
            variety_id: m.variety_id,
            created_at: m.created_at,
            updated_at: m.updated_at,
            deleted_at: m.deleted_at,
            sync_at: m.sync_at,
            created_by: m.created_by,
            updated_by: m.updated_by,
        });

    let parent = if let Some(pid) = unit_item.parent_id {
        entity_mod::Entity::find_by_id(pid)
            .filter(entity_mod::Column::DeletedAt.is_null())
            .one(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .map(|m| Box::new(UnitResponse {
                id: m.id,
                code: m.code,
                name: m.name,
                is_active: m.is_active,
                unit_type_id: m.unit_type_id,
                institution_id: m.institution_id,
                parent_id: m.parent_id,
                education_id: m.education_id,
                feeder_id: m.feeder_id,
                lft: m.lft,
                rght: m.rght,
                created_at: m.created_at,
                updated_at: m.updated_at,
                sync_at: m.sync_at,
                deleted_at: m.deleted_at,
                created_by: m.created_by,
                updated_by: m.updated_by,
                ..Default::default()
            }))
    } else {
        None
    };

    // 3. Staffes with enriched employee code/name if missing
    let staff_models = unit_item
        .find_related(crate::models::institution::master::staffes::Entity)
        .filter(crate::models::institution::master::staffes::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let employee_ids: Vec<Uuid> = staff_models
        .iter()
        .map(|s| s.employee_id)
        .filter(|id| *id != Uuid::nil())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let employees_map: HashMap<Uuid, crate::models::institution::master::employees::Model> = if employee_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::institution::master::employees::Entity::find()
            .filter(crate::models::institution::master::employees::Column::Id.is_in(employee_ids))
            .filter(crate::models::institution::master::employees::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|e| (e.id, e))
            .collect()
    };

    let staffes: Vec<crate::dtos::institution::master::staffes::StaffResponse> = staff_models
        .into_iter()
        .map(|s| {
            let emp = employees_map.get(&s.employee_id);
            let code = s.code.or_else(|| emp.map(|e| e.code.clone()));
            let name = s.name.or_else(|| emp.map(|e| e.name.clone()));

            crate::dtos::institution::master::staffes::StaffResponse {
                id: s.id,
                code,
                name,
                decree_number: s.decree_number,
                decree_date: s.decree_date,
                start_date: s.start_date,
                end_date: s.end_date,
                employee_id: s.employee_id,
                unit_id: s.unit_id,
                position_type_id: s.position_type_id,
                created_at: s.created_at,
                updated_at: s.updated_at,
                deleted_at: s.deleted_at,
                sync_at: s.sync_at,
                created_by: s.created_by,
                updated_by: s.updated_by,
            }
        })
        .collect();

    // 4. Total curriculum
    let total_curriculum = crate::models::academic::course::master::curriculums::Entity::find()
        .filter(crate::models::academic::course::master::curriculums::Column::UnitId.eq(unit_id))
        .filter(crate::models::academic::course::master::curriculums::Column::DeletedAt.is_null())
        .count(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))? as i64;

    // 5. Matakuliah (courses count and total credits)
    let courses = crate::models::academic::course::master::courses::Entity::find()
        .filter(crate::models::academic::course::master::courses::Column::UnitId.eq(unit_id))
        .filter(crate::models::academic::course::master::courses::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let total_matakuliah = courses.len() as i64;
    let raw_total_credit: f64 = courses.iter().map(|c| {
        if c.total_credit > 0.0 {
            c.total_credit
        } else {
            c.lecture_credit + c.practice_credit
        }
    }).sum();
    let total_credit = (raw_total_credit * 100.0).round() / 100.0;
    let matakuliah = UnitDashboardMatakuliah {
        total_matakuliah,
        total_credit,
    };

    // 6. Course Category Distribution (Pie Chart)
    let course_varieties: HashMap<Uuid, String> =
        crate::models::academic::course::reference::varieties::Entity::find()
            .filter(crate::models::academic::course::reference::varieties::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|v| (v.id, v.name))
            .collect();

    let course_groups: HashMap<Uuid, String> =
        crate::models::academic::course::reference::groups::Entity::find()
            .filter(crate::models::academic::course::reference::groups::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|g| (g.id, g.name))
            .collect();

    let mut category_counts: HashMap<String, i64> = HashMap::new();
    for c in &courses {
        let cat_name = if c.variety_id != Uuid::nil() {
            course_varieties.get(&c.variety_id).cloned().unwrap_or_default()
        } else {
            String::new()
        };

        let cat_name = if !cat_name.is_empty() {
            cat_name
        } else if let Some(gid) = c.group_id {
            course_groups.get(&gid).cloned().unwrap_or_default()
        } else {
            String::new()
        };

        let cat_name = if !cat_name.is_empty() {
            cat_name
        } else if c.practice_credit > 0.0 && c.lecture_credit <= 0.0 {
            "Mata Kuliah Praktik".to_string()
        } else if c.lecture_credit > 0.0 && c.practice_credit <= 0.0 {
            "Matakuliah Teori".to_string()
        } else if c.lecture_credit > 0.0 && c.practice_credit > 0.0 {
            "Teori & Praktik".to_string()
        } else {
            "Wajib".to_string()
        };

        *category_counts.entry(cat_name).or_insert(0) += 1;
    }

    let mut pie_data: Vec<PieDataItem> = category_counts
        .into_iter()
        .map(|(name, value)| PieDataItem { value, name })
        .collect();
    pie_data.sort_by(|a, b| b.value.cmp(&a.value).then_with(|| a.name.cmp(&b.name)));

    let course_category_distribution = UnitDashboardCourseCategoryDistribution {
        tooltip: ChartTooltip {
            trigger: "item".to_string(),
        },
        legend: PieLegend {
            top: "5%".to_string(),
            left: "center".to_string(),
        },
        series: vec![PieSeriesItem {
            name: "Course Type".to_string(),
            series_type: "pie".to_string(),
            radius: vec!["40%".to_string(), "70%".to_string()],
            avoid_label_overlap: false,
            item_style: PieItemStyle {
                border_radius: 10,
                border_color: "#fff".to_string(),
                border_width: 2,
            },
            label: PieLabel {
                show: false,
                position: Some("center".to_string()),
                font_size: None,
                font_weight: None,
            },
            emphasis: PieEmphasis {
                label: PieLabel {
                    show: true,
                    position: None,
                    font_size: Some(40),
                    font_weight: Some("bold".to_string()),
                },
            },
            label_line: PieLabelLine { show: false },
            data: pie_data,
        }],
    };

    // 7. Students & Academic Years & Statuses & Genders & Individuals
    let students = crate::models::academic::student::master::students::Entity::find()
        .filter(crate::models::academic::student::master::students::Column::UnitId.eq(unit_id))
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // Load academic years for xAxis
    let student_ay_ids: Vec<Uuid> = students
        .iter()
        .map(|s| s.academic_year_id)
        .filter(|id| *id != Uuid::nil())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let mut academic_years = if !student_ay_ids.is_empty() {
        crate::models::academic::general::reference::academic_years::Entity::find()
            .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(student_ay_ids))
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    } else {
        // Fallback to recent academic years for last 10 years
        crate::models::academic::general::reference::academic_years::Entity::find()
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .order_by_desc(crate::models::academic::general::reference::academic_years::Column::FeederName)
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .take(13)
            .collect()
    };

    academic_years.sort_by(|a, b| a.feeder_name.cmp(&b.feeder_name));
    let x_axis_data: Vec<String> = academic_years
        .iter()
        .map(|ay| {
            if !ay.feeder_name.trim().is_empty() {
                ay.feeder_name.clone()
            } else {
                ay.name.clone()
            }
        })
        .collect();

    // 8. Student Academic Year Chart (by Status)
    let statuses = crate::models::academic::student::reference::statuses::Entity::find()
        .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
        .order_by_asc(crate::models::academic::student::reference::statuses::Column::Code)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let status_legend_data: Vec<String> = statuses.iter().map(|st| st.name.clone()).collect();

    let mut student_status_series: Vec<ChartLineSeriesItem> = Vec::new();
    for st in &statuses {
        let mut counts = Vec::new();
        for ay in &academic_years {
            let count = students
                .iter()
                .filter(|s| s.academic_year_id == ay.id && s.status_id == st.id)
                .count() as i64;
            counts.push(count);
        }
        student_status_series.push(ChartLineSeriesItem {
            name: st.name.clone(),
            series_type: "line".to_string(),
            data: counts,
        });
    }

    let student_academic_year_chart = UnitDashboardAcademicYearChart {
        tooltip: ChartTooltip {
            trigger: "axis".to_string(),
        },
        legend: ChartLegend {
            data: status_legend_data,
        },
        grid: ChartGrid {
            left: Some("3%".to_string()),
            right: Some("4%".to_string()),
            bottom: Some("3%".to_string()),
            contain_label: true,
        },
        x_axis: ChartXAxisCategory {
            axis_type: "category".to_string(),
            boundary_gap: false,
            data: x_axis_data.clone(),
        },
        y_axis: ChartYAxisValue {
            axis_type: "value".to_string(),
        },
        series: student_status_series,
    };

    // 9. Load individuals for Registered Student Academic Year Chart & Sub-district Distribution
    let individual_ids: Vec<Uuid> = students
        .iter()
        .map(|s| s.individual_id)
        .filter(|id| *id != Uuid::nil())
        .collect::<HashSet<_>>()
        .into_iter()
        .collect();

    let individuals_map: HashMap<Uuid, crate::models::person::master::individual::Model> = if individual_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::person::master::individual::Entity::find()
            .filter(crate::models::person::master::individual::Column::Id.is_in(individual_ids))
            .filter(crate::models::person::master::individual::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|ind| (ind.id, ind))
            .collect()
    };

    // 10. Registered Student Academic Year Chart (by Gender: Laki-Laki / Perempuan)
    let genders = crate::models::person::reference::gender::Entity::find()
        .filter(crate::models::person::reference::gender::Column::DeletedAt.is_null())
        .order_by_asc(crate::models::person::reference::gender::Column::Code)
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let gender_legend_data: Vec<String> = genders.iter().map(|g| g.name.clone()).collect();
    let mut gender_series: Vec<ChartLineSeriesItem> = Vec::new();

    for g in &genders {
        let mut counts = Vec::new();
        for ay in &academic_years {
            let count = students
                .iter()
                .filter(|s| {
                    if s.academic_year_id != ay.id {
                        return false;
                    }
                    if let Some(ind) = individuals_map.get(&s.individual_id) {
                        ind.gender_id == g.id
                    } else {
                        false
                    }
                })
                .count() as i64;
            counts.push(count);
        }
        gender_series.push(ChartLineSeriesItem {
            name: g.name.clone(),
            series_type: "line".to_string(),
            data: counts,
        });
    }

    let registered_student_academic_year_chart = UnitDashboardAcademicYearChart {
        tooltip: ChartTooltip {
            trigger: "axis".to_string(),
        },
        legend: ChartLegend {
            data: gender_legend_data,
        },
        grid: ChartGrid {
            left: Some("3%".to_string()),
            right: Some("4%".to_string()),
            bottom: Some("3%".to_string()),
            contain_label: true,
        },
        x_axis: ChartXAxisCategory {
            axis_type: "category".to_string(),
            boundary_gap: false,
            data: x_axis_data,
        },
        y_axis: ChartYAxisValue {
            axis_type: "value".to_string(),
        },
        series: gender_series,
    };

    // 11. Student Sub-District Distribution
    // Data is attained from academic_student_master.students -> individual_id -> person.individuals.code (first 6 digits) -> location.sub_districts.code
    let mut prefixes: HashSet<String> = HashSet::new();
    for ind in individuals_map.values() {
        let clean: String = ind.code.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
        if clean.len() >= 6 {
            prefixes.insert(clean[..6].to_string());
        }
    }

    let mut search_codes = Vec::new();
    for p in &prefixes {
        search_codes.push(p.clone());
        if p.len() == 6 {
            search_codes.push(format!("{}.{}.{}", &p[0..2], &p[2..4], &p[4..6]));
        }
    }

    let sub_districts = if search_codes.is_empty() {
        vec![]
    } else {
        crate::models::location::sub_districts::Entity::find()
            .filter(crate::models::location::sub_districts::Column::Code.is_in(search_codes))
            .filter(crate::models::location::sub_districts::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
    };

    let mut sub_district_map: HashMap<String, String> = HashMap::new();
    for sd in sub_districts {
        let norm = sd.code.replace(".", "");
        sub_district_map.insert(norm, sd.name);
    }

    let mut count_by_district: HashMap<String, i64> = HashMap::new();
    for s in &students {
        if let Some(ind) = individuals_map.get(&s.individual_id) {
            let clean: String = ind.code.chars().filter(|c| c.is_ascii_alphanumeric()).collect();
            if clean.len() >= 6 {
                let prefix = &clean[..6];
                if let Some(name) = sub_district_map.get(prefix) {
                    *count_by_district.entry(name.clone()).or_insert(0) += 1;
                }
            }
        }
    }

    let mut district_counts: Vec<(String, i64)> = count_by_district.into_iter().collect();
    district_counts.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.0.cmp(&b.0)));

    let mut dataset_source: Vec<Vec<serde_json::Value>> = vec![
        vec![serde_json::json!("total"), serde_json::json!("sub district")],
    ];
    for (name, count) in district_counts {
        dataset_source.push(vec![serde_json::json!(count), serde_json::json!(name)]);
    }

    let student_sub_district_distribution = UnitDashboardStudentSubDistrictDistribution {
        dataset: SubDistrictDataset {
            source: dataset_source,
        },
        grid: SubDistrictGrid {
            contain_label: true,
        },
        x_axis: SubDistrictXAxis {
            name: "sub district".to_string(),
        },
        y_axis: SubDistrictYAxis {
            axis_type: "category".to_string(),
        },
        series: vec![BarSeriesItem {
            series_type: "bar".to_string(),
            encode: BarEncode {
                x: "amount".to_string(),
                y: "product".to_string(),
            },
        }],
    };

    Ok(Json(UnitDashboardResponse {
        id: unit_item.id,
        code: unit_item.code,
        name: unit_item.name,
        is_active: unit_item.is_active,
        unit_type_id: unit_item.unit_type_id,
        institution_id: unit_item.institution_id,
        parent_id: unit_item.parent_id,
        education_id: unit_item.education_id,
        feeder_id: unit_item.feeder_id,
        lft: unit_item.lft,
        rght: unit_item.rght,
        created_at: unit_item.created_at,
        updated_at: unit_item.updated_at,
        sync_at: unit_item.sync_at,
        deleted_at: unit_item.deleted_at,
        created_by: unit_item.created_by,
        updated_by: unit_item.updated_by,

        unit_type,
        institution,
        education,
        parent,

        staffes,
        total_curriculum,
        matakuliah,
        student_academic_year_chart,
        registered_student_academic_year_chart,
        course_category_distribution,
        student_sub_district_distribution,
    }))
}
