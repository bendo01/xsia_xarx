use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod application;

pub fn router() -> Router {
    Router::with_path("preference").push(
        Router::with_path("application")
            .get_named("preference.application.show", application::show)
            .put_named("preference.application.update", application::update),
    )
}
