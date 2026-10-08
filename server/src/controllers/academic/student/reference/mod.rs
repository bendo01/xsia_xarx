use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod finances;
pub mod registrations;
pub mod resign_statuses;
pub mod selection_types;
pub mod statuses;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("finances")
                .get_named("academic.student.reference.finances.index", finances::index)
                .post_named("academic.student.reference.finances.store", finances::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.finances.option_select", finances::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.finances.show", finances::show)
                        .put_named("academic.student.reference.finances.update", finances::update)
                        .delete_named("academic.student.reference.finances.delete", finances::delete),
                ),
        )
        .push(
            Router::with_path("registrations")
                .get_named("academic.student.reference.registrations.index", registrations::index)
                .post_named("academic.student.reference.registrations.store", registrations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.registrations.option_select", registrations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.registrations.show", registrations::show)
                        .put_named("academic.student.reference.registrations.update", registrations::update)
                        .delete_named("academic.student.reference.registrations.delete", registrations::delete),
                ),
        )
        .push(
            Router::with_path("resign-statuses")
                .get_named("academic.student.reference.resign_statuses.index", resign_statuses::index)
                .post_named("academic.student.reference.resign_statuses.store", resign_statuses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.resign_statuses.option_select", resign_statuses::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.resign_statuses.show", resign_statuses::show)
                        .put_named("academic.student.reference.resign_statuses.update", resign_statuses::update)
                        .delete_named("academic.student.reference.resign_statuses.delete", resign_statuses::delete),
                ),
        )
        .push(
            Router::with_path("selection-types")
                .get_named("academic.student.reference.selection_types.index", selection_types::index)
                .post_named("academic.student.reference.selection_types.store", selection_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.selection_types.option_select", selection_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.selection_types.show", selection_types::show)
                        .put_named("academic.student.reference.selection_types.update", selection_types::update)
                        .delete_named("academic.student.reference.selection_types.delete", selection_types::delete),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get_named("academic.student.reference.statuses.index", statuses::index)
                .post_named("academic.student.reference.statuses.store", statuses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.statuses.option_select", statuses::option_select)
                        .get_named("academic.student.reference.statuses.option_select_get", statuses::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.statuses.show", statuses::show)
                        .put_named("academic.student.reference.statuses.update", statuses::update)
                        .delete_named("academic.student.reference.statuses.delete", statuses::delete),
                ),
        )
}
