use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod academic_groups;
pub mod academic_ranks;
pub mod homebases;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("academic-groups")
                .get_named("academic.lecturer.transaction.academic_groups.index", academic_groups::index)
                .post_named("academic.lecturer.transaction.academic_groups.store", academic_groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.transaction.academic_groups.option_select", academic_groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.academic_groups.show", academic_groups::show)
                        .put_named("academic.lecturer.transaction.academic_groups.update", academic_groups::update)
                        .delete_named("academic.lecturer.transaction.academic_groups.delete", academic_groups::delete),
                ),
        )
        .push(
            Router::with_path("academic-ranks")
                .get_named("academic.lecturer.transaction.academic_ranks.index", academic_ranks::index)
                .post_named("academic.lecturer.transaction.academic_ranks.store", academic_ranks::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.transaction.academic_ranks.option_select", academic_ranks::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.academic_ranks.show", academic_ranks::show)
                        .put_named("academic.lecturer.transaction.academic_ranks.update", academic_ranks::update)
                        .delete_named("academic.lecturer.transaction.academic_ranks.delete", academic_ranks::delete),
                ),
        )
        .push(
            Router::with_path("homebases")
                .get_named("academic.lecturer.transaction.homebases.index", homebases::index)
                .post_named("academic.lecturer.transaction.homebases.store", homebases::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.transaction.homebases.option_select", homebases::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.homebases.show", homebases::show)
                        .put_named("academic.lecturer.transaction.homebases.update", homebases::update)
                        .delete_named("academic.lecturer.transaction.homebases.delete", homebases::delete),
                ),
        )
}
