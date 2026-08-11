use salvo::prelude::*;

pub mod archives;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("archives")
                .get(archives::list_archives)
                .post(archives::create_archive)
                .push(
                    Router::with_path("{id}")
                        .get(archives::get_archive)
                        .put(archives::update_archive)
                        .delete(archives::delete_archive),
                ),
        )
}
