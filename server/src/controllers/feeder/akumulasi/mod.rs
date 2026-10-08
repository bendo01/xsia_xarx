use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod estimasi;
pub mod jumlah_data;

pub fn router() -> Router {
    Router::with_path("akumulasi")
        .push(
            Router::with_path("estimasi")
                .get_named("feeder.akumulasi.estimasi.index", estimasi::index)
                .post_named("feeder.akumulasi.estimasi.store", estimasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.akumulasi.estimasi.show", estimasi::show)
                        .put_named("feeder.akumulasi.estimasi.update", estimasi::update)
                        .delete_named("feeder.akumulasi.estimasi.delete", estimasi::delete),
                ),
        )
        .push(
            Router::with_path("jumlah-data")
                .get_named("feeder.akumulasi.jumlah_data.index", jumlah_data::index)
                .post_named("feeder.akumulasi.jumlah_data.store", jumlah_data::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.akumulasi.jumlah_data.show", jumlah_data::show)
                        .put_named("feeder.akumulasi.jumlah_data.update", jumlah_data::update)
                        .delete_named("feeder.akumulasi.jumlah_data.delete", jumlah_data::delete),
                ),
        )
}
