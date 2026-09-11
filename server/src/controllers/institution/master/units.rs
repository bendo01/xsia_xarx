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
    StudentStatusByYearResponse, UnitStudentAcademicYearChartResponse,
    CourseCategoryItemResponse, UnitCourseCategoryDistributionResponse,
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

/// Dashboard endpoint: returns unit with all data needed by the show page in a single response.
/// Replaces these separate client-side calls:
///   - GET /institution/master/units/{id}
///   - GET /institution/reference/position-type?page=1&page_size=50
///   - GET /academic/course/reference/varieties?page=1&page_size=50
///   - GET /academic/course/reference/groups?page=1&page_size=50
///   - GET /academic/course/master/courses/unit/{id}
///   - GET /academic/course/master/curriculums/unit/{id}
///   - GET /academic/student/master/students/unit/{id}
///   - GET /institution/master/staffes/unit/{id}
///   - N × GET /institution/master/employees/{employee_id}
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_unit_dashboard(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitDashboardResponse>, StatusError> {
    use std::collections::HashMap;
    use chrono::Utc;

    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req.param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;
    let unit_id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    // 1. Load unit with belongs-to relations (education, institution, parent, unit_type)
    let unit_item = entity_mod::Entity::find_by_id(unit_id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

    // Load belongs-to relations for the unit
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

    let unit_response = UnitResponse {
        id: unit_item.id,
        code: unit_item.code.clone(),
        name: unit_item.name.clone(),
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
        ..Default::default()
    };

    // 2. Load all courses for this unit (no pagination)
    let courses: Vec<crate::dtos::academic::course::master::courses::CourseResponse> =
        crate::dtos::academic::course::master::courses::list_courses_by_unit(db, unit_id)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // 3. Load all curriculums for this unit (no pagination)
    let curriculums: Vec<crate::dtos::academic::course::master::curriculums::CurriculumResponse> =
        unit_item
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

    // 4. Load all students for this unit with enriched status/academic_year names
    let student_models = unit_item
        .find_related(crate::models::academic::student::master::students::Entity)
        .filter(crate::models::academic::student::master::students::Column::DeletedAt.is_null())
        .all(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // Collect unique IDs for batch lookups
    let status_ids: Vec<Uuid> = student_models.iter()
        .map(|s| s.status_id)
        .filter(|id| *id != Uuid::nil())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();
    let academic_year_ids: Vec<Uuid> = student_models.iter()
        .map(|s| s.academic_year_id)
        .filter(|id| *id != Uuid::nil())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    // Batch resolve status names
    let statuses_map: HashMap<Uuid, String> = if status_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::student::reference::statuses::Entity::find()
            .filter(crate::models::academic::student::reference::statuses::Column::Id.is_in(status_ids))
            .filter(crate::models::academic::student::reference::statuses::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|s| (s.id, s.name))
            .collect()
    };

    // Batch resolve academic year names
    let academic_years_map: HashMap<Uuid, String> = if academic_year_ids.is_empty() {
        HashMap::new()
    } else {
        crate::models::academic::general::reference::academic_years::Entity::find()
            .filter(crate::models::academic::general::reference::academic_years::Column::Id.is_in(academic_year_ids))
            .filter(crate::models::academic::general::reference::academic_years::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|a| (a.id, a.name))
            .collect()
    };

    let students: Vec<crate::dtos::academic::student::master::students::StudentResponse> = student_models
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
            unit_name: unit_item.name.clone(),
            unit_code: unit_item.code.clone(),
            status_name: statuses_map.get(&s.status_id).cloned(),
            academic_year_name: academic_years_map.get(&s.academic_year_id).cloned(),
            curriculum_name: None,
            selection_type_name: None,
        })
        .collect();

    // 5. Load all staff for this unit (no pagination)
    let staffes: Vec<crate::dtos::institution::master::staffes::StaffResponse> =
        crate::dtos::institution::master::staffes::list_staffes_by_unit(db, unit_id)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    // 6. Batch-load employees referenced by staff records
    let employee_ids: Vec<Uuid> = staffes.iter()
        .map(|s| s.employee_id)
        .filter(|id| *id != Uuid::nil())
        .collect::<std::collections::HashSet<_>>()
        .into_iter()
        .collect();

    let employees: Vec<crate::dtos::institution::master::employees::EmployeeResponse> = if employee_ids.is_empty() {
        vec![]
    } else {
        crate::models::institution::master::employees::Entity::find()
            .filter(crate::models::institution::master::employees::Column::Id.is_in(employee_ids))
            .filter(crate::models::institution::master::employees::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|e| crate::dtos::institution::master::employees::EmployeeResponse {
                id: e.id,
                code: e.code,
                name: e.name,
                institution_id: e.institution_id,
                individual_id: e.individual_id,
                decree_number: e.decree_number,
                decree_date: e.decree_date,
                is_active: e.is_active,
                created_at: e.created_at,
                updated_at: e.updated_at,
                deleted_at: e.deleted_at,
                sync_at: e.sync_at,
                created_by: e.created_by,
                updated_by: e.updated_by,
                ..Default::default()
            })
            .collect()
    };

    // 7. Load all reference tables (no pagination)
    // Position types
    let position_types: Vec<crate::dtos::common::reference::ReferenceResponse> =
        crate::models::institution::reference::position_type::Entity::find()
            .filter(crate::models::institution::reference::position_type::Column::DeletedAt.is_null())
            .order_by_asc(crate::models::institution::reference::position_type::Column::Name)
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|item| crate::dtos::common::reference::ReferenceResponse {
                id: item.id,
                code: item.code,
                alphabet_code: item.alphabet_code,
                name: item.name,
                created_at: item.created_at,
                updated_at: item.updated_at,
                deleted_at: item.deleted_at,
                sync_at: item.sync_at,
                created_by: item.created_by,
                updated_by: item.updated_by,
            })
            .collect();

    // Course varieties
    let course_varieties: Vec<crate::dtos::common::reference::ReferenceResponse> =
        crate::models::academic::course::reference::varieties::Entity::find()
            .filter(crate::models::academic::course::reference::varieties::Column::DeletedAt.is_null())
            .order_by_asc(crate::models::academic::course::reference::varieties::Column::Name)
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|item| crate::dtos::common::reference::ReferenceResponse {
                id: item.id,
                code: item.code.unwrap_or_default(),
                alphabet_code: item.alphabet_code.unwrap_or_default(),
                name: item.name,
                created_at: item.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
                updated_at: item.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
                deleted_at: item.deleted_at,
                sync_at: item.sync_at,
                created_by: item.created_by,
                updated_by: item.updated_by,
            })
            .collect();

    // Course groups
    let course_groups: Vec<crate::dtos::common::reference::ReferenceResponse> =
        crate::models::academic::course::reference::groups::Entity::find()
            .filter(crate::models::academic::course::reference::groups::Column::DeletedAt.is_null())
            .order_by_asc(crate::models::academic::course::reference::groups::Column::Name)
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|item| crate::dtos::common::reference::ReferenceResponse {
                id: item.id,
                code: item.code.unwrap_or_default(),
                alphabet_code: item.alphabet_code.unwrap_or_default(),
                name: item.name,
                created_at: item.created_at.unwrap_or_else(|| Utc::now().naive_utc()),
                updated_at: item.updated_at.unwrap_or_else(|| Utc::now().naive_utc()),
                deleted_at: item.deleted_at,
                sync_at: item.sync_at,
                created_by: item.created_by,
                updated_by: item.updated_by,
            })
            .collect();

    // Optional precomputed chart statistics
    let student_yearly_trend = Some(build_student_academic_year_chart(
        unit_id,
        unit_item.name.clone().unwrap_or_else(|| "Program Studi".to_string()),
        unit_item.code.clone(),
        &students,
    ));

    let varieties_name_map: HashMap<Uuid, String> = course_varieties
        .iter()
        .map(|v| (v.id, v.name.clone()))
        .collect();
    let groups_name_map: HashMap<Uuid, String> = course_groups
        .iter()
        .map(|g| (g.id, g.name.clone()))
        .collect();

    let course_category_distribution = Some(build_course_category_distribution(
        unit_id,
        unit_item.name.clone().unwrap_or_else(|| "Program Studi".to_string()),
        unit_item.code.clone(),
        &courses,
        &varieties_name_map,
        &groups_name_map,
    ));

    Ok(Json(UnitDashboardResponse {
        unit: unit_response,
        courses,
        curriculums,
        students,
        staffes,
        employees,
        position_types,
        course_varieties,
        course_groups,
        student_yearly_trend,
        course_category_distribution,
    }))
}

