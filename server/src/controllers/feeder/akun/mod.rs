use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod kredential;

pub fn router() -> Router {
    Router::with_path("akun")
        .push(
            Router::with_path("kredential")
                .get_named("feeder.akun.kredential.index", kredential::index)
                .post_named("feeder.akun.kredential.store", kredential::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.akun.kredential.show", kredential::show)
                        .put_named("feeder.akun.kredential.update", kredential::update)
                        .delete_named("feeder.akun.kredential.delete", kredential::delete),
                ),
        )
}
