use salvo::prelude::*;

pub mod laporan;

pub fn router() -> Router {
    Router::with_path("rekapitulasi")
        .push(
        Router::with_path("laporan")
            .get(laporan::list_laporan)
            .post(laporan::create_laporan)
            .push(
                Router::with_path("{id}")
                    .get(laporan::get_laporan)
                    .put(laporan::update_laporan)
                    .delete(laporan::delete_laporan),
            ),
    )
}
