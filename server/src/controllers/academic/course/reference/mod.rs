use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod competences;
pub mod course_evaluation_bases;
pub mod curriculum_types;
pub mod encounter_types;
pub mod evaluation_types;
pub mod groups;
pub mod semesters;
pub mod varieties;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("competences")
                .get_named("academic.course.reference.competences.list_competences", competences::list_competences)
                .post_named("academic.course.reference.competences.create_competence", competences::create_competence)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.competences.get_competence", competences::get_competence)
                        .put_named("academic.course.reference.competences.update_competence", competences::update_competence)
                        .delete_named("academic.course.reference.competences.delete_competence", competences::delete_competence),
                ),
        )
        .push(
            Router::with_path("course-evaluation-bases")
                .get_named("academic.course.reference.course_evaluation_bases.list_course_evaluation_bases", course_evaluation_bases::list_course_evaluation_bases)
                .post_named("academic.course.reference.course_evaluation_bases.create_course_evaluation_base", course_evaluation_bases::create_course_evaluation_base)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.course_evaluation_bases.get_course_evaluation_base", course_evaluation_bases::get_course_evaluation_base)
                        .put_named("academic.course.reference.course_evaluation_bases.update_course_evaluation_base", course_evaluation_bases::update_course_evaluation_base)
                        .delete_named("academic.course.reference.course_evaluation_bases.delete_course_evaluation_base", course_evaluation_bases::delete_course_evaluation_base),
                ),
        )
        .push(
            Router::with_path("curriculum-types")
                .get_named("academic.course.reference.curriculum_types.list_curriculum_types", curriculum_types::list_curriculum_types)
                .post_named("academic.course.reference.curriculum_types.create_curriculum_type", curriculum_types::create_curriculum_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.curriculum_types.get_curriculum_type", curriculum_types::get_curriculum_type)
                        .put_named("academic.course.reference.curriculum_types.update_curriculum_type", curriculum_types::update_curriculum_type)
                        .delete_named("academic.course.reference.curriculum_types.delete_curriculum_type", curriculum_types::delete_curriculum_type),
                ),
        )
        .push(
            Router::with_path("encounter-types")
                .get_named("academic.course.reference.encounter_types.list_encounter_types", encounter_types::list_encounter_types)
                .post_named("academic.course.reference.encounter_types.create_encounter_type", encounter_types::create_encounter_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.encounter_types.get_encounter_type", encounter_types::get_encounter_type)
                        .put_named("academic.course.reference.encounter_types.update_encounter_type", encounter_types::update_encounter_type)
                        .delete_named("academic.course.reference.encounter_types.delete_encounter_type", encounter_types::delete_encounter_type),
                ),
        )
        .push(
            Router::with_path("evaluation-types")
                .get_named("academic.course.reference.evaluation_types.list_evaluation_types", evaluation_types::list_evaluation_types)
                .post_named("academic.course.reference.evaluation_types.create_evaluation_type", evaluation_types::create_evaluation_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.evaluation_types.get_evaluation_type", evaluation_types::get_evaluation_type)
                        .put_named("academic.course.reference.evaluation_types.update_evaluation_type", evaluation_types::update_evaluation_type)
                        .delete_named("academic.course.reference.evaluation_types.delete_evaluation_type", evaluation_types::delete_evaluation_type),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("academic.course.reference.groups.list_groups", groups::list_groups)
                .post_named("academic.course.reference.groups.create_group", groups::create_group)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.groups.get_group", groups::get_group)
                        .put_named("academic.course.reference.groups.update_group", groups::update_group)
                        .delete_named("academic.course.reference.groups.delete_group", groups::delete_group),
                ),
        )
        .push(
            Router::with_path("semesters")
                .get_named("academic.course.reference.semesters.list_semesters", semesters::list_semesters)
                .post_named("academic.course.reference.semesters.create_semester", semesters::create_semester)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.semesters.get_semester", semesters::get_semester)
                        .put_named("academic.course.reference.semesters.update_semester", semesters::update_semester)
                        .delete_named("academic.course.reference.semesters.delete_semester", semesters::delete_semester),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("academic.course.reference.varieties.list_varieties", varieties::list_varieties)
                .post_named("academic.course.reference.varieties.create_varietie", varieties::create_varietie)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.varieties.get_varietie", varieties::get_varietie)
                        .put_named("academic.course.reference.varieties.update_varietie", varieties::update_varietie)
                        .delete_named("academic.course.reference.varieties.delete_varietie", varieties::delete_varietie),
                ),
        )
}
