use salvo::prelude::*;

pub mod evaluator_types;
pub mod evidence_categories;
pub mod evidence_types;
pub mod professionalisms;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("evaluator-types")
                .get(evaluator_types::list_evaluator_types)
                .post(evaluator_types::create_evaluator_type)
                .push(
                    Router::with_path("{id}")
                        .get(evaluator_types::get_evaluator_type)
                        .put(evaluator_types::update_evaluator_type)
                        .delete(evaluator_types::delete_evaluator_type),
                ),
        )
        .push(
            Router::with_path("evidence-categories")
                .get(evidence_categories::list_evidence_categories)
                .post(evidence_categories::create_evidence_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(evidence_categories::get_evidence_categorie)
                        .put(evidence_categories::update_evidence_categorie)
                        .delete(evidence_categories::delete_evidence_categorie),
                ),
        )
        .push(
            Router::with_path("evidence-types")
                .get(evidence_types::list_evidence_types)
                .post(evidence_types::create_evidence_type)
                .push(
                    Router::with_path("{id}")
                        .get(evidence_types::get_evidence_type)
                        .put(evidence_types::update_evidence_type)
                        .delete(evidence_types::delete_evidence_type),
                ),
        )
        .push(
            Router::with_path("professionalisms")
                .get(professionalisms::list_professionalisms)
                .post(professionalisms::create_professionalism)
                .push(
                    Router::with_path("{id}")
                        .get(professionalisms::get_professionalism)
                        .put(professionalisms::update_professionalism)
                        .delete(professionalisms::delete_professionalism),
                ),
        )
}
