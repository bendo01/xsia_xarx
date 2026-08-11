use salvo::prelude::*;

pub mod academic_groups;
pub mod academic_ranks;
pub mod homebases;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("academic-groups")
                .get(academic_groups::list_academic_groups)
                .post(academic_groups::create_academic_group)
                .push(
                    Router::with_path("{id}")
                        .get(academic_groups::get_academic_group)
                        .put(academic_groups::update_academic_group)
                        .delete(academic_groups::delete_academic_group),
                ),
        )
        .push(
            Router::with_path("academic-ranks")
                .get(academic_ranks::list_academic_ranks)
                .post(academic_ranks::create_academic_rank)
                .push(
                    Router::with_path("{id}")
                        .get(academic_ranks::get_academic_rank)
                        .put(academic_ranks::update_academic_rank)
                        .delete(academic_ranks::delete_academic_rank),
                ),
        )
        .push(
            Router::with_path("homebases")
                .get(homebases::list_homebases)
                .post(homebases::create_homebase)
                .push(
                    Router::with_path("{id}")
                        .get(homebases::get_homebase)
                        .put(homebases::update_homebase)
                        .delete(homebases::delete_homebase),
                ),
        )
}
