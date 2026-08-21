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
                .get_named("academic.course.master.concentrations.list_concentrations", concentrations::list_concentrations)
                .post_named("academic.course.master.concentrations.create_concentration", concentrations::create_concentration)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.concentrations.get_concentration", concentrations::get_concentration)
                        .put_named("academic.course.master.concentrations.update_concentration", concentrations::update_concentration)
                        .delete_named("academic.course.master.concentrations.delete_concentration", concentrations::delete_concentration),
                ),
        )
        .push(
            Router::with_path("course-evaluation-plannings")
                .get_named("academic.course.master.course_evaluation_plannings.list_course_evaluation_plannings", course_evaluation_plannings::list_course_evaluation_plannings)
                .post_named("academic.course.master.course_evaluation_plannings.create_course_evaluation_planning", course_evaluation_plannings::create_course_evaluation_planning)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.course_evaluation_plannings.get_course_evaluation_planning", course_evaluation_plannings::get_course_evaluation_planning)
                        .put_named("academic.course.master.course_evaluation_plannings.update_course_evaluation_planning", course_evaluation_plannings::update_course_evaluation_planning)
                        .delete_named("academic.course.master.course_evaluation_plannings.delete_course_evaluation_planning", course_evaluation_plannings::delete_course_evaluation_planning),
                ),
        )
        .push(
            Router::with_path("course-learn-plannings")
                .get_named("academic.course.master.course_learn_plannings.list_course_learn_plannings", course_learn_plannings::list_course_learn_plannings)
                .post_named("academic.course.master.course_learn_plannings.create_course_learn_planning", course_learn_plannings::create_course_learn_planning)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.course_learn_plannings.get_course_learn_planning", course_learn_plannings::get_course_learn_planning)
                        .put_named("academic.course.master.course_learn_plannings.update_course_learn_planning", course_learn_plannings::update_course_learn_planning)
                        .delete_named("academic.course.master.course_learn_plannings.delete_course_learn_planning", course_learn_plannings::delete_course_learn_planning),
                ),
        )
        .push(
            Router::with_path("courses")
                .get_named("academic.course.master.courses.list_courses", courses::list_courses)
                .post_named("academic.course.master.courses.create_course", courses::create_course)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.courses.get_course", courses::get_course)
                        .put_named("academic.course.master.courses.update_course", courses::update_course)
                        .delete_named("academic.course.master.courses.delete_course", courses::delete_course),
                ),
        )
        .push(
            Router::with_path("curriculum-details")
                .get_named("academic.course.master.curriculum_details.list_curriculum_details", curriculum_details::list_curriculum_details)
                .post_named("academic.course.master.curriculum_details.create_curriculum_detail", curriculum_details::create_curriculum_detail)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.curriculum_details.get_curriculum_detail", curriculum_details::get_curriculum_detail)
                        .put_named("academic.course.master.curriculum_details.update_curriculum_detail", curriculum_details::update_curriculum_detail)
                        .delete_named("academic.course.master.curriculum_details.delete_curriculum_detail", curriculum_details::delete_curriculum_detail),
                ),
        )
        .push(
            Router::with_path("curriculums")
                .get_named("academic.course.master.curriculums.list_curriculums", curriculums::list_curriculums)
                .post_named("academic.course.master.curriculums.create_curriculum", curriculums::create_curriculum)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.course.master.curriculums.get_curriculum", curriculums::get_curriculum)
                        .put_named("academic.course.master.curriculums.update_curriculum", curriculums::update_curriculum)
                        .delete_named("academic.course.master.curriculums.delete_curriculum", curriculums::delete_curriculum),
                ),
        )
}
