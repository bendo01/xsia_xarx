use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;
pub mod reference;
pub mod transaction;

pub fn router() -> Router {
    Router::with_path("final-assignment")
        .push(reference::router())
        .push(transaction::router())
}
