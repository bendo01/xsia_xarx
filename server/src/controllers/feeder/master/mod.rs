use salvo::prelude::*;

pub mod uji_mahasiswa;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
        Router::with_path("uji-mahasiswa")
            .get(uji_mahasiswa::list_uji_mahasiswa)
            .post(uji_mahasiswa::create_uji_mahasiswa)
            .push(
                Router::with_path("{id}")
                    .get(uji_mahasiswa::get_uji_mahasiswa)
                    .put(uji_mahasiswa::update_uji_mahasiswa)
                    .delete(uji_mahasiswa::delete_uji_mahasiswa),
            ),
    )
}
