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
                .get_named("academic.course.reference.competences.list_competences", competences::index)
                .post_named("academic.course.reference.competences.create_competence", competences::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.competences.options_competences", competences::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.competences.get_competence", competences::show)
                        .put_named("academic.course.reference.competences.update_competence", competences::update)
                        .delete_named("academic.course.reference.competences.delete_competence", competences::delete),
                ),
        )
        .push(
            Router::with_path("course-evaluation-bases")
                .get_named("academic.course.reference.course_evaluation_bases.list_course_evaluation_bases", course_evaluation_bases::index)
                .post_named("academic.course.reference.course_evaluation_bases.create_course_evaluation_base", course_evaluation_bases::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.course_evaluation_bases.options_course_evaluation_bases", course_evaluation_bases::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.course_evaluation_bases.get_course_evaluation_base", course_evaluation_bases::show)
                        .put_named("academic.course.reference.course_evaluation_bases.update_course_evaluation_base", course_evaluation_bases::update)
                        .delete_named("academic.course.reference.course_evaluation_bases.delete_course_evaluation_base", course_evaluation_bases::delete),
                ),
        )
        .push(
            Router::with_path("curriculum-types")
                .get_named("academic.course.reference.curriculum_types.list_curriculum_types", curriculum_types::index)
                .post_named("academic.course.reference.curriculum_types.create_curriculum_type", curriculum_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.curriculum_types.options_curriculum_types", curriculum_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.curriculum_types.get_curriculum_type", curriculum_types::show)
                        .put_named("academic.course.reference.curriculum_types.update_curriculum_type", curriculum_types::update)
                        .delete_named("academic.course.reference.curriculum_types.delete_curriculum_type", curriculum_types::delete),
                ),
        )
        .push(
            Router::with_path("encounter-types")
                .get_named("academic.course.reference.encounter_types.list_encounter_types", encounter_types::index)
                .post_named("academic.course.reference.encounter_types.create_encounter_type", encounter_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.encounter_types.options_encounter_types", encounter_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.encounter_types.get_encounter_type", encounter_types::show)
                        .put_named("academic.course.reference.encounter_types.update_encounter_type", encounter_types::update)
                        .delete_named("academic.course.reference.encounter_types.delete_encounter_type", encounter_types::delete),
                ),
        )
        .push(
            Router::with_path("evaluation-types")
                .get_named("academic.course.reference.evaluation_types.list_evaluation_types", evaluation_types::index)
                .post_named("academic.course.reference.evaluation_types.create_evaluation_type", evaluation_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.evaluation_types.options_evaluation_types", evaluation_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.evaluation_types.get_evaluation_type", evaluation_types::show)
                        .put_named("academic.course.reference.evaluation_types.update_evaluation_type", evaluation_types::update)
                        .delete_named("academic.course.reference.evaluation_types.delete_evaluation_type", evaluation_types::delete),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("academic.course.reference.groups.list_groups", groups::index)
                .post_named("academic.course.reference.groups.create_group", groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.groups.options_groups", groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.groups.get_group", groups::show)
                        .put_named("academic.course.reference.groups.update_group", groups::update)
                        .delete_named("academic.course.reference.groups.delete_group", groups::delete),
                ),
        )
        .push(
            Router::with_path("semesters")
                .get_named("academic.course.reference.semesters.list_semesters", semesters::index)
                .post_named("academic.course.reference.semesters.create_semester", semesters::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.semesters.options_semesters", semesters::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.semesters.get_semester", semesters::show)
                        .put_named("academic.course.reference.semesters.update_semester", semesters::update)
                        .delete_named("academic.course.reference.semesters.delete_semester", semesters::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("academic.course.reference.varieties.list_varieties", varieties::index)
                .post_named("academic.course.reference.varieties.create_varietie", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.varieties.options_varieties", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.varieties.get_varietie", varieties::show)
                        .put_named("academic.course.reference.varieties.update_varietie", varieties::update)
                        .delete_named("academic.course.reference.varieties.delete_varietie", varieties::delete),
                ),
        )
}
