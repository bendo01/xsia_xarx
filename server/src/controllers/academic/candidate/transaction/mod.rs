use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod candidate_unit_choices;
pub mod documents;
pub mod exams;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("candidate-unit-choices")
                .get_named("academic.candidate.transaction.candidate_unit_choices.list_candidate_unit_choices", candidate_unit_choices::list_candidate_unit_choices)
                .post_named("academic.candidate.transaction.candidate_unit_choices.create_candidate_unit_choice", candidate_unit_choices::create_candidate_unit_choice)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.candidate_unit_choices.get_candidate_unit_choice", candidate_unit_choices::get_candidate_unit_choice)
                        .put_named("academic.candidate.transaction.candidate_unit_choices.update_candidate_unit_choice", candidate_unit_choices::update_candidate_unit_choice)
                        .delete_named("academic.candidate.transaction.candidate_unit_choices.delete_candidate_unit_choice", candidate_unit_choices::delete_candidate_unit_choice),
                ),
        )
        .push(
            Router::with_path("documents")
                .get_named("academic.candidate.transaction.documents.list_documents", documents::list_documents)
                .post_named("academic.candidate.transaction.documents.create_document", documents::create_document)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.documents.get_document", documents::get_document)
                        .put_named("academic.candidate.transaction.documents.update_document", documents::update_document)
                        .delete_named("academic.candidate.transaction.documents.delete_document", documents::delete_document),
                ),
        )
        .push(
            Router::with_path("exams")
                .get_named("academic.candidate.transaction.exams.list_exams", exams::list_exams)
                .post_named("academic.candidate.transaction.exams.create_exam", exams::create_exam)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.exams.get_exam", exams::get_exam)
                        .put_named("academic.candidate.transaction.exams.update_exam", exams::update_exam)
                        .delete_named("academic.candidate.transaction.exams.delete_exam", exams::delete_exam),
                ),
        )
}
