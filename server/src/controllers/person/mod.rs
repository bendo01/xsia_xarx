use salvo::prelude::*;
pub mod master;
pub mod nutritional_intake;
pub mod reference;

pub fn router() -> Router {
    Router::with_path("person")
        .push(master::router())
        .push(nutritional_intake::router())
        .push(reference::router())
}
