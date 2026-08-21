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
                .get_named("academic.lecturer.reference.contracts.list_contracts", contracts::list_contracts)
                .post_named("academic.lecturer.reference.contracts.create_contract", contracts::create_contract)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.contracts.options_contracts", contracts::options_contracts),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.contracts.get_contract", contracts::get_contract)
                        .put_named("academic.lecturer.reference.contracts.update_contract", contracts::update_contract)
                        .delete_named("academic.lecturer.reference.contracts.delete_contract", contracts::delete_contract),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("academic.lecturer.reference.groups.list_groups", groups::list_groups)
                .post_named("academic.lecturer.reference.groups.create_group", groups::create_group)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.groups.options_groups", groups::options_groups),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.groups.get_group", groups::get_group)
                        .put_named("academic.lecturer.reference.groups.update_group", groups::update_group)
                        .delete_named("academic.lecturer.reference.groups.delete_group", groups::delete_group),
                ),
        )
        .push(
            Router::with_path("ranks")
                .get_named("academic.lecturer.reference.ranks.list_ranks", ranks::list_ranks)
                .post_named("academic.lecturer.reference.ranks.create_rank", ranks::create_rank)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.ranks.options_ranks", ranks::options_ranks),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.ranks.get_rank", ranks::get_rank)
                        .put_named("academic.lecturer.reference.ranks.update_rank", ranks::update_rank)
                        .delete_named("academic.lecturer.reference.ranks.delete_rank", ranks::delete_rank),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get_named("academic.lecturer.reference.statuses.list_statuses", statuses::list_statuses)
                .post_named("academic.lecturer.reference.statuses.create_statuse", statuses::create_statuse)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.statuses.options_statuses", statuses::options_statuses),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.statuses.get_statuse", statuses::get_statuse)
                        .put_named("academic.lecturer.reference.statuses.update_statuse", statuses::update_statuse)
                        .delete_named("academic.lecturer.reference.statuses.delete_statuse", statuses::delete_statuse),
                ),
        )
}
