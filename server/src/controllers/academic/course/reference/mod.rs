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
                .get_named("academic.course.reference.competences.index", competences::index)
                .post_named("academic.course.reference.competences.store", competences::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.competences.option_select", competences::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.competences.show", competences::show)
                        .put_named("academic.course.reference.competences.update", competences::update)
                        .delete_named("academic.course.reference.competences.delete", competences::delete),
                ),
        )
        .push(
            Router::with_path("course-evaluation-bases")
                .get_named("academic.course.reference.course_evaluation_bases.index", course_evaluation_bases::index)
                .post_named("academic.course.reference.course_evaluation_bases.store", course_evaluation_bases::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.course_evaluation_bases.option_select", course_evaluation_bases::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.course_evaluation_bases.show", course_evaluation_bases::show)
                        .put_named("academic.course.reference.course_evaluation_bases.update", course_evaluation_bases::update)
                        .delete_named("academic.course.reference.course_evaluation_bases.delete", course_evaluation_bases::delete),
                ),
        )
        .push(
            Router::with_path("curriculum-types")
                .get_named("academic.course.reference.curriculum_types.index", curriculum_types::index)
                .post_named("academic.course.reference.curriculum_types.store", curriculum_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.curriculum_types.option_select", curriculum_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.curriculum_types.show", curriculum_types::show)
                        .put_named("academic.course.reference.curriculum_types.update", curriculum_types::update)
                        .delete_named("academic.course.reference.curriculum_types.delete", curriculum_types::delete),
                ),
        )
        .push(
            Router::with_path("encounter-types")
                .get_named("academic.course.reference.encounter_types.index", encounter_types::index)
                .post_named("academic.course.reference.encounter_types.store", encounter_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.encounter_types.option_select", encounter_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.encounter_types.show", encounter_types::show)
                        .put_named("academic.course.reference.encounter_types.update", encounter_types::update)
                        .delete_named("academic.course.reference.encounter_types.delete", encounter_types::delete),
                ),
        )
        .push(
            Router::with_path("evaluation-types")
                .get_named("academic.course.reference.evaluation_types.index", evaluation_types::index)
                .post_named("academic.course.reference.evaluation_types.store", evaluation_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.evaluation_types.option_select", evaluation_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.evaluation_types.show", evaluation_types::show)
                        .put_named("academic.course.reference.evaluation_types.update", evaluation_types::update)
                        .delete_named("academic.course.reference.evaluation_types.delete", evaluation_types::delete),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("academic.course.reference.groups.index", groups::index)
                .post_named("academic.course.reference.groups.store", groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.groups.option_select", groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.groups.show", groups::show)
                        .put_named("academic.course.reference.groups.update", groups::update)
                        .delete_named("academic.course.reference.groups.delete", groups::delete),
                ),
        )
        .push(
            Router::with_path("semesters")
                .get_named("academic.course.reference.semesters.index", semesters::index)
                .post_named("academic.course.reference.semesters.store", semesters::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.semesters.option_select", semesters::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.semesters.show", semesters::show)
                        .put_named("academic.course.reference.semesters.update", semesters::update)
                        .delete_named("academic.course.reference.semesters.delete", semesters::delete),
                ),
        )
        .push(
            Router::with_path("varieties")
                .get_named("academic.course.reference.varieties.index", varieties::index)
                .post_named("academic.course.reference.varieties.store", varieties::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.reference.varieties.option_select", varieties::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.reference.varieties.show", varieties::show)
                        .put_named("academic.course.reference.varieties.update", varieties::update)
                        .delete_named("academic.course.reference.varieties.delete", varieties::delete),
                ),
        )
}
