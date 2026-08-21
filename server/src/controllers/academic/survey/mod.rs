use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;
pub mod master;
pub mod reference;
pub mod transaction;

pub fn router() -> Router {
    Router::with_path("survey")
        .push(master::router())
        .push(reference::router())
        .push(transaction::router())
}
