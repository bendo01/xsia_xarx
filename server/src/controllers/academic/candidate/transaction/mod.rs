use salvo::prelude::*;

pub mod candidate_unit_choices;
pub mod documents;
pub mod exams;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("candidate-unit-choices")
                .get(candidate_unit_choices::list_candidate_unit_choices)
                .post(candidate_unit_choices::create_candidate_unit_choice)
                .push(
                    Router::with_path("{id}")
                        .get(candidate_unit_choices::get_candidate_unit_choice)
                        .put(candidate_unit_choices::update_candidate_unit_choice)
                        .delete(candidate_unit_choices::delete_candidate_unit_choice),
                ),
        )
        .push(
            Router::with_path("documents")
                .get(documents::list_documents)
                .post(documents::create_document)
                .push(
                    Router::with_path("{id}")
                        .get(documents::get_document)
                        .put(documents::update_document)
                        .delete(documents::delete_document),
                ),
        )
        .push(
            Router::with_path("exams")
                .get(exams::list_exams)
                .post(exams::create_exam)
                .push(
                    Router::with_path("{id}")
                        .get(exams::get_exam)
                        .put(exams::update_exam)
                        .delete(exams::delete_exam),
                ),
        )
}
