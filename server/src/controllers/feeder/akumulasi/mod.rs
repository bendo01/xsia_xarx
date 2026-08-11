use salvo::prelude::*;

pub mod jumlah_data;

pub fn router() -> Router {
    Router::with_path("akumulasi")
        .push(
        Router::with_path("jumlah-data")
            .get(jumlah_data::list_jumlah_data)
            .post(jumlah_data::create_jumlah_data)
            .push(
                Router::with_path("{id}")
                    .get(jumlah_data::get_jumlah_data)
                    .put(jumlah_data::update_jumlah_data)
                    .delete(jumlah_data::delete_jumlah_data),
            ),
    )
}
