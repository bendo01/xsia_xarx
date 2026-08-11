use salvo::prelude::*;

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
                .get(concentrations::list_concentrations)
                .post(concentrations::create_concentration)
                .push(
                    Router::with_path("{id}")
                        .get(concentrations::get_concentration)
                        .put(concentrations::update_concentration)
                        .delete(concentrations::delete_concentration),
                ),
        )
        .push(
            Router::with_path("course-evaluation-plannings")
                .get(course_evaluation_plannings::list_course_evaluation_plannings)
                .post(course_evaluation_plannings::create_course_evaluation_planning)
                .push(
                    Router::with_path("{id}")
                        .get(course_evaluation_plannings::get_course_evaluation_planning)
                        .put(course_evaluation_plannings::update_course_evaluation_planning)
                        .delete(course_evaluation_plannings::delete_course_evaluation_planning),
                ),
        )
        .push(
            Router::with_path("course-learn-plannings")
                .get(course_learn_plannings::list_course_learn_plannings)
                .post(course_learn_plannings::create_course_learn_planning)
                .push(
                    Router::with_path("{id}")
                        .get(course_learn_plannings::get_course_learn_planning)
                        .put(course_learn_plannings::update_course_learn_planning)
                        .delete(course_learn_plannings::delete_course_learn_planning),
                ),
        )
        .push(
            Router::with_path("courses")
                .get(courses::list_courses)
                .post(courses::create_course)
                .push(
                    Router::with_path("{id}")
                        .get(courses::get_course)
                        .put(courses::update_course)
                        .delete(courses::delete_course),
                ),
        )
        .push(
            Router::with_path("curriculum-details")
                .get(curriculum_details::list_curriculum_details)
                .post(curriculum_details::create_curriculum_detail)
                .push(
                    Router::with_path("{id}")
                        .get(curriculum_details::get_curriculum_detail)
                        .put(curriculum_details::update_curriculum_detail)
                        .delete(curriculum_details::delete_curriculum_detail),
                ),
        )
        .push(
            Router::with_path("curriculums")
                .get(curriculums::list_curriculums)
                .post(curriculums::create_curriculum)
                .push(
                    Router::with_path("{id}")
                        .get(curriculums::get_curriculum)
                        .put(curriculums::update_curriculum)
                        .delete(curriculums::delete_curriculum),
                ),
        )
}
