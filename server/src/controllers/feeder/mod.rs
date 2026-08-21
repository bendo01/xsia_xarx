use salvo::prelude::*;
pub mod akumulasi;
pub mod akun;
pub mod master;
pub mod referensi;
pub mod rekapitulasi;

pub fn router() -> Router {
    Router::with_path("feeder")
        .push(akumulasi::router())
        .push(akun::router())
        .push(master::router())
        .push(referensi::router())
        .push(rekapitulasi::router())
}
