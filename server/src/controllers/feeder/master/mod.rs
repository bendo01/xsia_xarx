use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod aktifitas_kuliah_mahasiswa;
pub mod aktifitas_mahasiswa;
pub mod aktifitas_mengajar_dosen;
pub mod anggota_aktifitas_mahasiswa;
pub mod bidang_minat_perguruan_tinggi;
pub mod bimbing_mahasiswa;
pub mod biodata_dosen;
pub mod biodata_mahasiswa;
pub mod detail_nilai_perkuliahan_kelas;
pub mod dosen;
pub mod dosen_pembimbing;
pub mod dosen_pengajar_kelas_kuliah;
pub mod fakultas;
pub mod hitung_transkrip_angkatan_mahasiswa;
pub mod kartu_rencana_studi_mahasiswa;
pub mod kelas_kuliah;
pub mod komponen_evaluasi_kelas;
pub mod konsistensi_data;
pub mod konversi_kampus_merdeka;
pub mod kurikulum;
pub mod mahasiswa;
pub mod mahasiswa_bimbingan_dosen;
pub mod mahasiswa_lulusan_dropout;
pub mod matakuliah;
pub mod matakuliah_kurikulum;
pub mod nilai_perkuliahan_kelas;
pub mod nilai_transfer_pendidikan_mahasiswa;
pub mod penugasan_dosen;
pub mod perguruan_tinggi;
pub mod periode_aktif;
pub mod periode_perkuliahan;
pub mod perkuliahan_mahasiswa;
pub mod peserta_kelas_kuliah;
pub mod prestasi_mahasiswa;
pub mod profil_perguruan_tinggi;
pub mod program_studi;
pub mod rencana_evaluasi;
pub mod rencana_pembelajaran;
pub mod riwayat_fungsional_dosen;
pub mod riwayat_nilai_mahasiswa;
pub mod riwayat_pangkat_dosen;
pub mod riwayat_pendidikan_dosen;
pub mod riwayat_pendidikan_mahasiswa;
pub mod riwayat_penelitian_dosen;
pub mod riwayat_sertifikasi_dosen;
pub mod skala_nilai_program_studi;
pub mod substansi_matakuliah;
pub mod transkrip_mahasiswa;
pub mod uji_mahasiswa;

