use salvo::prelude::*;

pub mod document_types;
pub mod phases;
pub mod registration_categories;
pub mod registration_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("document-types")
                .get(document_types::list_document_types)
                .post(document_types::create_document_type)
                .push(
                    Router::with_path("{id}")
                        .get(document_types::get_document_type)
                        .put(document_types::update_document_type)
                        .delete(document_types::delete_document_type),
                ),
        )
        .push(
            Router::with_path("phases")
                .get(phases::list_phases)
                .post(phases::create_phase)
                .push(
                    Router::with_path("{id}")
                        .get(phases::get_phase)
                        .put(phases::update_phase)
                        .delete(phases::delete_phase),
                ),
        )
        .push(
            Router::with_path("registration-categories")
                .get(registration_categories::list_registration_categories)
                .post(registration_categories::create_registration_categorie)
                .push(
                    Router::with_path("{id}")
                        .get(registration_categories::get_registration_categorie)
                        .put(registration_categories::update_registration_categorie)
                        .delete(registration_categories::delete_registration_categorie),
                ),
        )
        .push(
            Router::with_path("registration-types")
                .get(registration_types::list_registration_types)
                .post(registration_types::create_registration_type)
                .push(
                    Router::with_path("{id}")
                        .get(registration_types::get_registration_type)
                        .put(registration_types::update_registration_type)
                        .delete(registration_types::delete_registration_type),
                ),
        )
}
