use salvo::prelude::*;

pub mod decrees;
pub mod evaluation_details;
pub mod evaluations;
pub mod evaluators;
pub mod recognitions;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("decrees")
                .get(decrees::list_decrees)
                .post(decrees::create_decree)
                .push(
                    Router::with_path("{id}")
                        .get(decrees::get_decree)
                        .put(decrees::update_decree)
                        .delete(decrees::delete_decree),
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
            Router::with_path("evaluations")
                .get(evaluations::list_evaluations)
                .post(evaluations::create_evaluation)
                .push(
                    Router::with_path("{id}")
                        .get(evaluations::get_evaluation)
                        .put(evaluations::update_evaluation)
                        .delete(evaluations::delete_evaluation),
                ),
        )
        .push(
            Router::with_path("evaluators")
                .get(evaluators::list_evaluators)
                .post(evaluators::create_evaluator)
                .push(
                    Router::with_path("{id}")
                        .get(evaluators::get_evaluator)
                        .put(evaluators::update_evaluator)
                        .delete(evaluators::delete_evaluator),
                ),
        )
        .push(
            Router::with_path("recognitions")
                .get(recognitions::list_recognitions)
                .post(recognitions::create_recognition)
                .push(
                    Router::with_path("{id}")
                        .get(recognitions::get_recognition)
                        .put(recognitions::update_recognition)
                        .delete(recognitions::delete_recognition),
                ),
        )
}
