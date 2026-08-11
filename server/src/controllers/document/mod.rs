use salvo::prelude::*;

pub mod reference;
pub mod transaction;

pub fn router() -> Router {
    Router::with_path("document")
        .push(reference::router())
        .push(transaction::router())
}
