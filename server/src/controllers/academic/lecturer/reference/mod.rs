use salvo::prelude::*;

pub mod contracts;
pub mod groups;
pub mod ranks;
pub mod statuses;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("contracts")
                .get(contracts::list_contracts)
                .post(contracts::create_contract)
                .push(
                    Router::with_path("{id}")
                        .get(contracts::get_contract)
                        .put(contracts::update_contract)
                        .delete(contracts::delete_contract),
                ),
        )
        .push(
            Router::with_path("groups")
                .get(groups::list_groups)
                .post(groups::create_group)
                .push(
                    Router::with_path("{id}")
                        .get(groups::get_group)
                        .put(groups::update_group)
                        .delete(groups::delete_group),
                ),
        )
        .push(
            Router::with_path("ranks")
                .get(ranks::list_ranks)
                .post(ranks::create_rank)
                .push(
                    Router::with_path("{id}")
                        .get(ranks::get_rank)
                        .put(ranks::update_rank)
                        .delete(ranks::delete_rank),
                ),
        )
        .push(
            Router::with_path("statuses")
                .get(statuses::list_statuses)
                .post(statuses::create_statuse)
                .push(
                    Router::with_path("{id}")
                        .get(statuses::get_statuse)
                        .put(statuses::update_statuse)
                        .delete(statuses::delete_statuse),
                ),
        )
}
