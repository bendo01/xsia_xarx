use salvo::prelude::*;
pub mod master;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("course")
        .push(master::router())
        .push(reference::router())
}
