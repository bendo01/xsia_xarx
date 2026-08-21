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
                .get_named("academic.student.final_assignment.transaction.advisers.list_advisers", advisers::list_advisers)
                .post_named("academic.student.final_assignment.transaction.advisers.create_adviser", advisers::create_adviser)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.advisers.get_adviser", advisers::get_adviser)
                        .put_named("academic.student.final_assignment.transaction.advisers.update_adviser", advisers::update_adviser)
                        .delete_named("academic.student.final_assignment.transaction.advisers.delete_adviser", advisers::delete_adviser),
                ),
        )
        .push(
            Router::with_path("evaluation-details")
                .get_named("academic.student.final_assignment.transaction.evaluation_details.list_evaluation_details", evaluation_details::list_evaluation_details)
                .post_named("academic.student.final_assignment.transaction.evaluation_details.create_evaluation_detail", evaluation_details::create_evaluation_detail)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.evaluation_details.get_evaluation_detail", evaluation_details::get_evaluation_detail)
                        .put_named("academic.student.final_assignment.transaction.evaluation_details.update_evaluation_detail", evaluation_details::update_evaluation_detail)
                        .delete_named("academic.student.final_assignment.transaction.evaluation_details.delete_evaluation_detail", evaluation_details::delete_evaluation_detail),
                ),
        )
        .push(
            Router::with_path("evaluation-summaries")
                .get_named("academic.student.final_assignment.transaction.evaluation_summaries.list_evaluation_summaries", evaluation_summaries::list_evaluation_summaries)
                .post_named("academic.student.final_assignment.transaction.evaluation_summaries.create_evaluation_summarie", evaluation_summaries::create_evaluation_summarie)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.evaluation_summaries.get_evaluation_summarie", evaluation_summaries::get_evaluation_summarie)
                        .put_named("academic.student.final_assignment.transaction.evaluation_summaries.update_evaluation_summarie", evaluation_summaries::update_evaluation_summarie)
                        .delete_named("academic.student.final_assignment.transaction.evaluation_summaries.delete_evaluation_summarie", evaluation_summaries::delete_evaluation_summarie),
                ),
        )
        .push(
            Router::with_path("final-assignment-decrees")
                .get_named("academic.student.final_assignment.transaction.final_assignment_decrees.list_final_assignment_decrees", final_assignment_decrees::list_final_assignment_decrees)
                .post_named("academic.student.final_assignment.transaction.final_assignment_decrees.create_final_assignment_decree", final_assignment_decrees::create_final_assignment_decree)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.final_assignment_decrees.get_final_assignment_decree", final_assignment_decrees::get_final_assignment_decree)
                        .put_named("academic.student.final_assignment.transaction.final_assignment_decrees.update_final_assignment_decree", final_assignment_decrees::update_final_assignment_decree)
                        .delete_named("academic.student.final_assignment.transaction.final_assignment_decrees.delete_final_assignment_decree", final_assignment_decrees::delete_final_assignment_decree),
                ),
        )
        .push(
            Router::with_path("prerequisites")
                .get_named("academic.student.final_assignment.transaction.prerequisites.list_prerequisites", prerequisites::list_prerequisites)
                .post_named("academic.student.final_assignment.transaction.prerequisites.create_prerequisite", prerequisites::create_prerequisite)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.prerequisites.get_prerequisite", prerequisites::get_prerequisite)
                        .put_named("academic.student.final_assignment.transaction.prerequisites.update_prerequisite", prerequisites::update_prerequisite)
                        .delete_named("academic.student.final_assignment.transaction.prerequisites.delete_prerequisite", prerequisites::delete_prerequisite),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get_named("academic.student.final_assignment.transaction.schedules.list_schedules", schedules::list_schedules)
                .post_named("academic.student.final_assignment.transaction.schedules.create_schedule", schedules::create_schedule)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.schedules.get_schedule", schedules::get_schedule)
                        .put_named("academic.student.final_assignment.transaction.schedules.update_schedule", schedules::update_schedule)
                        .delete_named("academic.student.final_assignment.transaction.schedules.delete_schedule", schedules::delete_schedule),
                ),
        )
        .push(
            Router::with_path("submissions")
                .get_named("academic.student.final_assignment.transaction.submissions.list_submissions", submissions::list_submissions)
                .post_named("academic.student.final_assignment.transaction.submissions.create_submission", submissions::create_submission)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.final_assignment.transaction.submissions.get_submission", submissions::get_submission)
                        .put_named("academic.student.final_assignment.transaction.submissions.update_submission", submissions::update_submission)
                        .delete_named("academic.student.final_assignment.transaction.submissions.delete_submission", submissions::delete_submission),
                ),
        )
}