/// Helper to aggregate students into academic year status cohorts.
/// Meets the needs of StudentAcademicYearChart in show.tsx:L913-L916.
pub fn build_student_academic_year_chart(
    unit_id: Uuid,
    unit_name: String,
    unit_code: Option<String>,
    students: &[crate::dtos::academic::student::master::students::StudentResponse],
) -> UnitStudentAcademicYearChartResponse {
    use std::collections::BTreeMap;

    let mut map: BTreeMap<String, StudentStatusByYearResponse> = BTreeMap::new();
    let mut total_students: i64 = 0;
    let mut total_active: i64 = 0;
    let mut total_leave: i64 = 0;
    let mut total_graduated: i64 = 0;
    let mut total_other: i64 = 0;

    for s in students {
        let raw_year = if let Some(ay_name) = &s.academic_year_name {
            let trimmed = ay_name.trim();
            if !trimmed.is_empty() {
                trimmed.to_string()
            } else {
                s.registered.format("%Y").to_string()
            }
        } else {
            s.registered.format("%Y").to_string()
        };
        let year_name = if raw_year.is_empty() {
            "Belum Ditentukan".to_string()
        } else {
            raw_year
        };

        let entry = map.entry(year_name.clone()).or_insert_with(|| StudentStatusByYearResponse {
            year_name,
            total: 0,
            active: 0,
            leave: 0,
            graduated: 0,
            other: 0,
        });

        let status = s.status_name.as_deref().unwrap_or("").to_lowercase();
        if status.contains("aktif") || status.contains("active") {
            entry.active += 1;
            total_active += 1;
        } else if status.contains("cuti") || status.contains("leave") {
            entry.leave += 1;
            total_leave += 1;
        } else if status.contains("lulus") || status.contains("graduat") {
            entry.graduated += 1;
            total_graduated += 1;
        } else {
            entry.other += 1;
            total_other += 1;
        }
        entry.total += 1;
        total_students += 1;
    }

    let mut data: Vec<StudentStatusByYearResponse> = map.into_values().collect();
    data.sort_by(|a, b| a.year_name.cmp(&b.year_name));
    let trends = data.clone();

    UnitStudentAcademicYearChartResponse {
        unit_id,
        unit_name,
        unit_code,
        total_students,
        total_active,
        total_leave,
        total_graduated,
        total_other,
        data,
        trends,
    }
}

