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
                .get_named("academic.student.campaign.convertions.index", convertions::index)
                .post_named("academic.student.campaign.convertions.store", convertions::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.campaign.convertions.option_select", convertions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.convertions.show", convertions::show)
                        .put_named("academic.student.campaign.convertions.update", convertions::update)
                        .delete_named("academic.student.campaign.convertions.delete", convertions::delete),
                ),
        )
        .push(
            Router::with_path("detail-activities")
                .get_named("academic.student.campaign.detail_activities.index", detail_activities::index)
                .post_named("academic.student.campaign.detail_activities.store", detail_activities::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.campaign.detail_activities.option_select", detail_activities::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.detail_activities.show", detail_activities::show)
                        .put_named("academic.student.campaign.detail_activities.update", detail_activities::update)
                        .delete_named("academic.student.campaign.detail_activities.delete", detail_activities::delete),
                ),
        )
        .push(
            Router::with_path("detail-activity-evaluation-components")
                .get_named("academic.student.campaign.detail_activity_evaluation_components.index", detail_activity_evaluation_components::index)
                .post_named("academic.student.campaign.detail_activity_evaluation_components.store", detail_activity_evaluation_components::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.campaign.detail_activity_evaluation_components.option_select", detail_activity_evaluation_components::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.campaign.detail_activity_evaluation_components.show", detail_activity_evaluation_components::show)
                        .put_named("academic.student.campaign.detail_activity_evaluation_components.update", detail_activity_evaluation_components::update)
                        .delete_named("academic.student.campaign.detail_activity_evaluation_components.delete", detail_activity_evaluation_components::delete),
                ),
        )
        .push(
            Router::with_path("student-activities")
                .get_named("academic.student.campaign.student_activities.index", student_activities::index)
                .post_named("academic.student.campaign.student_activities.store", student_activities::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.campaign.student_activities.option_select", student_activities::option_select),
                )
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
                        .get_named("academic.student.campaign.student_activities.show", student_activities::show)
                        .put_named("academic.student.campaign.student_activities.update", student_activities::update)
                        .delete_named("academic.student.campaign.student_activities.delete", student_activities::delete),
                ),
        )
}
