use salvo::prelude::*;
pub mod reference;
pub mod transaction;

pub fn router() -> Router {
    Router::with_path("prior-learning-recognition")
        .push(reference::router())
        .push(transaction::router())
}
