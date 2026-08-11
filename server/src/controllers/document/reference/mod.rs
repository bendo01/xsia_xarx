use salvo::prelude::*;

pub mod archive_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("archive-types")
                .get(archive_types::list_archive_types)
                .post(archive_types::create_archive_type)
                .push(
                    Router::with_path("{id}")
                        .get(archive_types::get_archive_type)
                        .put(archive_types::update_archive_type)
                        .delete(archive_types::delete_archive_type),
                ),
        )
}
