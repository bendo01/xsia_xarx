use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod candidate_unit_choices;
pub mod documents;
pub mod exams;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("candidate-unit-choices")
                .get_named("academic.candidate.transaction.candidate_unit_choices.list_candidate_unit_choices", candidate_unit_choices::index)
                .post_named("academic.candidate.transaction.candidate_unit_choices.create_candidate_unit_choice", candidate_unit_choices::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.transaction.candidate_unit_choices.options_candidate_unit_choices", candidate_unit_choices::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.candidate_unit_choices.get_candidate_unit_choice", candidate_unit_choices::show)
                        .put_named("academic.candidate.transaction.candidate_unit_choices.update_candidate_unit_choice", candidate_unit_choices::update)
                        .delete_named("academic.candidate.transaction.candidate_unit_choices.delete_candidate_unit_choice", candidate_unit_choices::delete),
                ),
        )
        .push(
            Router::with_path("documents")
                .get_named("academic.candidate.transaction.documents.list_documents", documents::index)
                .post_named("academic.candidate.transaction.documents.create_document", documents::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.transaction.documents.options_documents", documents::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.documents.get_document", documents::show)
                        .put_named("academic.candidate.transaction.documents.update_document", documents::update)
                        .delete_named("academic.candidate.transaction.documents.delete_document", documents::delete),
                ),
        )
        .push(
            Router::with_path("exams")
                .get_named("academic.candidate.transaction.exams.list_exams", exams::index)
                .post_named("academic.candidate.transaction.exams.create_exam", exams::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.transaction.exams.options_exams", exams::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.exams.get_exam", exams::show)
                        .put_named("academic.candidate.transaction.exams.update_exam", exams::update)
                        .delete_named("academic.candidate.transaction.exams.delete_exam", exams::delete),
                ),
        )
}
