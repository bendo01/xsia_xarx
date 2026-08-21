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
                .get_named("academic.prior_learning_recognition.reference.evaluator_types.list_evaluator_types", evaluator_types::list_evaluator_types)
                .post_named("academic.prior_learning_recognition.reference.evaluator_types.create_evaluator_type", evaluator_types::create_evaluator_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evaluator_types.get_evaluator_type", evaluator_types::get_evaluator_type)
                        .put_named("academic.prior_learning_recognition.reference.evaluator_types.update_evaluator_type", evaluator_types::update_evaluator_type)
                        .delete_named("academic.prior_learning_recognition.reference.evaluator_types.delete_evaluator_type", evaluator_types::delete_evaluator_type),
                ),
        )
        .push(
            Router::with_path("evidence-categories")
                .get_named("academic.prior_learning_recognition.reference.evidence_categories.list_evidence_categories", evidence_categories::list_evidence_categories)
                .post_named("academic.prior_learning_recognition.reference.evidence_categories.create_evidence_categorie", evidence_categories::create_evidence_categorie)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evidence_categories.get_evidence_categorie", evidence_categories::get_evidence_categorie)
                        .put_named("academic.prior_learning_recognition.reference.evidence_categories.update_evidence_categorie", evidence_categories::update_evidence_categorie)
                        .delete_named("academic.prior_learning_recognition.reference.evidence_categories.delete_evidence_categorie", evidence_categories::delete_evidence_categorie),
                ),
        )
        .push(
            Router::with_path("evidence-types")
                .get_named("academic.prior_learning_recognition.reference.evidence_types.list_evidence_types", evidence_types::list_evidence_types)
                .post_named("academic.prior_learning_recognition.reference.evidence_types.create_evidence_type", evidence_types::create_evidence_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.evidence_types.get_evidence_type", evidence_types::get_evidence_type)
                        .put_named("academic.prior_learning_recognition.reference.evidence_types.update_evidence_type", evidence_types::update_evidence_type)
                        .delete_named("academic.prior_learning_recognition.reference.evidence_types.delete_evidence_type", evidence_types::delete_evidence_type),
                ),
        )
        .push(
            Router::with_path("professionalisms")
                .get_named("academic.prior_learning_recognition.reference.professionalisms.list_professionalisms", professionalisms::list_professionalisms)
                .post_named("academic.prior_learning_recognition.reference.professionalisms.create_professionalism", professionalisms::create_professionalism)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.prior_learning_recognition.reference.professionalisms.get_professionalism", professionalisms::get_professionalism)
                        .put_named("academic.prior_learning_recognition.reference.professionalisms.update_professionalism", professionalisms::update_professionalism)
                        .delete_named("academic.prior_learning_recognition.reference.professionalisms.delete_professionalism", professionalisms::delete_professionalism),
                ),
        )
}
