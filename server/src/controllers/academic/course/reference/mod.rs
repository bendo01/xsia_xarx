use salvo::prelude::*;

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
                .get(competences::list_competences)
                .post(competences::create_competence)
                .push(
                    Router::with_path("{id}")
                        .get(competences::get_competence)
                        .put(competences::update_competence)
                        .delete(competences::delete_competence),
                ),
        )
        .push(
            Router::with_path("course-evaluation-bases")
                .get(course_evaluation_bases::list_course_evaluation_bases)
                .post(course_evaluation_bases::create_course_evaluation_base)
                .push(
                    Router::with_path("{id}")
                        .get(course_evaluation_bases::get_course_evaluation_base)
                        .put(course_evaluation_bases::update_course_evaluation_base)
                        .delete(course_evaluation_bases::delete_course_evaluation_base),
                ),
        )
        .push(
            Router::with_path("curriculum-types")
                .get(curriculum_types::list_curriculum_types)
                .post(curriculum_types::create_curriculum_type)
                .push(
                    Router::with_path("{id}")
                        .get(curriculum_types::get_curriculum_type)
                        .put(curriculum_types::update_curriculum_type)
                        .delete(curriculum_types::delete_curriculum_type),
                ),
        )
        .push(
            Router::with_path("encounter-types")
                .get(encounter_types::list_encounter_types)
                .post(encounter_types::create_encounter_type)
                .push(
                    Router::with_path("{id}")
                        .get(encounter_types::get_encounter_type)
                        .put(encounter_types::update_encounter_type)
                        .delete(encounter_types::delete_encounter_type),
                ),
        )
        .push(
            Router::with_path("evaluation-types")
                .get(evaluation_types::list_evaluation_types)
                .post(evaluation_types::create_evaluation_type)
                .push(
                    Router::with_path("{id}")
                        .get(evaluation_types::get_evaluation_type)
                        .put(evaluation_types::update_evaluation_type)
                        .delete(evaluation_types::delete_evaluation_type),
                ),
        )
        .push(
            Router::with_path("groups")
                .get(groups::list_groups)
                .post(groups::create_group)
                .push(
                    Router::with_path("{id}")
                        .get(groups::get_group)
                        .put(groups::update_group)
                        .delete(groups::delete_group),
                ),
        )
        .push(
            Router::with_path("semesters")
                .get(semesters::list_semesters)
                .post(semesters::create_semester)
                .push(
                    Router::with_path("{id}")
                        .get(semesters::get_semester)
                        .put(semesters::update_semester)
                        .delete(semesters::delete_semester),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get(varieties::list_varieties)
                .post(varieties::create_varietie)
                .push(
                    Router::with_path("{id}")
                        .get(varieties::get_varietie)
                        .put(varieties::update_varietie)
                        .delete(varieties::delete_varietie),
                ),
        )
}
