use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;
pub mod adviser;
pub mod campaign;
pub mod final_assignment;
pub mod master;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("student")
        .push(adviser::router())
        .push(campaign::router())
        .push(final_assignment::router())
        .push(master::router())
        .push(reference::router())
}
