use salvo::prelude::*;

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
                .get(advisers::list_advisers)
                .post(advisers::create_adviser)
                .push(
                    Router::with_path("{id}")
                        .get(advisers::get_adviser)
                        .put(advisers::update_adviser)
                        .delete(advisers::delete_adviser),
                ),
        )
        .push(
            Router::with_path("evaluation-details")
                .get(evaluation_details::list_evaluation_details)
                .post(evaluation_details::create_evaluation_detail)
                .push(
                    Router::with_path("{id}")
                        .get(evaluation_details::get_evaluation_detail)
                        .put(evaluation_details::update_evaluation_detail)
                        .delete(evaluation_details::delete_evaluation_detail),
                ),
        )
        .push(
            Router::with_path("evaluation-summaries")
                .get(evaluation_summaries::list_evaluation_summaries)
                .post(evaluation_summaries::create_evaluation_summarie)
                .push(
                    Router::with_path("{id}")
                        .get(evaluation_summaries::get_evaluation_summarie)
                        .put(evaluation_summaries::update_evaluation_summarie)
                        .delete(evaluation_summaries::delete_evaluation_summarie),
                ),
        )
        .push(
            Router::with_path("final-assignment-decrees")
                .get(final_assignment_decrees::list_final_assignment_decrees)
                .post(final_assignment_decrees::create_final_assignment_decree)
                .push(
                    Router::with_path("{id}")
                        .get(final_assignment_decrees::get_final_assignment_decree)
                        .put(final_assignment_decrees::update_final_assignment_decree)
                        .delete(final_assignment_decrees::delete_final_assignment_decree),
                ),
        )
        .push(
            Router::with_path("prerequisites")
                .get(prerequisites::list_prerequisites)
                .post(prerequisites::create_prerequisite)
                .push(
                    Router::with_path("{id}")
                        .get(prerequisites::get_prerequisite)
                        .put(prerequisites::update_prerequisite)
                        .delete(prerequisites::delete_prerequisite),
                ),
        )
        .push(
            Router::with_path("schedules")
                .get(schedules::list_schedules)
                .post(schedules::create_schedule)
                .push(
                    Router::with_path("{id}")
                        .get(schedules::get_schedule)
                        .put(schedules::update_schedule)
                        .delete(schedules::delete_schedule),
                ),
        )
        .push(
            Router::with_path("submissions")
                .get(submissions::list_submissions)
                .post(submissions::create_submission)
                .push(
                    Router::with_path("{id}")
                        .get(submissions::get_submission)
                        .put(submissions::update_submission)
                        .delete(submissions::delete_submission),
                ),
        )
}
