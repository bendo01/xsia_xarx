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
                .get_named("academic.lecturer.reference.contracts.index", contracts::index)
                .post_named("academic.lecturer.reference.contracts.store", contracts::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.contracts.option_select", contracts::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.contracts.show", contracts::show)
                        .put_named("academic.lecturer.reference.contracts.update", contracts::update)
                        .delete_named("academic.lecturer.reference.contracts.delete", contracts::delete),
                ),
        )
        .push(
            Router::with_path("groups")
                .get_named("academic.lecturer.reference.groups.index", groups::index)
                .post_named("academic.lecturer.reference.groups.store", groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.groups.option_select", groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.groups.show", groups::show)
                        .put_named("academic.lecturer.reference.groups.update", groups::update)
                        .delete_named("academic.lecturer.reference.groups.delete", groups::delete),
                ),
        )
        .push(
            Router::with_path("ranks")
                .get_named("academic.lecturer.reference.ranks.index", ranks::index)
                .post_named("academic.lecturer.reference.ranks.store", ranks::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.ranks.option_select", ranks::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.ranks.show", ranks::show)
                        .put_named("academic.lecturer.reference.ranks.update", ranks::update)
                        .delete_named("academic.lecturer.reference.ranks.delete", ranks::delete),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get_named("academic.lecturer.reference.statuses.index", statuses::index)
                .post_named("academic.lecturer.reference.statuses.store", statuses::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.reference.statuses.option_select", statuses::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.reference.statuses.show", statuses::show)
                        .put_named("academic.lecturer.reference.statuses.update", statuses::update)
                        .delete_named("academic.lecturer.reference.statuses.delete", statuses::delete),
                ),
        )
}
