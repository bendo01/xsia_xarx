use salvo::prelude::*;
pub mod master;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("contact")
        .push(master::router())
        .push(reference::router())
}
