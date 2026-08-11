use salvo::prelude::*;

pub mod conducts;
pub mod responds;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("conducts")
                .get(conducts::list_conducts)
                .post(conducts::create_conduct)
                .push(
                    Router::with_path("{id}")
                        .get(conducts::get_conduct)
                        .put(conducts::update_conduct)
                        .delete(conducts::delete_conduct),
                ),
        )
        .push(
            Router::with_path("responds")
                .get(responds::list_responds)
                .post(responds::create_respond)
                .push(
                    Router::with_path("{id}")
                        .get(responds::get_respond)
                        .put(responds::update_respond)
                        .delete(responds::delete_respond),
                ),
        )
}
