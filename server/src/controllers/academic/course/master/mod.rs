use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod concentrations;
pub mod course_evaluation_plannings;
pub mod course_learn_plannings;
pub mod courses;
pub mod curriculum_details;
pub mod curriculums;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("concentrations")
                .get_named("academic.course.master.concentrations.index", concentrations::index)
                .post_named("academic.course.master.concentrations.store", concentrations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.concentrations.option_select", concentrations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.concentrations.show", concentrations::show)
                        .put_named("academic.course.master.concentrations.update", concentrations::update)
                        .delete_named("academic.course.master.concentrations.delete", concentrations::delete),
                ),
        )
        .push(
            Router::with_path("course-evaluation-plannings")
                .get_named("academic.course.master.course_evaluation_plannings.index", course_evaluation_plannings::index)
                .post_named("academic.course.master.course_evaluation_plannings.store", course_evaluation_plannings::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.course_evaluation_plannings.option_select", course_evaluation_plannings::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.course_evaluation_plannings.show", course_evaluation_plannings::show)
                        .put_named("academic.course.master.course_evaluation_plannings.update", course_evaluation_plannings::update)
                        .delete_named("academic.course.master.course_evaluation_plannings.delete", course_evaluation_plannings::delete),
                ),
        )
        .push(
            Router::with_path("course-learn-plannings")
                .get_named("academic.course.master.course_learn_plannings.index", course_learn_plannings::index)
                .post_named("academic.course.master.course_learn_plannings.store", course_learn_plannings::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.course_learn_plannings.option_select", course_learn_plannings::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.course_learn_plannings.show", course_learn_plannings::show)
                        .put_named("academic.course.master.course_learn_plannings.update", course_learn_plannings::update)
                        .delete_named("academic.course.master.course_learn_plannings.delete", course_learn_plannings::delete),
                ),
        )
        .push(
            Router::with_path("courses")
                .get_named("academic.course.master.courses.index", courses::index)
                .post_named("academic.course.master.courses.store", courses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.courses.option_select", courses::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.course.master.courses.get_courses_by_unit", courses::get_courses_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.courses.show", courses::show)
                        .put_named("academic.course.master.courses.update", courses::update)
                        .delete_named("academic.course.master.courses.delete", courses::delete),
                ),
        )
        .push(
            Router::with_path("curriculum-details")
                .get_named("academic.course.master.curriculum_details.index", curriculum_details::index)
                .post_named("academic.course.master.curriculum_details.store", curriculum_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.curriculum_details.option_select", curriculum_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.curriculum_details.show", curriculum_details::show)
                        .put_named("academic.course.master.curriculum_details.update", curriculum_details::update)
                        .delete_named("academic.course.master.curriculum_details.delete", curriculum_details::delete),
                ),
        )
        .push(
            Router::with_path("curriculums")
                .get_named("academic.course.master.curriculums.index", curriculums::index)
                .post_named("academic.course.master.curriculums.store", curriculums::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.curriculums.option_select", curriculums::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.course.master.curriculums.get_curriculums_by_unit", curriculums::get_curriculums_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.curriculums.show", curriculums::show)
                        .put_named("academic.course.master.curriculums.update", curriculums::update)
                        .delete_named("academic.course.master.curriculums.delete", curriculums::delete),
                ),
        )
}
