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
                .get_named("academic.student.reference.finances.list_finances", finances::index)
                .post_named("academic.student.reference.finances.create_finance", finances::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.finances.options_finances", finances::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.finances.get_finance", finances::show)
                        .put_named("academic.student.reference.finances.update_finance", finances::update)
                        .delete_named("academic.student.reference.finances.delete_finance", finances::delete),
                ),
        )
        .push(
            Router::with_path("registrations")
                .get_named("academic.student.reference.registrations.list_registrations", registrations::index)
                .post_named("academic.student.reference.registrations.create_registration", registrations::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.registrations.options_registrations", registrations::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.registrations.get_registration", registrations::show)
                        .put_named("academic.student.reference.registrations.update_registration", registrations::update)
                        .delete_named("academic.student.reference.registrations.delete_registration", registrations::delete),
                ),
        )
        .push(
            Router::with_path("resign-statuses")
                .get_named("academic.student.reference.resign_statuses.list_resign_statuses", resign_statuses::index)
                .post_named("academic.student.reference.resign_statuses.create_resign_statuse", resign_statuses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.resign_statuses.options_resign_statuses", resign_statuses::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.resign_statuses.get_resign_statuse", resign_statuses::show)
                        .put_named("academic.student.reference.resign_statuses.update_resign_statuse", resign_statuses::update)
                        .delete_named("academic.student.reference.resign_statuses.delete_resign_statuse", resign_statuses::delete),
                ),
        )
        .push(
            Router::with_path("selection-types")
                .get_named("academic.student.reference.selection_types.list_selection_types", selection_types::index)
                .post_named("academic.student.reference.selection_types.create_selection_type", selection_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.selection_types.options_selection_types", selection_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.selection_types.get_selection_type", selection_types::show)
                        .put_named("academic.student.reference.selection_types.update_selection_type", selection_types::update)
                        .delete_named("academic.student.reference.selection_types.delete_selection_type", selection_types::delete),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get_named("academic.student.reference.statuses.list_statuses", statuses::index)
                .post_named("academic.student.reference.statuses.create_statuse", statuses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.statuses.options_statuses", statuses::option_select)
                        .get_named("academic.student.reference.statuses.options_statuses_get", statuses::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.statuses.get_statuse", statuses::show)
                        .put_named("academic.student.reference.statuses.update_statuse", statuses::update)
                        .delete_named("academic.student.reference.statuses.delete_statuse", statuses::delete),
                ),
        )
}
