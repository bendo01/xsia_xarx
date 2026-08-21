use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("general")
        .push(reference::router())
}
