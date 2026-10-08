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
                .get_named("academic.prior_learning_recognition.reference.evaluator_types.list_evaluator_types", evaluator_types::index)
                .post_named("academic.prior_learning_recognition.reference.evaluator_types.create_evaluator_type", evaluator_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.evaluator_types.options_evaluator_types", evaluator_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evaluator_types.get_evaluator_type", evaluator_types::show)
                        .put_named("academic.prior_learning_recognition.reference.evaluator_types.update_evaluator_type", evaluator_types::update)
                        .delete_named("academic.prior_learning_recognition.reference.evaluator_types.delete_evaluator_type", evaluator_types::delete),
                ),
        )
        .push(
            Router::with_path("evidence-categories")
                .get_named("academic.prior_learning_recognition.reference.evidence_categories.list_evidence_categories", evidence_categories::index)
                .post_named("academic.prior_learning_recognition.reference.evidence_categories.create_evidence_categorie", evidence_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.evidence_categories.options_evidence_categories", evidence_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evidence_categories.get_evidence_categorie", evidence_categories::show)
                        .put_named("academic.prior_learning_recognition.reference.evidence_categories.update_evidence_categorie", evidence_categories::update)
                        .delete_named("academic.prior_learning_recognition.reference.evidence_categories.delete_evidence_categorie", evidence_categories::delete),
                ),
        )
        .push(
            Router::with_path("evidence-types")
                .get_named("academic.prior_learning_recognition.reference.evidence_types.list_evidence_types", evidence_types::index)
                .post_named("academic.prior_learning_recognition.reference.evidence_types.create_evidence_type", evidence_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.evidence_types.options_evidence_types", evidence_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evidence_types.get_evidence_type", evidence_types::show)
                        .put_named("academic.prior_learning_recognition.reference.evidence_types.update_evidence_type", evidence_types::update)
                        .delete_named("academic.prior_learning_recognition.reference.evidence_types.delete_evidence_type", evidence_types::delete),
                ),
        )
        .push(
            Router::with_path("professionalisms")
                .get_named("academic.prior_learning_recognition.reference.professionalisms.list_professionalisms", professionalisms::index)
                .post_named("academic.prior_learning_recognition.reference.professionalisms.create_professionalism", professionalisms::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.prior_learning_recognition.reference.professionalisms.options_professionalisms", professionalisms::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.professionalisms.get_professionalism", professionalisms::show)
                        .put_named("academic.prior_learning_recognition.reference.professionalisms.update_professionalism", professionalisms::update)
                        .delete_named("academic.prior_learning_recognition.reference.professionalisms.delete_professionalism", professionalisms::delete),
                ),
        )
}
