use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod archive_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("archive-types")
                .get_named("document.reference.archive_types.list_archive_types", archive_types::list_archive_types)
                .post_named("document.reference.archive_types.create_archive_type", archive_types::create_archive_type)
                .push(
                    Router::with_path("{id}")
                        .get_named("document.reference.archive_types.get_archive_type", archive_types::get_archive_type)
                        .put_named("document.reference.archive_types.update_archive_type", archive_types::update_archive_type)
                        .delete_named("document.reference.archive_types.delete_archive_type", archive_types::delete_archive_type),
                ),
        )
}
