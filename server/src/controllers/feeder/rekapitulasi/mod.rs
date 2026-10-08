use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod indeks_prestasi_sementara_mahasiswa;
pub mod jumlah_dosen;
pub mod jumlah_mahasiswa;
pub mod kartu_hasil_studi_mahasiswa;
pub mod kartu_rencana_studi_mahasiswa;
pub mod laporan;

pub fn router() -> Router {
    Router::with_path("rekapitulasi")
        .push(
            Router::with_path("indeks-prestasi-sementara-mahasiswa")
                .get_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.index", indeks_prestasi_sementara_mahasiswa::index)
                .post_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.store", indeks_prestasi_sementara_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.show", indeks_prestasi_sementara_mahasiswa::show)
                        .put_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.update", indeks_prestasi_sementara_mahasiswa::update)
                        .delete_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.delete", indeks_prestasi_sementara_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("jumlah-dosen")
                .get_named("feeder.rekapitulasi.jumlah_dosen.index", jumlah_dosen::index)
                .post_named("feeder.rekapitulasi.jumlah_dosen.store", jumlah_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.jumlah_dosen.show", jumlah_dosen::show)
                        .put_named("feeder.rekapitulasi.jumlah_dosen.update", jumlah_dosen::update)
                        .delete_named("feeder.rekapitulasi.jumlah_dosen.delete", jumlah_dosen::delete),
                ),
        )
        .push(
            Router::with_path("jumlah-mahasiswa")
                .get_named("feeder.rekapitulasi.jumlah_mahasiswa.index", jumlah_mahasiswa::index)
                .post_named("feeder.rekapitulasi.jumlah_mahasiswa.store", jumlah_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.jumlah_mahasiswa.show", jumlah_mahasiswa::show)
                        .put_named("feeder.rekapitulasi.jumlah_mahasiswa.update", jumlah_mahasiswa::update)
                        .delete_named("feeder.rekapitulasi.jumlah_mahasiswa.delete", jumlah_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("kartu-hasil-studi-mahasiswa")
                .get_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.index", kartu_hasil_studi_mahasiswa::index)
                .post_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.store", kartu_hasil_studi_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.show", kartu_hasil_studi_mahasiswa::show)
                        .put_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.update", kartu_hasil_studi_mahasiswa::update)
                        .delete_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.delete", kartu_hasil_studi_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("kartu-rencana-studi-mahasiswa")
                .get_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.index", kartu_rencana_studi_mahasiswa::index)
                .post_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.store", kartu_rencana_studi_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.show", kartu_rencana_studi_mahasiswa::show)
                        .put_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.update", kartu_rencana_studi_mahasiswa::update)
                        .delete_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.delete", kartu_rencana_studi_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("laporan")
                .get_named("feeder.rekapitulasi.laporan.index", laporan::index)
                .post_named("feeder.rekapitulasi.laporan.store", laporan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.laporan.show", laporan::show)
                        .put_named("feeder.rekapitulasi.laporan.update", laporan::update)
                        .delete_named("feeder.rekapitulasi.laporan.delete", laporan::delete),
                ),
        )
}
