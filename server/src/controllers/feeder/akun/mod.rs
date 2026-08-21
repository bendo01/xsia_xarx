use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod kredential;

pub fn router() -> Router {
    Router::with_path("akun")
        .push(
            Router::with_path("kredential")
                .get_named("feeder.akun.kredential.list_kredential", kredential::list_kredential)
                .post_named("feeder.akun.kredential.create_kredential", kredential::create_kredential)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.akun.kredential.get_kredential", kredential::get_kredential)
                        .put_named("feeder.akun.kredential.update_kredential", kredential::update_kredential)
                        .delete_named("feeder.akun.kredential.delete_kredential", kredential::delete_kredential),
                ),
        )
}
