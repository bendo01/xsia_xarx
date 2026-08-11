use salvo::prelude::*;

pub mod convertions;
pub mod detail_activities;
pub mod detail_activity_evaluation_components;
pub mod student_activities;

pub fn router() -> Router {
    Router::with_path("campaign")
        .push(
            Router::with_path("convertions")
                .get(convertions::list_convertions)
                .post(convertions::create_convertion)
                .push(
                    Router::with_path("{id}")
                        .get(convertions::get_convertion)
                        .put(convertions::update_convertion)
                        .delete(convertions::delete_convertion),
                ),
        )
        .push(
            Router::with_path("detail-activities")
                .get(detail_activities::list_detail_activities)
                .post(detail_activities::create_detail_activitie)
                .push(
                    Router::with_path("{id}")
                        .get(detail_activities::get_detail_activitie)
                        .put(detail_activities::update_detail_activitie)
                        .delete(detail_activities::delete_detail_activitie),
                ),
        )
        .push(
            Router::with_path("detail-activity-evaluation-components")
                .get(detail_activity_evaluation_components::list_detail_activity_evaluation_components)
                .post(detail_activity_evaluation_components::create_detail_activity_evaluation_component)
                .push(
                    Router::with_path("{id}")
                        .get(detail_activity_evaluation_components::get_detail_activity_evaluation_component)
                        .put(detail_activity_evaluation_components::update_detail_activity_evaluation_component)
                        .delete(detail_activity_evaluation_components::delete_detail_activity_evaluation_component),
                ),
        )
        .push(
            Router::with_path("student-activities")
                .get(student_activities::list_student_activities)
                .post(student_activities::create_student_activitie)
                .push(
                    Router::with_path("{id}")
                        .get(student_activities::get_student_activitie)
                        .put(student_activities::update_student_activitie)
                        .delete(student_activities::delete_student_activitie),
                ),
        )
}
