use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod candidate_unit_choices;
pub mod documents;
pub mod exams;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("candidate-unit-choices")
                .get_named("academic.candidate.transaction.candidate_unit_choices.index", candidate_unit_choices::index)
                .post_named("academic.candidate.transaction.candidate_unit_choices.store", candidate_unit_choices::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.transaction.candidate_unit_choices.option_select", candidate_unit_choices::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.candidate_unit_choices.show", candidate_unit_choices::show)
                        .put_named("academic.candidate.transaction.candidate_unit_choices.update", candidate_unit_choices::update)
                        .delete_named("academic.candidate.transaction.candidate_unit_choices.delete", candidate_unit_choices::delete),
                ),
        )
        .push(
            Router::with_path("documents")
                .get_named("academic.candidate.transaction.documents.index", documents::index)
                .post_named("academic.candidate.transaction.documents.store", documents::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.transaction.documents.option_select", documents::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.documents.show", documents::show)
                        .put_named("academic.candidate.transaction.documents.update", documents::update)
                        .delete_named("academic.candidate.transaction.documents.delete", documents::delete),
                ),
        )
        .push(
            Router::with_path("exams")
                .get_named("academic.candidate.transaction.exams.index", exams::index)
                .post_named("academic.candidate.transaction.exams.store", exams::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.transaction.exams.option_select", exams::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.transaction.exams.show", exams::show)
                        .put_named("academic.candidate.transaction.exams.update", exams::update)
                        .delete_named("academic.candidate.transaction.exams.delete", exams::delete),
                ),
        )
}
