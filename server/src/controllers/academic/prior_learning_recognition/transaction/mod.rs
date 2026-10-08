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
                .get_named("academic.prior_learning_recognition.transaction.decrees.index", decrees::index)
                .post_named("academic.prior_learning_recognition.transaction.decrees.store", decrees::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.decrees.option_select", decrees::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.decrees.show", decrees::show)
                        .put_named("academic.prior_learning_recognition.transaction.decrees.update", decrees::update)
                        .delete_named("academic.prior_learning_recognition.transaction.decrees.delete", decrees::delete),
                ),
        )
        .push(
            Router::with_path("evaluation-details")
                .get_named("academic.prior_learning_recognition.transaction.evaluation_details.index", evaluation_details::index)
                .post_named("academic.prior_learning_recognition.transaction.evaluation_details.store", evaluation_details::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.evaluation_details.option_select", evaluation_details::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluation_details.show", evaluation_details::show)
                        .put_named("academic.prior_learning_recognition.transaction.evaluation_details.update", evaluation_details::update)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluation_details.delete", evaluation_details::delete),
                ),
        )
        .push(
            Router::with_path("evaluations")
                .get_named("academic.prior_learning_recognition.transaction.evaluations.index", evaluations::index)
                .post_named("academic.prior_learning_recognition.transaction.evaluations.store", evaluations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.evaluations.option_select", evaluations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluations.show", evaluations::show)
                        .put_named("academic.prior_learning_recognition.transaction.evaluations.update", evaluations::update)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluations.delete", evaluations::delete),
                ),
        )
        .push(
            Router::with_path("evaluators")
                .get_named("academic.prior_learning_recognition.transaction.evaluators.index", evaluators::index)
                .post_named("academic.prior_learning_recognition.transaction.evaluators.store", evaluators::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.evaluators.option_select", evaluators::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.evaluators.show", evaluators::show)
                        .put_named("academic.prior_learning_recognition.transaction.evaluators.update", evaluators::update)
                        .delete_named("academic.prior_learning_recognition.transaction.evaluators.delete", evaluators::delete),
                ),
        )
        .push(
            Router::with_path("recognitions")
                .get_named("academic.prior_learning_recognition.transaction.recognitions.index", recognitions::index)
                .post_named("academic.prior_learning_recognition.transaction.recognitions.store", recognitions::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.transaction.recognitions.option_select", recognitions::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.transaction.recognitions.show", recognitions::show)
                        .put_named("academic.prior_learning_recognition.transaction.recognitions.update", recognitions::update)
                        .delete_named("academic.prior_learning_recognition.transaction.recognitions.delete", recognitions::delete),
                ),
        )
}
