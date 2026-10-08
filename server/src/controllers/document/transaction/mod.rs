use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod archives;

pub fn router() -> Router {
    Router::with_path("transaction")
        .push(
            Router::with_path("archives")
                .get_named("document.transaction.archives.index", archives::index)
                .post_named("document.transaction.archives.store", archives::store)
                .push(
                    Router::with_path("options")
                        .post_named("document.transaction.archives.option_select", archives::option_select),
                )
                .push(
                    Router::with_path("{id}")
                        .get_named("document.transaction.archives.show", archives::show)
                        .put_named("document.transaction.archives.update", archives::update)
                        .delete_named("document.transaction.archives.delete", archives::delete),
                ),
        )
}
