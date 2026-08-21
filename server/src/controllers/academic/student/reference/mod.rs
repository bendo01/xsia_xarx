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
                .get_named("academic.student.reference.finances.list_finances", finances::list_finances)
                .post_named("academic.student.reference.finances.create_finance", finances::create_finance)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.finances.options_finances", finances::options_finances),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.finances.get_finance", finances::get_finance)
                        .put_named("academic.student.reference.finances.update_finance", finances::update_finance)
                        .delete_named("academic.student.reference.finances.delete_finance", finances::delete_finance),
                ),
        )
        .push(
            Router::with_path("registrations")
                .get_named("academic.student.reference.registrations.list_registrations", registrations::list_registrations)
                .post_named("academic.student.reference.registrations.create_registration", registrations::create_registration)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.registrations.options_registrations", registrations::options_registrations),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.registrations.get_registration", registrations::get_registration)
                        .put_named("academic.student.reference.registrations.update_registration", registrations::update_registration)
                        .delete_named("academic.student.reference.registrations.delete_registration", registrations::delete_registration),
                ),
        )
        .push(
            Router::with_path("resign-statuses")
                .get_named("academic.student.reference.resign_statuses.list_resign_statuses", resign_statuses::list_resign_statuses)
                .post_named("academic.student.reference.resign_statuses.create_resign_statuse", resign_statuses::create_resign_statuse)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.resign_statuses.options_resign_statuses", resign_statuses::options_resign_statuses),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.resign_statuses.get_resign_statuse", resign_statuses::get_resign_statuse)
                        .put_named("academic.student.reference.resign_statuses.update_resign_statuse", resign_statuses::update_resign_statuse)
                        .delete_named("academic.student.reference.resign_statuses.delete_resign_statuse", resign_statuses::delete_resign_statuse),
                ),
        )
        .push(
            Router::with_path("selection-types")
                .get_named("academic.student.reference.selection_types.list_selection_types", selection_types::list_selection_types)
                .post_named("academic.student.reference.selection_types.create_selection_type", selection_types::create_selection_type)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.selection_types.options_selection_types", selection_types::options_selection_types),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.selection_types.get_selection_type", selection_types::get_selection_type)
                        .put_named("academic.student.reference.selection_types.update_selection_type", selection_types::update_selection_type)
                        .delete_named("academic.student.reference.selection_types.delete_selection_type", selection_types::delete_selection_type),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get_named("academic.student.reference.statuses.list_statuses", statuses::list_statuses)
                .post_named("academic.student.reference.statuses.create_statuse", statuses::create_statuse)
                .push(
                    Router::with_path("options")
                        .post_named("academic.student.reference.statuses.options_statuses", statuses::options_statuses),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.student.reference.statuses.get_statuse", statuses::get_statuse)
                        .put_named("academic.student.reference.statuses.update_statuse", statuses::update_statuse)
                        .delete_named("academic.student.reference.statuses.delete_statuse", statuses::delete_statuse),
                ),
        )
}
