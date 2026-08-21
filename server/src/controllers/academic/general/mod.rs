use salvo::prelude::*;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("general")
        .push(reference::router())
}
