use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod contracts;
pub mod groups;
pub mod ranks;
pub mod statuses;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("contracts")
                .get_named("academic.lecturer.reference.contracts.list_contracts", contracts::index)
                .post_named("academic.lecturer.reference.contracts.create_contract", contracts::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.contracts.options_contracts", contracts::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.contracts.get_contract", contracts::show)
                        .put_named("academic.lecturer.reference.contracts.update_contract", contracts::update)
                        .delete_named("academic.lecturer.reference.contracts.delete_contract", contracts::delete),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("academic.lecturer.reference.groups.list_groups", groups::index)
                .post_named("academic.lecturer.reference.groups.create_group", groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.groups.options_groups", groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.groups.get_group", groups::show)
                        .put_named("academic.lecturer.reference.groups.update_group", groups::update)
                        .delete_named("academic.lecturer.reference.groups.delete_group", groups::delete),
                ),
        )
        .push(
            Router::with_path("ranks")
                .get_named("academic.lecturer.reference.ranks.list_ranks", ranks::index)
                .post_named("academic.lecturer.reference.ranks.create_rank", ranks::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.ranks.options_ranks", ranks::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.ranks.get_rank", ranks::show)
                        .put_named("academic.lecturer.reference.ranks.update_rank", ranks::update)
                        .delete_named("academic.lecturer.reference.ranks.delete_rank", ranks::delete),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get_named("academic.lecturer.reference.statuses.list_statuses", statuses::index)
                .post_named("academic.lecturer.reference.statuses.create_statuse", statuses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.statuses.options_statuses", statuses::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.statuses.get_statuse", statuses::show)
                        .put_named("academic.lecturer.reference.statuses.update_statuse", statuses::update)
                        .delete_named("academic.lecturer.reference.statuses.delete_statuse", statuses::delete),
                ),
        )
}
