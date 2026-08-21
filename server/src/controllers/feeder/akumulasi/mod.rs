use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod estimasi;
pub mod jumlah_data;

pub fn router() -> Router {
    Router::with_path("akumulasi")
        .push(
            Router::with_path("estimasi")
                .get_named("feeder.akumulasi.estimasi.list_estimasi", estimasi::list_estimasi)
                .post_named("feeder.akumulasi.estimasi.create_estimasi", estimasi::create_estimasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.akumulasi.estimasi.get_estimasi", estimasi::get_estimasi)
                        .put_named("feeder.akumulasi.estimasi.update_estimasi", estimasi::update_estimasi)
                        .delete_named("feeder.akumulasi.estimasi.delete_estimasi", estimasi::delete_estimasi),
                ),
        )
        .push(
            Router::with_path("jumlah-data")
                .get_named("feeder.akumulasi.jumlah_data.list_jumlah_data", jumlah_data::list_jumlah_data)
                .post_named("feeder.akumulasi.jumlah_data.create_jumlah_data", jumlah_data::create_jumlah_data)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.akumulasi.jumlah_data.get_jumlah_data", jumlah_data::get_jumlah_data)
                        .put_named("feeder.akumulasi.jumlah_data.update_jumlah_data", jumlah_data::update_jumlah_data)
                        .delete_named("feeder.akumulasi.jumlah_data.delete_jumlah_data", jumlah_data::delete_jumlah_data),
                ),
        )
}
