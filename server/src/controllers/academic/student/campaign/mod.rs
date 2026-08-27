use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod convertions;
pub mod detail_activities;
pub mod detail_activity_evaluation_components;
pub mod student_activities;

pub fn router() -> Router {
    Router::with_path("campaign")
        .push(
            Router::with_path("convertions")
                .get_named("academic.student.campaign.convertions.list_convertions", convertions::list_convertions)
                .post_named("academic.student.campaign.convertions.create_convertion", convertions::create_convertion)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.convertions.get_convertion", convertions::get_convertion)
                        .put_named("academic.student.campaign.convertions.update_convertion", convertions::update_convertion)
                        .delete_named("academic.student.campaign.convertions.delete_convertion", convertions::delete_convertion),
                ),
        )
        .push(
            Router::with_path("detail-activities")
                .get_named("academic.student.campaign.detail_activities.list_detail_activities", detail_activities::list_detail_activities)
                .post_named("academic.student.campaign.detail_activities.create_detail_activitie", detail_activities::create_detail_activitie)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.detail_activities.get_detail_activitie", detail_activities::get_detail_activitie)
                        .put_named("academic.student.campaign.detail_activities.update_detail_activitie", detail_activities::update_detail_activitie)
                        .delete_named("academic.student.campaign.detail_activities.delete_detail_activitie", detail_activities::delete_detail_activitie),
                ),
        )
        .push(
            Router::with_path("detail-activity-evaluation-components")
                .get_named("academic.student.campaign.detail_activity_evaluation_components.list_detail_activity_evaluation_components", detail_activity_evaluation_components::list_detail_activity_evaluation_components)
                .post_named("academic.student.campaign.detail_activity_evaluation_components.create_detail_activity_evaluation_component", detail_activity_evaluation_components::create_detail_activity_evaluation_component)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.detail_activity_evaluation_components.get_detail_activity_evaluation_component", detail_activity_evaluation_components::get_detail_activity_evaluation_component)
                        .put_named("academic.student.campaign.detail_activity_evaluation_components.update_detail_activity_evaluation_component", detail_activity_evaluation_components::update_detail_activity_evaluation_component)
                        .delete_named("academic.student.campaign.detail_activity_evaluation_components.delete_detail_activity_evaluation_component", detail_activity_evaluation_components::delete_detail_activity_evaluation_component),
                ),
        )
        .push(
            Router::with_path("student-activities")
                .get_named("academic.student.campaign.student_activities.list_student_activities", student_activities::list_student_activities)
                .post_named("academic.student.campaign.student_activities.create_student_activitie", student_activities::create_student_activitie)
                .push(
                    Router::with_path("print_activity_plan/{id}")
                        .get_named("academic.student.campaign.student_activities.print_activity_plan", student_activities::print_activity_plan),
                )
                .push(
                    Router::with_path("print_activity_result/{id}")
                        .get_named("academic.student.campaign.student_activities.print_activity_result", student_activities::print_activity_result),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.student_activities.get_student_activitie", student_activities::get_student_activitie)
                        .put_named("academic.student.campaign.student_activities.update_student_activitie", student_activities::update_student_activitie)
                        .delete_named("academic.student.campaign.student_activities.delete_student_activitie", student_activities::delete_student_activitie),
                ),
        )
}
