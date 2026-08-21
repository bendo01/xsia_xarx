use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod decrees;
pub mod evaluation_details;
pub mod evaluations;
pub mod evaluators;
pub mod recognitions;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("decrees")
                .get_named("academic.prior_learning_recognition.transaction.decrees.list_decrees", decrees::list_decrees)
                .post_named("academic.prior_learning_recognition.transaction.decrees.create_decree", decrees::create_decree)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.decrees.get_decree", decrees::get_decree)
                        .put_named("academic.prior_learning_recognition.transaction.decrees.update_decree", decrees::update_decree)
                        .delete_named("academic.prior_learning_recognition.transaction.decrees.delete_decree", decrees::delete_decree),
                ),
        )
        .push(
            Router::with_path("evaluation-details")
                .get_named("academic.prior_learning_recognition.transaction.evaluation_details.list_evaluation_details", evaluation_details::list_evaluation_details)
                .post_named("academic.prior_learning_recognition.transaction.evaluation_details.create_evaluation_detail", evaluation_details::create_evaluation_detail)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluation_details.get_evaluation_detail", evaluation_details::get_evaluation_detail)
                        .put_named("academic.prior_learning_recognition.transaction.evaluation_details.update_evaluation_detail", evaluation_details::update_evaluation_detail)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluation_details.delete_evaluation_detail", evaluation_details::delete_evaluation_detail),
                ),
        )
        .push(
            Router::with_path("evaluations")
                .get_named("academic.prior_learning_recognition.transaction.evaluations.list_evaluations", evaluations::list_evaluations)
                .post_named("academic.prior_learning_recognition.transaction.evaluations.create_evaluation", evaluations::create_evaluation)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluations.get_evaluation", evaluations::get_evaluation)
                        .put_named("academic.prior_learning_recognition.transaction.evaluations.update_evaluation", evaluations::update_evaluation)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluations.delete_evaluation", evaluations::delete_evaluation),
                ),
        )
        .push(
            Router::with_path("evaluators")
                .get_named("academic.prior_learning_recognition.transaction.evaluators.list_evaluators", evaluators::list_evaluators)
                .post_named("academic.prior_learning_recognition.transaction.evaluators.create_evaluator", evaluators::create_evaluator)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluators.get_evaluator", evaluators::get_evaluator)
                        .put_named("academic.prior_learning_recognition.transaction.evaluators.update_evaluator", evaluators::update_evaluator)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluators.delete_evaluator", evaluators::delete_evaluator),
                ),
        )
        .push(
            Router::with_path("recognitions")
                .get_named("academic.prior_learning_recognition.transaction.recognitions.list_recognitions", recognitions::list_recognitions)
                .post_named("academic.prior_learning_recognition.transaction.recognitions.create_recognition", recognitions::create_recognition)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.recognitions.get_recognition", recognitions::get_recognition)
                        .put_named("academic.prior_learning_recognition.transaction.recognitions.update_recognition", recognitions::update_recognition)
                        .delete_named("academic.prior_learning_recognition.transaction.recognitions.delete_recognition", recognitions::delete_recognition),
                ),
        )
}
