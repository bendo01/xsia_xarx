use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod evaluator_types;
pub mod evidence_categories;
pub mod evidence_types;
pub mod professionalisms;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("evaluator-types")
                .get_named("academic.prior_learning_recognition.reference.evaluator_types.index", evaluator_types::index)
                .post_named("academic.prior_learning_recognition.reference.evaluator_types.store", evaluator_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.evaluator_types.option_select", evaluator_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evaluator_types.show", evaluator_types::show)
                        .put_named("academic.prior_learning_recognition.reference.evaluator_types.update", evaluator_types::update)
                        .delete_named("academic.prior_learning_recognition.reference.evaluator_types.delete", evaluator_types::delete),
                ),
        )
        .push(
            Router::with_path("evidence-categories")
                .get_named("academic.prior_learning_recognition.reference.evidence_categories.index", evidence_categories::index)
                .post_named("academic.prior_learning_recognition.reference.evidence_categories.store", evidence_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.evidence_categories.option_select", evidence_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evidence_categories.show", evidence_categories::show)
                        .put_named("academic.prior_learning_recognition.reference.evidence_categories.update", evidence_categories::update)
                        .delete_named("academic.prior_learning_recognition.reference.evidence_categories.delete", evidence_categories::delete),
                ),
        )
        .push(
            Router::with_path("evidence-types")
                .get_named("academic.prior_learning_recognition.reference.evidence_types.index", evidence_types::index)
                .post_named("academic.prior_learning_recognition.reference.evidence_types.store", evidence_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.evidence_types.option_select", evidence_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evidence_types.show", evidence_types::show)
                        .put_named("academic.prior_learning_recognition.reference.evidence_types.update", evidence_types::update)
                        .delete_named("academic.prior_learning_recognition.reference.evidence_types.delete", evidence_types::delete),
                ),
        )
        .push(
            Router::with_path("professionalisms")
                .get_named("academic.prior_learning_recognition.reference.professionalisms.index", professionalisms::index)
                .post_named("academic.prior_learning_recognition.reference.professionalisms.store", professionalisms::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.professionalisms.option_select", professionalisms::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.professionalisms.show", professionalisms::show)
                        .put_named("academic.prior_learning_recognition.reference.professionalisms.update", professionalisms::update)
                        .delete_named("academic.prior_learning_recognition.reference.professionalisms.delete", professionalisms::delete),
                ),
        )
}
