use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod document_types;
pub mod phases;
pub mod registration_categories;
pub mod registration_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("document-types")
                .get_named("academic.candidate.reference.document_types.index", document_types::index)
                .post_named("academic.candidate.reference.document_types.store", document_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.document_types.option_select", document_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.document_types.show", document_types::show)
                        .put_named("academic.candidate.reference.document_types.update", document_types::update)
                        .delete_named("academic.candidate.reference.document_types.delete", document_types::delete),
                ),
        )
        .push(
            Router::with_path("phases")
                .get_named("academic.candidate.reference.phases.index", phases::index)
                .post_named("academic.candidate.reference.phases.store", phases::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.phases.option_select", phases::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.phases.show", phases::show)
                        .put_named("academic.candidate.reference.phases.update", phases::update)
                        .delete_named("academic.candidate.reference.phases.delete", phases::delete),
                ),
        )
        .push(
            Router::with_path("registration-categories")
                .get_named("academic.candidate.reference.registration_categories.index", registration_categories::index)
                .post_named("academic.candidate.reference.registration_categories.store", registration_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.registration_categories.option_select", registration_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.registration_categories.show", registration_categories::show)
                        .put_named("academic.candidate.reference.registration_categories.update", registration_categories::update)
                        .delete_named("academic.candidate.reference.registration_categories.delete", registration_categories::delete),
                ),
        )
        .push(
            Router::with_path("registration-types")
                .get_named("academic.candidate.reference.registration_types.index", registration_types::index)
                .post_named("academic.candidate.reference.registration_types.store", registration_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.registration_types.option_select", registration_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.registration_types.show", registration_types::show)
                        .put_named("academic.candidate.reference.registration_types.update", registration_types::update)
                        .delete_named("academic.candidate.reference.registration_types.delete", registration_types::delete),
                ),
        )
}
