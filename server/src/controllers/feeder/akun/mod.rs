use salvo::prelude::*;

pub mod kredential;

pub fn router() -> Router {
    Router::with_path("akun")
        .push(
        Router::with_path("kredential")
            .get(kredential::list_kredential)
            .post(kredential::create_kredential)
            .push(
                Router::with_path("{id}")
                    .get(kredential::get_kredential)
                    .put(kredential::update_kredential)
                    .delete(kredential::delete_kredential),
            ),
    )
}
