use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod archive_types;

pub fn router() -> Router {
    Router::with_path("reference")
        .push(
            Router::with_path("archive-types")
                .get_named("document.reference.archive_types.index", archive_types::index)
                .post_named("document.reference.archive_types.store", archive_types::store)
                .push(
                    Router::with_path("options")
                        .post_named("document.reference.archive_types.option_select", archive_types::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("document.reference.archive_types.show", archive_types::show)
                        .put_named("document.reference.archive_types.update", archive_types::update)
                        .delete_named("document.reference.archive_types.delete", archive_types::delete),
                ),
        )
}
