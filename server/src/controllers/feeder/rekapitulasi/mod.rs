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
                .get_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.list_indeks_prestasi_sementara_mahasiswa", indeks_prestasi_sementara_mahasiswa::list_indeks_prestasi_sementara_mahasiswa)
                .post_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.create_indeks_prestasi_sementara_mahasiswa", indeks_prestasi_sementara_mahasiswa::create_indeks_prestasi_sementara_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.get_indeks_prestasi_sementara_mahasiswa", indeks_prestasi_sementara_mahasiswa::get_indeks_prestasi_sementara_mahasiswa)
                        .put_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.update_indeks_prestasi_sementara_mahasiswa", indeks_prestasi_sementara_mahasiswa::update_indeks_prestasi_sementara_mahasiswa)
                        .delete_named("feeder.rekapitulasi.indeks_prestasi_sementara_mahasiswa.delete_indeks_prestasi_sementara_mahasiswa", indeks_prestasi_sementara_mahasiswa::delete_indeks_prestasi_sementara_mahasiswa),
                ),
        )
        .push(
            Router::with_path("jumlah-dosen")
                .get_named("feeder.rekapitulasi.jumlah_dosen.list_jumlah_dosen", jumlah_dosen::list_jumlah_dosen)
                .post_named("feeder.rekapitulasi.jumlah_dosen.create_jumlah_dosen", jumlah_dosen::create_jumlah_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.jumlah_dosen.get_jumlah_dosen", jumlah_dosen::get_jumlah_dosen)
                        .put_named("feeder.rekapitulasi.jumlah_dosen.update_jumlah_dosen", jumlah_dosen::update_jumlah_dosen)
                        .delete_named("feeder.rekapitulasi.jumlah_dosen.delete_jumlah_dosen", jumlah_dosen::delete_jumlah_dosen),
                ),
        )
        .push(
            Router::with_path("jumlah-mahasiswa")
                .get_named("feeder.rekapitulasi.jumlah_mahasiswa.list_jumlah_mahasiswa", jumlah_mahasiswa::list_jumlah_mahasiswa)
                .post_named("feeder.rekapitulasi.jumlah_mahasiswa.create_jumlah_mahasiswa", jumlah_mahasiswa::create_jumlah_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.jumlah_mahasiswa.get_jumlah_mahasiswa", jumlah_mahasiswa::get_jumlah_mahasiswa)
                        .put_named("feeder.rekapitulasi.jumlah_mahasiswa.update_jumlah_mahasiswa", jumlah_mahasiswa::update_jumlah_mahasiswa)
                        .delete_named("feeder.rekapitulasi.jumlah_mahasiswa.delete_jumlah_mahasiswa", jumlah_mahasiswa::delete_jumlah_mahasiswa),
                ),
        )
        .push(
            Router::with_path("kartu-hasil-studi-mahasiswa")
                .get_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.list_kartu_hasil_studi_mahasiswa", kartu_hasil_studi_mahasiswa::list_kartu_hasil_studi_mahasiswa)
                .post_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.create_kartu_hasil_studi_mahasiswa", kartu_hasil_studi_mahasiswa::create_kartu_hasil_studi_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.get_kartu_hasil_studi_mahasiswa", kartu_hasil_studi_mahasiswa::get_kartu_hasil_studi_mahasiswa)
                        .put_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.update_kartu_hasil_studi_mahasiswa", kartu_hasil_studi_mahasiswa::update_kartu_hasil_studi_mahasiswa)
                        .delete_named("feeder.rekapitulasi.kartu_hasil_studi_mahasiswa.delete_kartu_hasil_studi_mahasiswa", kartu_hasil_studi_mahasiswa::delete_kartu_hasil_studi_mahasiswa),
                ),
        )
        .push(
            Router::with_path("kartu-rencana-studi-mahasiswa")
                .get_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.list_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::list_kartu_rencana_studi_mahasiswa)
                .post_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.create_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::create_kartu_rencana_studi_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.get_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::get_kartu_rencana_studi_mahasiswa)
                        .put_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.update_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::update_kartu_rencana_studi_mahasiswa)
                        .delete_named("feeder.rekapitulasi.kartu_rencana_studi_mahasiswa.delete_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::delete_kartu_rencana_studi_mahasiswa),
                ),
        )
        .push(
            Router::with_path("laporan")
                .get_named("feeder.rekapitulasi.laporan.list_laporan", laporan::list_laporan)
                .post_named("feeder.rekapitulasi.laporan.create_laporan", laporan::create_laporan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.rekapitulasi.laporan.get_laporan", laporan::get_laporan)
                        .put_named("feeder.rekapitulasi.laporan.update_laporan", laporan::update_laporan)
                        .delete_named("feeder.rekapitulasi.laporan.delete_laporan", laporan::delete_laporan),
                ),
        )
}
