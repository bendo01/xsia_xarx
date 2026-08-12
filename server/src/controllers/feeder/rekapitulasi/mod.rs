use salvo::prelude::*;

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
                .get(indeks_prestasi_sementara_mahasiswa::list_indeks_prestasi_sementara_mahasiswa)
                .post(indeks_prestasi_sementara_mahasiswa::create_indeks_prestasi_sementara_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get(indeks_prestasi_sementara_mahasiswa::get_indeks_prestasi_sementara_mahasiswa)
                        .put(indeks_prestasi_sementara_mahasiswa::update_indeks_prestasi_sementara_mahasiswa)
                        .delete(indeks_prestasi_sementara_mahasiswa::delete_indeks_prestasi_sementara_mahasiswa),
                ),
        )
        .push(
            Router::with_path("jumlah-dosen")
                .get(jumlah_dosen::list_jumlah_dosen)
                .post(jumlah_dosen::create_jumlah_dosen)
                .push(
                    Router::with_path("{id}")
                        .get(jumlah_dosen::get_jumlah_dosen)
                        .put(jumlah_dosen::update_jumlah_dosen)
                        .delete(jumlah_dosen::delete_jumlah_dosen),
                ),
        )
        .push(
            Router::with_path("jumlah-mahasiswa")
                .get(jumlah_mahasiswa::list_jumlah_mahasiswa)
                .post(jumlah_mahasiswa::create_jumlah_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get(jumlah_mahasiswa::get_jumlah_mahasiswa)
                        .put(jumlah_mahasiswa::update_jumlah_mahasiswa)
                        .delete(jumlah_mahasiswa::delete_jumlah_mahasiswa),
                ),
        )
        .push(
            Router::with_path("kartu-hasil-studi-mahasiswa")
                .get(kartu_hasil_studi_mahasiswa::list_kartu_hasil_studi_mahasiswa)
                .post(kartu_hasil_studi_mahasiswa::create_kartu_hasil_studi_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get(kartu_hasil_studi_mahasiswa::get_kartu_hasil_studi_mahasiswa)
                        .put(kartu_hasil_studi_mahasiswa::update_kartu_hasil_studi_mahasiswa)
                        .delete(kartu_hasil_studi_mahasiswa::delete_kartu_hasil_studi_mahasiswa),
                ),
        )
        .push(
            Router::with_path("kartu-rencana-studi-mahasiswa")
                .get(kartu_rencana_studi_mahasiswa::list_kartu_rencana_studi_mahasiswa)
                .post(kartu_rencana_studi_mahasiswa::create_kartu_rencana_studi_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get(kartu_rencana_studi_mahasiswa::get_kartu_rencana_studi_mahasiswa)
                        .put(kartu_rencana_studi_mahasiswa::update_kartu_rencana_studi_mahasiswa)
                        .delete(kartu_rencana_studi_mahasiswa::delete_kartu_rencana_studi_mahasiswa),
                ),
        )
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
