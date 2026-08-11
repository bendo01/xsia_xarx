use salvo::prelude::*;

pub mod counsellors;
pub mod decrees;

pub fn router() -> Router {
    Router::with_path("adviser")
        .push(
            Router::with_path("counsellors")
                .get(counsellors::list_counsellors)
                .post(counsellors::create_counsellor)
                .push(
                    Router::with_path("{id}")
                        .get(counsellors::get_counsellor)
                        .put(counsellors::update_counsellor)
                        .delete(counsellors::delete_counsellor),
                ),
        )
        .push(
            Router::with_path("decrees")
                .get(decrees::list_decrees)
                .post(decrees::create_decree)
                .push(
                    Router::with_path("{id}")
                        .get(decrees::get_decree)
                        .put(decrees::update_decree)
                        .delete(decrees::delete_decree),
                ),
        )
}
