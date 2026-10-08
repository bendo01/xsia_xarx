use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod advisers;
pub mod evaluation_details;
pub mod evaluation_summaries;
pub mod final_assignment_decrees;
pub mod prerequisites;
pub mod schedules;
pub mod submissions;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("advisers")
                .get_named("academic.student.final_assignment.transaction.advisers.index", advisers::index)
                .post_named("academic.student.final_assignment.transaction.advisers.store", advisers::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.advisers.option_select", advisers::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.advisers.show", advisers::show)
                        .put_named("academic.student.final_assignment.transaction.advisers.update", advisers::update)
                        .delete_named("academic.student.final_assignment.transaction.advisers.delete", advisers::delete),
                ),
        )
        .push(
            Router::with_path("evaluation-details")
                .get_named("academic.student.final_assignment.transaction.evaluation_details.index", evaluation_details::index)
                .post_named("academic.student.final_assignment.transaction.evaluation_details.store", evaluation_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.evaluation_details.option_select", evaluation_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.evaluation_details.show", evaluation_details::show)
                        .put_named("academic.student.final_assignment.transaction.evaluation_details.update", evaluation_details::update)
                        .delete_named("academic.student.final_assignment.transaction.evaluation_details.delete", evaluation_details::delete),
                ),
        )
        .push(
            Router::with_path("evaluation-summaries")
                .get_named("academic.student.final_assignment.transaction.evaluation_summaries.index", evaluation_summaries::index)
                .post_named("academic.student.final_assignment.transaction.evaluation_summaries.store", evaluation_summaries::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.evaluation_summaries.option_select", evaluation_summaries::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.evaluation_summaries.show", evaluation_summaries::show)
                        .put_named("academic.student.final_assignment.transaction.evaluation_summaries.update", evaluation_summaries::update)
                        .delete_named("academic.student.final_assignment.transaction.evaluation_summaries.delete", evaluation_summaries::delete),
                ),
        )
        .push(
            Router::with_path("final-assignment-decrees")
                .get_named("academic.student.final_assignment.transaction.final_assignment_decrees.index", final_assignment_decrees::index)
                .post_named("academic.student.final_assignment.transaction.final_assignment_decrees.store", final_assignment_decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.final_assignment_decrees.option_select", final_assignment_decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.final_assignment_decrees.show", final_assignment_decrees::show)
                        .put_named("academic.student.final_assignment.transaction.final_assignment_decrees.update", final_assignment_decrees::update)
                        .delete_named("academic.student.final_assignment.transaction.final_assignment_decrees.delete", final_assignment_decrees::delete),
                ),
        )
        .push(
            Router::with_path("prerequisites")
                .get_named("academic.student.final_assignment.transaction.prerequisites.index", prerequisites::index)
                .post_named("academic.student.final_assignment.transaction.prerequisites.store", prerequisites::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.prerequisites.option_select", prerequisites::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.prerequisites.show", prerequisites::show)
                        .put_named("academic.student.final_assignment.transaction.prerequisites.update", prerequisites::update)
                        .delete_named("academic.student.final_assignment.transaction.prerequisites.delete", prerequisites::delete),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get_named("academic.student.final_assignment.transaction.schedules.index", schedules::index)
                .post_named("academic.student.final_assignment.transaction.schedules.store", schedules::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.schedules.option_select", schedules::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.schedules.show", schedules::show)
                        .put_named("academic.student.final_assignment.transaction.schedules.update", schedules::update)
                        .delete_named("academic.student.final_assignment.transaction.schedules.delete", schedules::delete),
                ),
        )
        .push(
            Router::with_path("submissions")
                .get_named("academic.student.final_assignment.transaction.submissions.index", submissions::index)
                .post_named("academic.student.final_assignment.transaction.submissions.store", submissions::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.final_assignment.transaction.submissions.option_select", submissions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.submissions.show", submissions::show)
                        .put_named("academic.student.final_assignment.transaction.submissions.update", submissions::update)
                        .delete_named("academic.student.final_assignment.transaction.submissions.delete", submissions::delete),
                ),
        )
}