/// Helper function to load and calculate student academic year status trend based on parameter unit_id.
/// Descriptive response matching StudentAcademicYearChart data requirements (show.tsx:L913-L916).
pub async fn get_student_academic_year_chart_by_unit_id(
    unit_id: Uuid,
    db: &DatabaseConnection,
) -> Result<UnitStudentAcademicYearChartResponse, StatusError> {
    let unit_item = entity_mod::Entity::find_by_id(unit_id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

    let unit_name = unit_item.name.clone().unwrap_or_else(|| "Program Studi".to_string());
    let unit_code = unit_item.code.clone();

    let students = crate::dtos::academic::student::master::students::list_students_by_unit(db, unit_id)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    Ok(build_student_academic_year_chart(unit_id, unit_name, unit_code, &students))
}

/// Alias helper function to load student academic year trend chart based on parameter unit_id
pub async fn load_unit_student_academic_year_chart(
    unit_id: Uuid,
    db: &DatabaseConnection,
) -> Result<UnitStudentAcademicYearChartResponse, StatusError> {
    get_student_academic_year_chart_by_unit_id(unit_id, db).await
}

/// Salvo endpoint to get student academic year chart based on parameter unit_id.
/// Meets all data needs for StudentAcademicYearChart in show.tsx:L913-L916.
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_student_academic_year_chart(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitStudentAcademicYearChartResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .or_else(|| req.query::<String>("unit_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;
    let unit_id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let chart_data = get_student_academic_year_chart_by_unit_id(unit_id, db).await?;
    Ok(Json(chart_data))
}

/// Endpoint alias: get_student_yearly_trends
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_student_yearly_trends(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitStudentAcademicYearChartResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .or_else(|| req.query::<String>("unit_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;
    let unit_id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let chart_data = get_student_academic_year_chart_by_unit_id(unit_id, db).await?;
    Ok(Json(chart_data))
}

/// Helper to aggregate courses into category distribution slices with colors and credits.
/// Meets the needs of CourseCategoryPieChart in show.tsx:L919-L922.
pub fn build_course_category_distribution(
    unit_id: Uuid,
    unit_name: String,
    unit_code: Option<String>,
    courses: &[crate::dtos::academic::course::master::courses::CourseResponse],
    varieties_map: &std::collections::HashMap<Uuid, String>,
    groups_map: &std::collections::HashMap<Uuid, String>,
) -> UnitCourseCategoryDistributionResponse {
    use std::collections::HashMap;

    let mut map: HashMap<String, (i64, f64)> = HashMap::new();
    let mut total_courses: i64 = 0;
    let mut total_credits: f64 = 0.0;

    for c in courses {
        let cat_name = if c.variety_id != Uuid::nil() {
            varieties_map.get(&c.variety_id).cloned().unwrap_or_default()
        } else {
            String::new()
        };

        let cat_name = if !cat_name.is_empty() {
            cat_name
        } else if let Some(gid) = c.group_id {
            groups_map.get(&gid).cloned().unwrap_or_default()
        } else {
            String::new()
        };

        let cat_name = if !cat_name.is_empty() {
            cat_name
        } else if c.practice_credit > 0.0 && c.lecture_credit <= 0.0 {
            "Mata Kuliah Praktik".to_string()
        } else if c.lecture_credit > 0.0 && c.practice_credit <= 0.0 {
            "Mata Kuliah Teori".to_string()
        } else if c.lecture_credit > 0.0 && c.practice_credit > 0.0 {
            "Teori & Praktik".to_string()
        } else {
            "Mata Kuliah Umum".to_string()
        };

        let credits = if c.total_credit > 0.0 {
            c.total_credit
        } else {
            c.lecture_credit + c.practice_credit
        };

        let entry = map.entry(cat_name).or_insert((0, 0.0));
        entry.0 += 1;
        entry.1 += credits;
        total_courses += 1;
        total_credits += credits;
    }

    const COLOR_PALETTE: &[&str] = &[
        "#0ea5e9", // Sky Blue
        "#10b981", // Emerald
        "#f59e0b", // Amber
        "#8b5cf6", // Purple
        "#ec4899", // Pink
        "#06b6d4", // Cyan
        "#f97316", // Orange
        "#6366f1", // Indigo
        "#64748b", // Slate
    ];

    let mut data: Vec<CourseCategoryItemResponse> = map
        .into_iter()
        .enumerate()
        .map(|(idx, (name, (count, credits)))| {
            let percentage = if total_courses > 0 {
                ((count as f64 / total_courses as f64) * 10000.0).round() / 100.0
            } else {
                0.0
            };
            let rounded_credits = (credits * 100.0).round() / 100.0;
            let color = COLOR_PALETTE[idx % COLOR_PALETTE.len()].to_string();

            CourseCategoryItemResponse {
                name,
                count,
                credits: rounded_credits,
                color: Some(color),
                percentage,
            }
        })
        .collect();

    data.sort_by(|a, b| b.count.cmp(&a.count).then_with(|| a.name.cmp(&b.name)));
    let categories = data.clone();
    let total_credits = (total_credits * 100.0).round() / 100.0;

    UnitCourseCategoryDistributionResponse {
        unit_id,
        unit_name,
        unit_code,
        total_courses,
        total_credits,
        data,
        categories,
    }
}

/// Helper function to load and calculate course category distribution based on parameter unit_id.
/// Descriptive response matching CourseCategoryPieChart data requirements (show.tsx:L919-L922).
pub async fn get_course_category_distribution_by_unit_id(
    unit_id: Uuid,
    db: &DatabaseConnection,
) -> Result<UnitCourseCategoryDistributionResponse, StatusError> {
    use std::collections::HashMap;

    let unit_item = entity_mod::Entity::find_by_id(unit_id)
        .filter(entity_mod::Column::DeletedAt.is_null())
        .one(db)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
        .ok_or_else(|| StatusError::not_found().brief("Unit not found"))?;

    let unit_name = unit_item.name.clone().unwrap_or_else(|| "Program Studi".to_string());
    let unit_code = unit_item.code.clone();

    let courses = crate::dtos::academic::course::master::courses::list_courses_by_unit(db, unit_id)
        .await
        .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?;

    let varieties_map: HashMap<Uuid, String> =
        crate::models::academic::course::reference::varieties::Entity::find()
            .filter(crate::models::academic::course::reference::varieties::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|v| (v.id, v.name))
            .collect();

    let groups_map: HashMap<Uuid, String> =
        crate::models::academic::course::reference::groups::Entity::find()
            .filter(crate::models::academic::course::reference::groups::Column::DeletedAt.is_null())
            .all(db)
            .await
            .map_err(|e| StatusError::internal_server_error().brief(e.to_string()))?
            .into_iter()
            .map(|g| (g.id, g.name))
            .collect();

    Ok(build_course_category_distribution(
        unit_id,
        unit_name,
        unit_code,
        &courses,
        &varieties_map,
        &groups_map,
    ))
}

/// Alias helper function to load course category distribution based on parameter unit_id
pub async fn load_unit_course_category_distribution(
    unit_id: Uuid,
    db: &DatabaseConnection,
) -> Result<UnitCourseCategoryDistributionResponse, StatusError> {
    get_course_category_distribution_by_unit_id(unit_id, db).await
}

/// Salvo endpoint to get course category distribution pie chart based on parameter unit_id.
/// Meets all data needs for CourseCategoryPieChart in show.tsx:L919-L922.
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_course_category_distribution(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitCourseCategoryDistributionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .or_else(|| req.query::<String>("unit_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;
    let unit_id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let chart_data = get_course_category_distribution_by_unit_id(unit_id, db).await?;
    Ok(Json(chart_data))
}

/// Endpoint alias: get_course_category_pie_chart
#[endpoint(tags("Institution - Master - Unit"), status_codes(200, 400, 404, 500))]
pub async fn get_course_category_pie_chart(
    req: &mut Request,
    depot: &mut Depot,
) -> Result<Json<UnitCourseCategoryDistributionResponse>, StatusError> {
    let db = depot.get_typed::<DatabaseConnection>().map_err(|_| {
        StatusError::internal_server_error().brief("Database connection missing")
    })?;

    let id_str = req
        .param::<String>("unit_id")
        .or_else(|| req.param::<String>("id"))
        .or_else(|| req.query::<String>("unit_id"))
        .ok_or_else(|| StatusError::bad_request().brief("Missing parameter unit_id"))?;
    let unit_id = Uuid::parse_str(&id_str).map_err(|_| StatusError::bad_request().brief("Invalid UUID format"))?;

    let chart_data = get_course_category_distribution_by_unit_id(unit_id, db).await?;
    Ok(Json(chart_data))
}
