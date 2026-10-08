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
                .get_named("academic.candidate.reference.document_types.list_document_types", document_types::index)
                .post_named("academic.candidate.reference.document_types.create_document_type", document_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.document_types.options_document_types", document_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.document_types.get_document_type", document_types::show)
                        .put_named("academic.candidate.reference.document_types.update_document_type", document_types::update)
                        .delete_named("academic.candidate.reference.document_types.delete_document_type", document_types::delete),
                ),
        )
        .push(
            Router::with_path("phases")
                .get_named("academic.candidate.reference.phases.list_phases", phases::index)
                .post_named("academic.candidate.reference.phases.create_phase", phases::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.phases.options_phases", phases::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.phases.get_phase", phases::show)
                        .put_named("academic.candidate.reference.phases.update_phase", phases::update)
                        .delete_named("academic.candidate.reference.phases.delete_phase", phases::delete),
                ),
        )
        .push(
            Router::with_path("registration-categories")
                .get_named("academic.candidate.reference.registration_categories.list_registration_categories", registration_categories::index)
                .post_named("academic.candidate.reference.registration_categories.create_registration_categorie", registration_categories::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.registration_categories.options_registration_categories", registration_categories::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.registration_categories.get_registration_categorie", registration_categories::show)
                        .put_named("academic.candidate.reference.registration_categories.update_registration_categorie", registration_categories::update)
                        .delete_named("academic.candidate.reference.registration_categories.delete_registration_categorie", registration_categories::delete),
                ),
        )
        .push(
            Router::with_path("registration-types")
                .get_named("academic.candidate.reference.registration_types.list_registration_types", registration_types::index)
                .post_named("academic.candidate.reference.registration_types.create_registration_type", registration_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.candidate.reference.registration_types.options_registration_types", registration_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.candidate.reference.registration_types.get_registration_type", registration_types::show)
                        .put_named("academic.candidate.reference.registration_types.update_registration_type", registration_types::update)
                        .delete_named("academic.candidate.reference.registration_types.delete_registration_type", registration_types::delete),
                ),
        )
}
