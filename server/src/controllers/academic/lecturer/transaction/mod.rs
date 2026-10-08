use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod academic_groups;
pub mod academic_ranks;
pub mod homebases;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("academic-groups")
                .get_named("academic.lecturer.transaction.academic_groups.list_academic_groups", academic_groups::index)
                .post_named("academic.lecturer.transaction.academic_groups.create_academic_group", academic_groups::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.transaction.academic_groups.options_academic_groups", academic_groups::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.academic_groups.get_academic_group", academic_groups::show)
                        .put_named("academic.lecturer.transaction.academic_groups.update_academic_group", academic_groups::update)
                        .delete_named("academic.lecturer.transaction.academic_groups.delete_academic_group", academic_groups::delete),
                ),
        )
        .push(
            Router::with_path("academic-ranks")
                .get_named("academic.lecturer.transaction.academic_ranks.list_academic_ranks", academic_ranks::index)
                .post_named("academic.lecturer.transaction.academic_ranks.create_academic_rank", academic_ranks::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.transaction.academic_ranks.options_academic_ranks", academic_ranks::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.academic_ranks.get_academic_rank", academic_ranks::show)
                        .put_named("academic.lecturer.transaction.academic_ranks.update_academic_rank", academic_ranks::update)
                        .delete_named("academic.lecturer.transaction.academic_ranks.delete_academic_rank", academic_ranks::delete),
                ),
        )
        .push(
            Router::with_path("homebases")
                .get_named("academic.lecturer.transaction.homebases.list_homebases", homebases::index)
                .post_named("academic.lecturer.transaction.homebases.create_homebase", homebases::store)
                .push(
                    Router::with_path("options")
                        .post_named("academic.lecturer.transaction.homebases.options_homebases", homebases::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.homebases.get_homebase", homebases::show)
                        .put_named("academic.lecturer.transaction.homebases.update_homebase", homebases::update)
                        .delete_named("academic.lecturer.transaction.homebases.delete_homebase", homebases::delete),
                ),
        )
}
