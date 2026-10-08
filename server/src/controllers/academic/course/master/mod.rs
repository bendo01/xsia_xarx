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
                .get_named("academic.course.master.concentrations.list_concentrations", concentrations::index)
                .post_named("academic.course.master.concentrations.create_concentration", concentrations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.concentrations.options_concentrations", concentrations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.concentrations.get_concentration", concentrations::show)
                        .put_named("academic.course.master.concentrations.update_concentration", concentrations::update)
                        .delete_named("academic.course.master.concentrations.delete_concentration", concentrations::delete),
                ),
        )
        .push(
            Router::with_path("course-evaluation-plannings")
                .get_named("academic.course.master.course_evaluation_plannings.list_course_evaluation_plannings", course_evaluation_plannings::index)
                .post_named("academic.course.master.course_evaluation_plannings.create_course_evaluation_planning", course_evaluation_plannings::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.course_evaluation_plannings.options_course_evaluation_plannings", course_evaluation_plannings::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.course_evaluation_plannings.get_course_evaluation_planning", course_evaluation_plannings::show)
                        .put_named("academic.course.master.course_evaluation_plannings.update_course_evaluation_planning", course_evaluation_plannings::update)
                        .delete_named("academic.course.master.course_evaluation_plannings.delete_course_evaluation_planning", course_evaluation_plannings::delete),
                ),
        )
        .push(
            Router::with_path("course-learn-plannings")
                .get_named("academic.course.master.course_learn_plannings.list_course_learn_plannings", course_learn_plannings::index)
                .post_named("academic.course.master.course_learn_plannings.create_course_learn_planning", course_learn_plannings::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.course_learn_plannings.options_course_learn_plannings", course_learn_plannings::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.course_learn_plannings.get_course_learn_planning", course_learn_plannings::show)
                        .put_named("academic.course.master.course_learn_plannings.update_course_learn_planning", course_learn_plannings::update)
                        .delete_named("academic.course.master.course_learn_plannings.delete_course_learn_planning", course_learn_plannings::delete),
                ),
        )
        .push(
            Router::with_path("courses")
                .get_named("academic.course.master.courses.list_courses", courses::index)
                .post_named("academic.course.master.courses.create_course", courses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.courses.options_courses", courses::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.course.master.courses.get_courses_by_unit", courses::get_courses_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.courses.get_course", courses::show)
                        .put_named("academic.course.master.courses.update_course", courses::update)
                        .delete_named("academic.course.master.courses.delete_course", courses::delete),
                ),
        )
        .push(
            Router::with_path("curriculum-details")
                .get_named("academic.course.master.curriculum_details.list_curriculum_details", curriculum_details::index)
                .post_named("academic.course.master.curriculum_details.create_curriculum_detail", curriculum_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.curriculum_details.options_curriculum_details", curriculum_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.curriculum_details.get_curriculum_detail", curriculum_details::show)
                        .put_named("academic.course.master.curriculum_details.update_curriculum_detail", curriculum_details::update)
                        .delete_named("academic.course.master.curriculum_details.delete_curriculum_detail", curriculum_details::delete),
                ),
        )
        .push(
            Router::with_path("curriculums")
                .get_named("academic.course.master.curriculums.list_curriculums", curriculums::index)
                .post_named("academic.course.master.curriculums.create_curriculum", curriculums::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.course.master.curriculums.options_curriculums", curriculums::option_select),
                )
                .push(
                    Router::with_path("unit/{unit_id}")
                        .get_named("academic.course.master.curriculums.get_curriculums_by_unit", curriculums::get_curriculums_by_unit),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.curriculums.get_curriculum", curriculums::show)
                        .put_named("academic.course.master.curriculums.update_curriculum", curriculums::update)
                        .delete_named("academic.course.master.curriculums.delete_curriculum", curriculums::delete),
                ),
        )
}
