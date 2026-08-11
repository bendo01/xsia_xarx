use salvo::prelude::*;

pub mod wilayah;

pub fn router() -> Router {
    Router::with_path("referensi")
        .push(
        Router::with_path("wilayah")
            .get(wilayah::list_wilayah)
            .post(wilayah::create_wilayah)
            .push(
                Router::with_path("{id}")
                    .get(wilayah::get_wilayah)
                    .put(wilayah::update_wilayah)
                    .delete(wilayah::delete_wilayah),
            ),
    )
}