pub fn router() -> Router {
    Router::with_path("master")
        .push(
            Router::with_path("aktifitas-kuliah-mahasiswa")
                .get_named("feeder.master.aktifitas_kuliah_mahasiswa.index", aktifitas_kuliah_mahasiswa::index)
                .post_named("feeder.master.aktifitas_kuliah_mahasiswa.store", aktifitas_kuliah_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.aktifitas_kuliah_mahasiswa.show", aktifitas_kuliah_mahasiswa::show)
                        .put_named("feeder.master.aktifitas_kuliah_mahasiswa.update", aktifitas_kuliah_mahasiswa::update)
                        .delete_named("feeder.master.aktifitas_kuliah_mahasiswa.delete", aktifitas_kuliah_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("aktifitas-mahasiswa")
                .get_named("feeder.master.aktifitas_mahasiswa.index", aktifitas_mahasiswa::index)
                .post_named("feeder.master.aktifitas_mahasiswa.store", aktifitas_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.aktifitas_mahasiswa.show", aktifitas_mahasiswa::show)
                        .put_named("feeder.master.aktifitas_mahasiswa.update", aktifitas_mahasiswa::update)
                        .delete_named("feeder.master.aktifitas_mahasiswa.delete", aktifitas_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("aktifitas-mengajar-dosen")
                .get_named("feeder.master.aktifitas_mengajar_dosen.index", aktifitas_mengajar_dosen::index)
                .post_named("feeder.master.aktifitas_mengajar_dosen.store", aktifitas_mengajar_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.aktifitas_mengajar_dosen.show", aktifitas_mengajar_dosen::show)
                        .put_named("feeder.master.aktifitas_mengajar_dosen.update", aktifitas_mengajar_dosen::update)
                        .delete_named("feeder.master.aktifitas_mengajar_dosen.delete", aktifitas_mengajar_dosen::delete),
                ),
        )
        .push(
            Router::with_path("anggota-aktifitas-mahasiswa")
                .get_named("feeder.master.anggota_aktifitas_mahasiswa.index", anggota_aktifitas_mahasiswa::index)
                .post_named("feeder.master.anggota_aktifitas_mahasiswa.store", anggota_aktifitas_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.anggota_aktifitas_mahasiswa.show", anggota_aktifitas_mahasiswa::show)
                        .put_named("feeder.master.anggota_aktifitas_mahasiswa.update", anggota_aktifitas_mahasiswa::update)
                        .delete_named("feeder.master.anggota_aktifitas_mahasiswa.delete", anggota_aktifitas_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("bidang-minat-perguruan-tinggi")
                .get_named("feeder.master.bidang_minat_perguruan_tinggi.index", bidang_minat_perguruan_tinggi::index)
                .post_named("feeder.master.bidang_minat_perguruan_tinggi.store", bidang_minat_perguruan_tinggi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.bidang_minat_perguruan_tinggi.show", bidang_minat_perguruan_tinggi::show)
                        .put_named("feeder.master.bidang_minat_perguruan_tinggi.update", bidang_minat_perguruan_tinggi::update)
                        .delete_named("feeder.master.bidang_minat_perguruan_tinggi.delete", bidang_minat_perguruan_tinggi::delete),
                ),
        )
        .push(
            Router::with_path("bimbing-mahasiswa")
                .get_named("feeder.master.bimbing_mahasiswa.index", bimbing_mahasiswa::index)
                .post_named("feeder.master.bimbing_mahasiswa.store", bimbing_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.bimbing_mahasiswa.show", bimbing_mahasiswa::show)
                        .put_named("feeder.master.bimbing_mahasiswa.update", bimbing_mahasiswa::update)
                        .delete_named("feeder.master.bimbing_mahasiswa.delete", bimbing_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("biodata-dosen")
                .get_named("feeder.master.biodata_dosen.index", biodata_dosen::index)
                .post_named("feeder.master.biodata_dosen.store", biodata_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.biodata_dosen.show", biodata_dosen::show)
                        .put_named("feeder.master.biodata_dosen.update", biodata_dosen::update)
                        .delete_named("feeder.master.biodata_dosen.delete", biodata_dosen::delete),
                ),
        )
        .push(
            Router::with_path("biodata-mahasiswa")
                .get_named("feeder.master.biodata_mahasiswa.index", biodata_mahasiswa::index)
                .post_named("feeder.master.biodata_mahasiswa.store", biodata_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.biodata_mahasiswa.show", biodata_mahasiswa::show)
                        .put_named("feeder.master.biodata_mahasiswa.update", biodata_mahasiswa::update)
                        .delete_named("feeder.master.biodata_mahasiswa.delete", biodata_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("detail-nilai-perkuliahan-kelas")
                .get_named("feeder.master.detail_nilai_perkuliahan_kelas.index", detail_nilai_perkuliahan_kelas::index)
                .post_named("feeder.master.detail_nilai_perkuliahan_kelas.store", detail_nilai_perkuliahan_kelas::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.detail_nilai_perkuliahan_kelas.show", detail_nilai_perkuliahan_kelas::show)
                        .put_named("feeder.master.detail_nilai_perkuliahan_kelas.update", detail_nilai_perkuliahan_kelas::update)
                        .delete_named("feeder.master.detail_nilai_perkuliahan_kelas.delete", detail_nilai_perkuliahan_kelas::delete),
                ),
        )
        .push(
            Router::with_path("dosen")
                .get_named("feeder.master.dosen.index", dosen::index)
                .post_named("feeder.master.dosen.store", dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.dosen.show", dosen::show)
                        .put_named("feeder.master.dosen.update", dosen::update)
                        .delete_named("feeder.master.dosen.delete", dosen::delete),
                ),
        )
        .push(
            Router::with_path("dosen-pembimbing")
                .get_named("feeder.master.dosen_pembimbing.index", dosen_pembimbing::index)
                .post_named("feeder.master.dosen_pembimbing.store", dosen_pembimbing::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.dosen_pembimbing.show", dosen_pembimbing::show)
                        .put_named("feeder.master.dosen_pembimbing.update", dosen_pembimbing::update)
                        .delete_named("feeder.master.dosen_pembimbing.delete", dosen_pembimbing::delete),
                ),
        )
        .push(
            Router::with_path("dosen-pengajar-kelas-kuliah")
                .get_named("feeder.master.dosen_pengajar_kelas_kuliah.index", dosen_pengajar_kelas_kuliah::index)
                .post_named("feeder.master.dosen_pengajar_kelas_kuliah.store", dosen_pengajar_kelas_kuliah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.dosen_pengajar_kelas_kuliah.show", dosen_pengajar_kelas_kuliah::show)
                        .put_named("feeder.master.dosen_pengajar_kelas_kuliah.update", dosen_pengajar_kelas_kuliah::update)
                        .delete_named("feeder.master.dosen_pengajar_kelas_kuliah.delete", dosen_pengajar_kelas_kuliah::delete),
                ),
        )
        .push(
            Router::with_path("fakultas")
                .get_named("feeder.master.fakultas.index", fakultas::index)
                .post_named("feeder.master.fakultas.store", fakultas::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.fakultas.show", fakultas::show)
                        .put_named("feeder.master.fakultas.update", fakultas::update)
                        .delete_named("feeder.master.fakultas.delete", fakultas::delete),
                ),
        )
        .push(
            Router::with_path("hitung-transkrip-angkatan-mahasiswa")
                .get_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.index", hitung_transkrip_angkatan_mahasiswa::index)
                .post_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.store", hitung_transkrip_angkatan_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.show", hitung_transkrip_angkatan_mahasiswa::show)
                        .put_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.update", hitung_transkrip_angkatan_mahasiswa::update)
                        .delete_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.delete", hitung_transkrip_angkatan_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("kartu-rencana-studi-mahasiswa")
                .get_named("feeder.master.kartu_rencana_studi_mahasiswa.index", kartu_rencana_studi_mahasiswa::index)
                .post_named("feeder.master.kartu_rencana_studi_mahasiswa.store", kartu_rencana_studi_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.kartu_rencana_studi_mahasiswa.show", kartu_rencana_studi_mahasiswa::show)
                        .put_named("feeder.master.kartu_rencana_studi_mahasiswa.update", kartu_rencana_studi_mahasiswa::update)
                        .delete_named("feeder.master.kartu_rencana_studi_mahasiswa.delete", kartu_rencana_studi_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("kelas-kuliah")
                .get_named("feeder.master.kelas_kuliah.index", kelas_kuliah::index)
                .post_named("feeder.master.kelas_kuliah.store", kelas_kuliah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.kelas_kuliah.show", kelas_kuliah::show)
                        .put_named("feeder.master.kelas_kuliah.update", kelas_kuliah::update)
                        .delete_named("feeder.master.kelas_kuliah.delete", kelas_kuliah::delete),
                ),
        )
        .push(
            Router::with_path("komponen-evaluasi-kelas")
                .get_named("feeder.master.komponen_evaluasi_kelas.index", komponen_evaluasi_kelas::index)
                .post_named("feeder.master.komponen_evaluasi_kelas.store", komponen_evaluasi_kelas::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.komponen_evaluasi_kelas.show", komponen_evaluasi_kelas::show)
                        .put_named("feeder.master.komponen_evaluasi_kelas.update", komponen_evaluasi_kelas::update)
                        .delete_named("feeder.master.komponen_evaluasi_kelas.delete", komponen_evaluasi_kelas::delete),
                ),
        )
        .push(
            Router::with_path("konsistensi-data")
                .get_named("feeder.master.konsistensi_data.index", konsistensi_data::index)
                .post_named("feeder.master.konsistensi_data.store", konsistensi_data::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.konsistensi_data.show", konsistensi_data::show)
                        .put_named("feeder.master.konsistensi_data.update", konsistensi_data::update)
                        .delete_named("feeder.master.konsistensi_data.delete", konsistensi_data::delete),
                ),
        )
        .push(
            Router::with_path("konversi-kampus-merdeka")
                .get_named("feeder.master.konversi_kampus_merdeka.index", konversi_kampus_merdeka::index)
                .post_named("feeder.master.konversi_kampus_merdeka.store", konversi_kampus_merdeka::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.konversi_kampus_merdeka.show", konversi_kampus_merdeka::show)
                        .put_named("feeder.master.konversi_kampus_merdeka.update", konversi_kampus_merdeka::update)
                        .delete_named("feeder.master.konversi_kampus_merdeka.delete", konversi_kampus_merdeka::delete),
                ),
        )
        .push(
            Router::with_path("kurikulum")
                .get_named("feeder.master.kurikulum.index", kurikulum::index)
                .post_named("feeder.master.kurikulum.store", kurikulum::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.kurikulum.show", kurikulum::show)
                        .put_named("feeder.master.kurikulum.update", kurikulum::update)
                        .delete_named("feeder.master.kurikulum.delete", kurikulum::delete),
                ),
        )
        .push(
            Router::with_path("mahasiswa")
                .get_named("feeder.master.mahasiswa.index", mahasiswa::index)
                .post_named("feeder.master.mahasiswa.store", mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.mahasiswa.show", mahasiswa::show)
                        .put_named("feeder.master.mahasiswa.update", mahasiswa::update)
                        .delete_named("feeder.master.mahasiswa.delete", mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("mahasiswa-bimbingan-dosen")
                .get_named("feeder.master.mahasiswa_bimbingan_dosen.index", mahasiswa_bimbingan_dosen::index)
                .post_named("feeder.master.mahasiswa_bimbingan_dosen.store", mahasiswa_bimbingan_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.mahasiswa_bimbingan_dosen.show", mahasiswa_bimbingan_dosen::show)
                        .put_named("feeder.master.mahasiswa_bimbingan_dosen.update", mahasiswa_bimbingan_dosen::update)
                        .delete_named("feeder.master.mahasiswa_bimbingan_dosen.delete", mahasiswa_bimbingan_dosen::delete),
                ),
        )
        .push(
            Router::with_path("mahasiswa-lulusan-dropout")
                .get_named("feeder.master.mahasiswa_lulusan_dropout.index", mahasiswa_lulusan_dropout::index)
                .post_named("feeder.master.mahasiswa_lulusan_dropout.store", mahasiswa_lulusan_dropout::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.mahasiswa_lulusan_dropout.show", mahasiswa_lulusan_dropout::show)
                        .put_named("feeder.master.mahasiswa_lulusan_dropout.update", mahasiswa_lulusan_dropout::update)
                        .delete_named("feeder.master.mahasiswa_lulusan_dropout.delete", mahasiswa_lulusan_dropout::delete),
                ),
        )
        .push(
            Router::with_path("matakuliah")
                .get_named("feeder.master.matakuliah.index", matakuliah::index)
                .post_named("feeder.master.matakuliah.store", matakuliah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.matakuliah.show", matakuliah::show)
                        .put_named("feeder.master.matakuliah.update", matakuliah::update)
                        .delete_named("feeder.master.matakuliah.delete", matakuliah::delete),
                ),
        )
        .push(
            Router::with_path("matakuliah-kurikulum")
                .get_named("feeder.master.matakuliah_kurikulum.index", matakuliah_kurikulum::index)
                .post_named("feeder.master.matakuliah_kurikulum.store", matakuliah_kurikulum::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.matakuliah_kurikulum.show", matakuliah_kurikulum::show)
                        .put_named("feeder.master.matakuliah_kurikulum.update", matakuliah_kurikulum::update)
                        .delete_named("feeder.master.matakuliah_kurikulum.delete", matakuliah_kurikulum::delete),
                ),
        )
        .push(
            Router::with_path("nilai-perkuliahan-kelas")
                .get_named("feeder.master.nilai_perkuliahan_kelas.index", nilai_perkuliahan_kelas::index)
                .post_named("feeder.master.nilai_perkuliahan_kelas.store", nilai_perkuliahan_kelas::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.nilai_perkuliahan_kelas.show", nilai_perkuliahan_kelas::show)
                        .put_named("feeder.master.nilai_perkuliahan_kelas.update", nilai_perkuliahan_kelas::update)
                        .delete_named("feeder.master.nilai_perkuliahan_kelas.delete", nilai_perkuliahan_kelas::delete),
                ),
        )
        .push(
            Router::with_path("nilai-transfer-pendidikan-mahasiswa")
                .get_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.index", nilai_transfer_pendidikan_mahasiswa::index)
                .post_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.store", nilai_transfer_pendidikan_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.show", nilai_transfer_pendidikan_mahasiswa::show)
                        .put_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.update", nilai_transfer_pendidikan_mahasiswa::update)
                        .delete_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.delete", nilai_transfer_pendidikan_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("penugasan-dosen")
                .get_named("feeder.master.penugasan_dosen.index", penugasan_dosen::index)
                .post_named("feeder.master.penugasan_dosen.store", penugasan_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.penugasan_dosen.show", penugasan_dosen::show)
                        .put_named("feeder.master.penugasan_dosen.update", penugasan_dosen::update)
                        .delete_named("feeder.master.penugasan_dosen.delete", penugasan_dosen::delete),
                ),
        )
        .push(
            Router::with_path("perguruan-tinggi")
                .get_named("feeder.master.perguruan_tinggi.index", perguruan_tinggi::index)
                .post_named("feeder.master.perguruan_tinggi.store", perguruan_tinggi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.perguruan_tinggi.show", perguruan_tinggi::show)
                        .put_named("feeder.master.perguruan_tinggi.update", perguruan_tinggi::update)
                        .delete_named("feeder.master.perguruan_tinggi.delete", perguruan_tinggi::delete),
                ),
        )
        .push(
            Router::with_path("periode-aktif")
                .get_named("feeder.master.periode_aktif.index", periode_aktif::index)
                .post_named("feeder.master.periode_aktif.store", periode_aktif::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.periode_aktif.show", periode_aktif::show)
                        .put_named("feeder.master.periode_aktif.update", periode_aktif::update)
                        .delete_named("feeder.master.periode_aktif.delete", periode_aktif::delete),
                ),
        )
        .push(
            Router::with_path("periode-perkuliahan")
                .get_named("feeder.master.periode_perkuliahan.index", periode_perkuliahan::index)
                .post_named("feeder.master.periode_perkuliahan.store", periode_perkuliahan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.periode_perkuliahan.show", periode_perkuliahan::show)
                        .put_named("feeder.master.periode_perkuliahan.update", periode_perkuliahan::update)
                        .delete_named("feeder.master.periode_perkuliahan.delete", periode_perkuliahan::delete),
                ),
        )
        .push(
            Router::with_path("perkuliahan-mahasiswa")
                .get_named("feeder.master.perkuliahan_mahasiswa.index", perkuliahan_mahasiswa::index)
                .post_named("feeder.master.perkuliahan_mahasiswa.store", perkuliahan_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.perkuliahan_mahasiswa.show", perkuliahan_mahasiswa::show)
                        .put_named("feeder.master.perkuliahan_mahasiswa.update", perkuliahan_mahasiswa::update)
                        .delete_named("feeder.master.perkuliahan_mahasiswa.delete", perkuliahan_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("peserta-kelas-kuliah")
                .get_named("feeder.master.peserta_kelas_kuliah.index", peserta_kelas_kuliah::index)
                .post_named("feeder.master.peserta_kelas_kuliah.store", peserta_kelas_kuliah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.peserta_kelas_kuliah.show", peserta_kelas_kuliah::show)
                        .put_named("feeder.master.peserta_kelas_kuliah.update", peserta_kelas_kuliah::update)
                        .delete_named("feeder.master.peserta_kelas_kuliah.delete", peserta_kelas_kuliah::delete),
                ),
        )
        .push(
            Router::with_path("prestasi-mahasiswa")
                .get_named("feeder.master.prestasi_mahasiswa.index", prestasi_mahasiswa::index)
                .post_named("feeder.master.prestasi_mahasiswa.store", prestasi_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.prestasi_mahasiswa.show", prestasi_mahasiswa::show)
                        .put_named("feeder.master.prestasi_mahasiswa.update", prestasi_mahasiswa::update)
                        .delete_named("feeder.master.prestasi_mahasiswa.delete", prestasi_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("profil-perguruan-tinggi")
                .get_named("feeder.master.profil_perguruan_tinggi.index", profil_perguruan_tinggi::index)
                .post_named("feeder.master.profil_perguruan_tinggi.store", profil_perguruan_tinggi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.profil_perguruan_tinggi.show", profil_perguruan_tinggi::show)
                        .put_named("feeder.master.profil_perguruan_tinggi.update", profil_perguruan_tinggi::update)
                        .delete_named("feeder.master.profil_perguruan_tinggi.delete", profil_perguruan_tinggi::delete),
                ),
        )
        .push(
            Router::with_path("program-studi")
                .get_named("feeder.master.program_studi.index", program_studi::index)
                .post_named("feeder.master.program_studi.store", program_studi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.program_studi.show", program_studi::show)
                        .put_named("feeder.master.program_studi.update", program_studi::update)
                        .delete_named("feeder.master.program_studi.delete", program_studi::delete),
                ),
        )
        .push(
            Router::with_path("rencana-evaluasi")
                .get_named("feeder.master.rencana_evaluasi.index", rencana_evaluasi::index)
                .post_named("feeder.master.rencana_evaluasi.store", rencana_evaluasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.rencana_evaluasi.show", rencana_evaluasi::show)
                        .put_named("feeder.master.rencana_evaluasi.update", rencana_evaluasi::update)
                        .delete_named("feeder.master.rencana_evaluasi.delete", rencana_evaluasi::delete),
                ),
        )
        .push(
            Router::with_path("rencana-pembelajaran")
                .get_named("feeder.master.rencana_pembelajaran.index", rencana_pembelajaran::index)
                .post_named("feeder.master.rencana_pembelajaran.store", rencana_pembelajaran::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.rencana_pembelajaran.show", rencana_pembelajaran::show)
                        .put_named("feeder.master.rencana_pembelajaran.update", rencana_pembelajaran::update)
                        .delete_named("feeder.master.rencana_pembelajaran.delete", rencana_pembelajaran::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-fungsional-dosen")
                .get_named("feeder.master.riwayat_fungsional_dosen.index", riwayat_fungsional_dosen::index)
                .post_named("feeder.master.riwayat_fungsional_dosen.store", riwayat_fungsional_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_fungsional_dosen.show", riwayat_fungsional_dosen::show)
                        .put_named("feeder.master.riwayat_fungsional_dosen.update", riwayat_fungsional_dosen::update)
                        .delete_named("feeder.master.riwayat_fungsional_dosen.delete", riwayat_fungsional_dosen::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-nilai-mahasiswa")
                .get_named("feeder.master.riwayat_nilai_mahasiswa.index", riwayat_nilai_mahasiswa::index)
                .post_named("feeder.master.riwayat_nilai_mahasiswa.store", riwayat_nilai_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_nilai_mahasiswa.show", riwayat_nilai_mahasiswa::show)
                        .put_named("feeder.master.riwayat_nilai_mahasiswa.update", riwayat_nilai_mahasiswa::update)
                        .delete_named("feeder.master.riwayat_nilai_mahasiswa.delete", riwayat_nilai_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-pangkat-dosen")
                .get_named("feeder.master.riwayat_pangkat_dosen.index", riwayat_pangkat_dosen::index)
                .post_named("feeder.master.riwayat_pangkat_dosen.store", riwayat_pangkat_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_pangkat_dosen.show", riwayat_pangkat_dosen::show)
                        .put_named("feeder.master.riwayat_pangkat_dosen.update", riwayat_pangkat_dosen::update)
                        .delete_named("feeder.master.riwayat_pangkat_dosen.delete", riwayat_pangkat_dosen::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-pendidikan-dosen")
                .get_named("feeder.master.riwayat_pendidikan_dosen.index", riwayat_pendidikan_dosen::index)
                .post_named("feeder.master.riwayat_pendidikan_dosen.store", riwayat_pendidikan_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_pendidikan_dosen.show", riwayat_pendidikan_dosen::show)
                        .put_named("feeder.master.riwayat_pendidikan_dosen.update", riwayat_pendidikan_dosen::update)
                        .delete_named("feeder.master.riwayat_pendidikan_dosen.delete", riwayat_pendidikan_dosen::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-pendidikan-mahasiswa")
                .get_named("feeder.master.riwayat_pendidikan_mahasiswa.index", riwayat_pendidikan_mahasiswa::index)
                .post_named("feeder.master.riwayat_pendidikan_mahasiswa.store", riwayat_pendidikan_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_pendidikan_mahasiswa.show", riwayat_pendidikan_mahasiswa::show)
                        .put_named("feeder.master.riwayat_pendidikan_mahasiswa.update", riwayat_pendidikan_mahasiswa::update)
                        .delete_named("feeder.master.riwayat_pendidikan_mahasiswa.delete", riwayat_pendidikan_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-penelitian-dosen")
                .get_named("feeder.master.riwayat_penelitian_dosen.index", riwayat_penelitian_dosen::index)
                .post_named("feeder.master.riwayat_penelitian_dosen.store", riwayat_penelitian_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_penelitian_dosen.show", riwayat_penelitian_dosen::show)
                        .put_named("feeder.master.riwayat_penelitian_dosen.update", riwayat_penelitian_dosen::update)
                        .delete_named("feeder.master.riwayat_penelitian_dosen.delete", riwayat_penelitian_dosen::delete),
                ),
        )
        .push(
            Router::with_path("riwayat-sertifikasi-dosen")
                .get_named("feeder.master.riwayat_sertifikasi_dosen.index", riwayat_sertifikasi_dosen::index)
                .post_named("feeder.master.riwayat_sertifikasi_dosen.store", riwayat_sertifikasi_dosen::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_sertifikasi_dosen.show", riwayat_sertifikasi_dosen::show)
                        .put_named("feeder.master.riwayat_sertifikasi_dosen.update", riwayat_sertifikasi_dosen::update)
                        .delete_named("feeder.master.riwayat_sertifikasi_dosen.delete", riwayat_sertifikasi_dosen::delete),
                ),
        )
        .push(
            Router::with_path("skala-nilai-program-studi")
                .get_named("feeder.master.skala_nilai_program_studi.index", skala_nilai_program_studi::index)
                .post_named("feeder.master.skala_nilai_program_studi.store", skala_nilai_program_studi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.skala_nilai_program_studi.show", skala_nilai_program_studi::show)
                        .put_named("feeder.master.skala_nilai_program_studi.update", skala_nilai_program_studi::update)
                        .delete_named("feeder.master.skala_nilai_program_studi.delete", skala_nilai_program_studi::delete),
                ),
        )
        .push(
            Router::with_path("substansi-matakuliah")
                .get_named("feeder.master.substansi_matakuliah.index", substansi_matakuliah::index)
                .post_named("feeder.master.substansi_matakuliah.store", substansi_matakuliah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.substansi_matakuliah.show", substansi_matakuliah::show)
                        .put_named("feeder.master.substansi_matakuliah.update", substansi_matakuliah::update)
                        .delete_named("feeder.master.substansi_matakuliah.delete", substansi_matakuliah::delete),
                ),
        )
        .push(
            Router::with_path("transkrip-mahasiswa")
                .get_named("feeder.master.transkrip_mahasiswa.index", transkrip_mahasiswa::index)
                .post_named("feeder.master.transkrip_mahasiswa.store", transkrip_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.transkrip_mahasiswa.show", transkrip_mahasiswa::show)
                        .put_named("feeder.master.transkrip_mahasiswa.update", transkrip_mahasiswa::update)
                        .delete_named("feeder.master.transkrip_mahasiswa.delete", transkrip_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("uji-mahasiswa")
                .get_named("feeder.master.uji_mahasiswa.index", uji_mahasiswa::index)
                .post_named("feeder.master.uji_mahasiswa.store", uji_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.uji_mahasiswa.show", uji_mahasiswa::show)
                        .put_named("feeder.master.uji_mahasiswa.update", uji_mahasiswa::update)
                        .delete_named("feeder.master.uji_mahasiswa.delete", uji_mahasiswa::delete),
                ),
        )
}
