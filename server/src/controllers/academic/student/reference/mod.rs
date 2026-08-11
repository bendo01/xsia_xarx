use salvo::prelude::*;

pub mod finances;
pub mod registrations;
pub mod resign_statuses;
pub mod selection_types;
pub mod statuses;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("finances")
                .get(finances::list_finances)
                .post(finances::create_finance)
                .push(
                    Router::with_path("{id}")
                        .get(finances::get_finance)
                        .put(finances::update_finance)
                        .delete(finances::delete_finance),
                ),
        )
        .push(
            Router::with_path("registrations")
                .get(registrations::list_registrations)
                .post(registrations::create_registration)
                .push(
                    Router::with_path("{id}")
                        .get(registrations::get_registration)
                        .put(registrations::update_registration)
                        .delete(registrations::delete_registration),
                ),
        )
        .push(
            Router::with_path("resign-statuses")
                .get(resign_statuses::list_resign_statuses)
                .post(resign_statuses::create_resign_statuse)
                .push(
                    Router::with_path("{id}")
                        .get(resign_statuses::get_resign_statuse)
                        .put(resign_statuses::update_resign_statuse)
                        .delete(resign_statuses::delete_resign_statuse),
                ),
        )
        .push(
            Router::with_path("selection-types")
                .get(selection_types::list_selection_types)
                .post(selection_types::create_selection_type)
                .push(
                    Router::with_path("{id}")
                        .get(selection_types::get_selection_type)
                        .put(selection_types::update_selection_type)
                        .delete(selection_types::delete_selection_type),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get(statuses::list_statuses)
                .post(statuses::create_statuse)
                .push(
                    Router::with_path("{id}")
                        .get(statuses::get_statuse)
                        .put(statuses::update_statuse)
                        .delete(statuses::delete_statuse),
                ),
        )
}
