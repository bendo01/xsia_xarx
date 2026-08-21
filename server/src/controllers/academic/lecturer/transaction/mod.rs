use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod academic_groups;
pub mod academic_ranks;
pub mod homebases;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("academic-groups")
                .get_named("academic.lecturer.transaction.academic_groups.list_academic_groups", academic_groups::list_academic_groups)
                .post_named("academic.lecturer.transaction.academic_groups.create_academic_group", academic_groups::create_academic_group)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.academic_groups.get_academic_group", academic_groups::get_academic_group)
                        .put_named("academic.lecturer.transaction.academic_groups.update_academic_group", academic_groups::update_academic_group)
                        .delete_named("academic.lecturer.transaction.academic_groups.delete_academic_group", academic_groups::delete_academic_group),
                ),
        )
        .push(
            Router::with_path("academic-ranks")
                .get_named("academic.lecturer.transaction.academic_ranks.list_academic_ranks", academic_ranks::list_academic_ranks)
                .post_named("academic.lecturer.transaction.academic_ranks.create_academic_rank", academic_ranks::create_academic_rank)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.academic_ranks.get_academic_rank", academic_ranks::get_academic_rank)
                        .put_named("academic.lecturer.transaction.academic_ranks.update_academic_rank", academic_ranks::update_academic_rank)
                        .delete_named("academic.lecturer.transaction.academic_ranks.delete_academic_rank", academic_ranks::delete_academic_rank),
                ),
        )
        .push(
            Router::with_path("homebases")
                .get_named("academic.lecturer.transaction.homebases.list_homebases", homebases::list_homebases)
                .post_named("academic.lecturer.transaction.homebases.create_homebase", homebases::create_homebase)
                .push(
                    Router::with_path("{id}")
                        .get_named("academic.lecturer.transaction.homebases.get_homebase", homebases::get_homebase)
                        .put_named("academic.lecturer.transaction.homebases.update_homebase", homebases::update_homebase)
                        .delete_named("academic.lecturer.transaction.homebases.delete_homebase", homebases::delete_homebase),
                ),
        )
}
