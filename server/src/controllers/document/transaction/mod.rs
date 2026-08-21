use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod archives;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("archives")
                .get_named("document.transaction.archives.list_archives", archives::list_archives)
                .post_named("document.transaction.archives.create_archive", archives::create_archive)
                .push(
                    Router::with_path("{id}")
                        .get_named("document.transaction.archives.get_archive", archives::get_archive)
                        .put_named("document.transaction.archives.update_archive", archives::update_archive)
                        .delete_named("document.transaction.archives.delete_archive", archives::delete_archive),
                ),
        )
}
