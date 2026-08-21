use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;
pub mod master;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("building")
        .push(master::router())
        .push(reference::router())
}
