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
                .get_named("academic.prior_learning_recognition.transaction.decrees.list_decrees", decrees::index)
                .post_named("academic.prior_learning_recognition.transaction.decrees.create_decree", decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.decrees.options_decrees", decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.decrees.get_decree", decrees::show)
                        .put_named("academic.prior_learning_recognition.transaction.decrees.update_decree", decrees::update)
                        .delete_named("academic.prior_learning_recognition.transaction.decrees.delete_decree", decrees::delete),
                ),
        )
        .push(
            Router::with_path("evaluation-details")
                .get_named("academic.prior_learning_recognition.transaction.evaluation_details.list_evaluation_details", evaluation_details::index)
                .post_named("academic.prior_learning_recognition.transaction.evaluation_details.create_evaluation_detail", evaluation_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.evaluation_details.options_evaluation_details", evaluation_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluation_details.get_evaluation_detail", evaluation_details::show)
                        .put_named("academic.prior_learning_recognition.transaction.evaluation_details.update_evaluation_detail", evaluation_details::update)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluation_details.delete_evaluation_detail", evaluation_details::delete),
                ),
        )
        .push(
            Router::with_path("evaluations")
                .get_named("academic.prior_learning_recognition.transaction.evaluations.list_evaluations", evaluations::index)
                .post_named("academic.prior_learning_recognition.transaction.evaluations.create_evaluation", evaluations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.evaluations.options_evaluations", evaluations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluations.get_evaluation", evaluations::show)
                        .put_named("academic.prior_learning_recognition.transaction.evaluations.update_evaluation", evaluations::update)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluations.delete_evaluation", evaluations::delete),
                ),
        )
        .push(
            Router::with_path("evaluators")
                .get_named("academic.prior_learning_recognition.transaction.evaluators.list_evaluators", evaluators::index)
                .post_named("academic.prior_learning_recognition.transaction.evaluators.create_evaluator", evaluators::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.evaluators.options_evaluators", evaluators::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluators.get_evaluator", evaluators::show)
                        .put_named("academic.prior_learning_recognition.transaction.evaluators.update_evaluator", evaluators::update)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluators.delete_evaluator", evaluators::delete),
                ),
        )
        .push(
            Router::with_path("recognitions")
                .get_named("academic.prior_learning_recognition.transaction.recognitions.list_recognitions", recognitions::index)
                .post_named("academic.prior_learning_recognition.transaction.recognitions.create_recognition", recognitions::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.recognitions.options_recognitions", recognitions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.recognitions.get_recognition", recognitions::show)
                        .put_named("academic.prior_learning_recognition.transaction.recognitions.update_recognition", recognitions::update)
                        .delete_named("academic.prior_learning_recognition.transaction.recognitions.delete_recognition", recognitions::delete),
                ),
        )
}
