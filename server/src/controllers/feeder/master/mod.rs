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
                .get_named("feeder.master.aktifitas_kuliah_mahasiswa.list_aktifitas_kuliah_mahasiswa", aktifitas_kuliah_mahasiswa::list_aktifitas_kuliah_mahasiswa)
                .post_named("feeder.master.aktifitas_kuliah_mahasiswa.create_aktifitas_kuliah_mahasiswa", aktifitas_kuliah_mahasiswa::create_aktifitas_kuliah_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.aktifitas_kuliah_mahasiswa.get_aktifitas_kuliah_mahasiswa", aktifitas_kuliah_mahasiswa::get_aktifitas_kuliah_mahasiswa)
                        .put_named("feeder.master.aktifitas_kuliah_mahasiswa.update_aktifitas_kuliah_mahasiswa", aktifitas_kuliah_mahasiswa::update_aktifitas_kuliah_mahasiswa)
                        .delete_named("feeder.master.aktifitas_kuliah_mahasiswa.delete_aktifitas_kuliah_mahasiswa", aktifitas_kuliah_mahasiswa::delete_aktifitas_kuliah_mahasiswa),
                ),
        )
        .push(
            Router::with_path("aktifitas-mahasiswa")
                .get_named("feeder.master.aktifitas_mahasiswa.list_aktifitas_mahasiswa", aktifitas_mahasiswa::list_aktifitas_mahasiswa)
                .post_named("feeder.master.aktifitas_mahasiswa.create_aktifitas_mahasiswa", aktifitas_mahasiswa::create_aktifitas_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.aktifitas_mahasiswa.get_aktifitas_mahasiswa", aktifitas_mahasiswa::get_aktifitas_mahasiswa)
                        .put_named("feeder.master.aktifitas_mahasiswa.update_aktifitas_mahasiswa", aktifitas_mahasiswa::update_aktifitas_mahasiswa)
                        .delete_named("feeder.master.aktifitas_mahasiswa.delete_aktifitas_mahasiswa", aktifitas_mahasiswa::delete_aktifitas_mahasiswa),
                ),
        )
        .push(
            Router::with_path("aktifitas-mengajar-dosen")
                .get_named("feeder.master.aktifitas_mengajar_dosen.list_aktifitas_mengajar_dosen", aktifitas_mengajar_dosen::list_aktifitas_mengajar_dosen)
                .post_named("feeder.master.aktifitas_mengajar_dosen.create_aktifitas_mengajar_dosen", aktifitas_mengajar_dosen::create_aktifitas_mengajar_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.aktifitas_mengajar_dosen.get_aktifitas_mengajar_dosen", aktifitas_mengajar_dosen::get_aktifitas_mengajar_dosen)
                        .put_named("feeder.master.aktifitas_mengajar_dosen.update_aktifitas_mengajar_dosen", aktifitas_mengajar_dosen::update_aktifitas_mengajar_dosen)
                        .delete_named("feeder.master.aktifitas_mengajar_dosen.delete_aktifitas_mengajar_dosen", aktifitas_mengajar_dosen::delete_aktifitas_mengajar_dosen),
                ),
        )
        .push(
            Router::with_path("anggota-aktifitas-mahasiswa")
                .get_named("feeder.master.anggota_aktifitas_mahasiswa.list_anggota_aktifitas_mahasiswa", anggota_aktifitas_mahasiswa::list_anggota_aktifitas_mahasiswa)
                .post_named("feeder.master.anggota_aktifitas_mahasiswa.create_anggota_aktifitas_mahasiswa", anggota_aktifitas_mahasiswa::create_anggota_aktifitas_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.anggota_aktifitas_mahasiswa.get_anggota_aktifitas_mahasiswa", anggota_aktifitas_mahasiswa::get_anggota_aktifitas_mahasiswa)
                        .put_named("feeder.master.anggota_aktifitas_mahasiswa.update_anggota_aktifitas_mahasiswa", anggota_aktifitas_mahasiswa::update_anggota_aktifitas_mahasiswa)
                        .delete_named("feeder.master.anggota_aktifitas_mahasiswa.delete_anggota_aktifitas_mahasiswa", anggota_aktifitas_mahasiswa::delete_anggota_aktifitas_mahasiswa),
                ),
        )
        .push(
            Router::with_path("bidang-minat-perguruan-tinggi")
                .get_named("feeder.master.bidang_minat_perguruan_tinggi.list_bidang_minat_perguruan_tinggi", bidang_minat_perguruan_tinggi::list_bidang_minat_perguruan_tinggi)
                .post_named("feeder.master.bidang_minat_perguruan_tinggi.create_bidang_minat_perguruan_tinggi", bidang_minat_perguruan_tinggi::create_bidang_minat_perguruan_tinggi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.bidang_minat_perguruan_tinggi.get_bidang_minat_perguruan_tinggi", bidang_minat_perguruan_tinggi::get_bidang_minat_perguruan_tinggi)
                        .put_named("feeder.master.bidang_minat_perguruan_tinggi.update_bidang_minat_perguruan_tinggi", bidang_minat_perguruan_tinggi::update_bidang_minat_perguruan_tinggi)
                        .delete_named("feeder.master.bidang_minat_perguruan_tinggi.delete_bidang_minat_perguruan_tinggi", bidang_minat_perguruan_tinggi::delete_bidang_minat_perguruan_tinggi),
                ),
        )
        .push(
            Router::with_path("bimbing-mahasiswa")
                .get_named("feeder.master.bimbing_mahasiswa.list_bimbing_mahasiswa", bimbing_mahasiswa::list_bimbing_mahasiswa)
                .post_named("feeder.master.bimbing_mahasiswa.create_bimbing_mahasiswa", bimbing_mahasiswa::create_bimbing_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.bimbing_mahasiswa.get_bimbing_mahasiswa", bimbing_mahasiswa::get_bimbing_mahasiswa)
                        .put_named("feeder.master.bimbing_mahasiswa.update_bimbing_mahasiswa", bimbing_mahasiswa::update_bimbing_mahasiswa)
                        .delete_named("feeder.master.bimbing_mahasiswa.delete_bimbing_mahasiswa", bimbing_mahasiswa::delete_bimbing_mahasiswa),
                ),
        )
        .push(
            Router::with_path("biodata-dosen")
                .get_named("feeder.master.biodata_dosen.list_biodata_dosen", biodata_dosen::list_biodata_dosen)
                .post_named("feeder.master.biodata_dosen.create_biodata_dosen", biodata_dosen::create_biodata_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.biodata_dosen.get_biodata_dosen", biodata_dosen::get_biodata_dosen)
                        .put_named("feeder.master.biodata_dosen.update_biodata_dosen", biodata_dosen::update_biodata_dosen)
                        .delete_named("feeder.master.biodata_dosen.delete_biodata_dosen", biodata_dosen::delete_biodata_dosen),
                ),
        )
        .push(
            Router::with_path("biodata-mahasiswa")
                .get_named("feeder.master.biodata_mahasiswa.list_biodata_mahasiswa", biodata_mahasiswa::list_biodata_mahasiswa)
                .post_named("feeder.master.biodata_mahasiswa.create_biodata_mahasiswa", biodata_mahasiswa::create_biodata_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.biodata_mahasiswa.get_biodata_mahasiswa", biodata_mahasiswa::get_biodata_mahasiswa)
                        .put_named("feeder.master.biodata_mahasiswa.update_biodata_mahasiswa", biodata_mahasiswa::update_biodata_mahasiswa)
                        .delete_named("feeder.master.biodata_mahasiswa.delete_biodata_mahasiswa", biodata_mahasiswa::delete_biodata_mahasiswa),
                ),
        )
        .push(
            Router::with_path("detail-nilai-perkuliahan-kelas")
                .get_named("feeder.master.detail_nilai_perkuliahan_kelas.list_detail_nilai_perkuliahan_kelas", detail_nilai_perkuliahan_kelas::list_detail_nilai_perkuliahan_kelas)
                .post_named("feeder.master.detail_nilai_perkuliahan_kelas.create_detail_nilai_perkuliahan_kela", detail_nilai_perkuliahan_kelas::create_detail_nilai_perkuliahan_kela)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.detail_nilai_perkuliahan_kelas.get_detail_nilai_perkuliahan_kela", detail_nilai_perkuliahan_kelas::get_detail_nilai_perkuliahan_kela)
                        .put_named("feeder.master.detail_nilai_perkuliahan_kelas.update_detail_nilai_perkuliahan_kela", detail_nilai_perkuliahan_kelas::update_detail_nilai_perkuliahan_kela)
                        .delete_named("feeder.master.detail_nilai_perkuliahan_kelas.delete_detail_nilai_perkuliahan_kela", detail_nilai_perkuliahan_kelas::delete_detail_nilai_perkuliahan_kela),
                ),
        )
        .push(
            Router::with_path("dosen")
                .get_named("feeder.master.dosen.list_dosen", dosen::list_dosen)
                .post_named("feeder.master.dosen.create_dosen", dosen::create_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.dosen.get_dosen", dosen::get_dosen)
                        .put_named("feeder.master.dosen.update_dosen", dosen::update_dosen)
                        .delete_named("feeder.master.dosen.delete_dosen", dosen::delete_dosen),
                ),
        )
        .push(
            Router::with_path("dosen-pembimbing")
                .get_named("feeder.master.dosen_pembimbing.list_dosen_pembimbing", dosen_pembimbing::list_dosen_pembimbing)
                .post_named("feeder.master.dosen_pembimbing.create_dosen_pembimbing", dosen_pembimbing::create_dosen_pembimbing)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.dosen_pembimbing.get_dosen_pembimbing", dosen_pembimbing::get_dosen_pembimbing)
                        .put_named("feeder.master.dosen_pembimbing.update_dosen_pembimbing", dosen_pembimbing::update_dosen_pembimbing)
                        .delete_named("feeder.master.dosen_pembimbing.delete_dosen_pembimbing", dosen_pembimbing::delete_dosen_pembimbing),
                ),
        )
        .push(
            Router::with_path("dosen-pengajar-kelas-kuliah")
                .get_named("feeder.master.dosen_pengajar_kelas_kuliah.list_dosen_pengajar_kelas_kuliah", dosen_pengajar_kelas_kuliah::list_dosen_pengajar_kelas_kuliah)
                .post_named("feeder.master.dosen_pengajar_kelas_kuliah.create_dosen_pengajar_kelas_kuliah", dosen_pengajar_kelas_kuliah::create_dosen_pengajar_kelas_kuliah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.dosen_pengajar_kelas_kuliah.get_dosen_pengajar_kelas_kuliah", dosen_pengajar_kelas_kuliah::get_dosen_pengajar_kelas_kuliah)
                        .put_named("feeder.master.dosen_pengajar_kelas_kuliah.update_dosen_pengajar_kelas_kuliah", dosen_pengajar_kelas_kuliah::update_dosen_pengajar_kelas_kuliah)
                        .delete_named("feeder.master.dosen_pengajar_kelas_kuliah.delete_dosen_pengajar_kelas_kuliah", dosen_pengajar_kelas_kuliah::delete_dosen_pengajar_kelas_kuliah),
                ),
        )
        .push(
            Router::with_path("fakultas")
                .get_named("feeder.master.fakultas.list_fakultas", fakultas::list_fakultas)
                .post_named("feeder.master.fakultas.create_fakulta", fakultas::create_fakulta)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.fakultas.get_fakulta", fakultas::get_fakulta)
                        .put_named("feeder.master.fakultas.update_fakulta", fakultas::update_fakulta)
                        .delete_named("feeder.master.fakultas.delete_fakulta", fakultas::delete_fakulta),
                ),
        )
        .push(
            Router::with_path("hitung-transkrip-angkatan-mahasiswa")
                .get_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.list_hitung_transkrip_angkatan_mahasiswa", hitung_transkrip_angkatan_mahasiswa::list_hitung_transkrip_angkatan_mahasiswa)
                .post_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.create_hitung_transkrip_angkatan_mahasiswa", hitung_transkrip_angkatan_mahasiswa::create_hitung_transkrip_angkatan_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.get_hitung_transkrip_angkatan_mahasiswa", hitung_transkrip_angkatan_mahasiswa::get_hitung_transkrip_angkatan_mahasiswa)
                        .put_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.update_hitung_transkrip_angkatan_mahasiswa", hitung_transkrip_angkatan_mahasiswa::update_hitung_transkrip_angkatan_mahasiswa)
                        .delete_named("feeder.master.hitung_transkrip_angkatan_mahasiswa.delete_hitung_transkrip_angkatan_mahasiswa", hitung_transkrip_angkatan_mahasiswa::delete_hitung_transkrip_angkatan_mahasiswa),
                ),
        )
        .push(
            Router::with_path("kartu-rencana-studi-mahasiswa")
                .get_named("feeder.master.kartu_rencana_studi_mahasiswa.list_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::list_kartu_rencana_studi_mahasiswa)
                .post_named("feeder.master.kartu_rencana_studi_mahasiswa.create_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::create_kartu_rencana_studi_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.kartu_rencana_studi_mahasiswa.get_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::get_kartu_rencana_studi_mahasiswa)
                        .put_named("feeder.master.kartu_rencana_studi_mahasiswa.update_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::update_kartu_rencana_studi_mahasiswa)
                        .delete_named("feeder.master.kartu_rencana_studi_mahasiswa.delete_kartu_rencana_studi_mahasiswa", kartu_rencana_studi_mahasiswa::delete_kartu_rencana_studi_mahasiswa),
                ),
        )
        .push(
            Router::with_path("kelas-kuliah")
                .get_named("feeder.master.kelas_kuliah.list_kelas_kuliah", kelas_kuliah::list_kelas_kuliah)
                .post_named("feeder.master.kelas_kuliah.create_kelas_kuliah", kelas_kuliah::create_kelas_kuliah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.kelas_kuliah.get_kelas_kuliah", kelas_kuliah::get_kelas_kuliah)
                        .put_named("feeder.master.kelas_kuliah.update_kelas_kuliah", kelas_kuliah::update_kelas_kuliah)
                        .delete_named("feeder.master.kelas_kuliah.delete_kelas_kuliah", kelas_kuliah::delete_kelas_kuliah),
                ),
        )
        .push(
            Router::with_path("komponen-evaluasi-kelas")
                .get_named("feeder.master.komponen_evaluasi_kelas.list_komponen_evaluasi_kelas", komponen_evaluasi_kelas::list_komponen_evaluasi_kelas)
                .post_named("feeder.master.komponen_evaluasi_kelas.create_komponen_evaluasi_kela", komponen_evaluasi_kelas::create_komponen_evaluasi_kela)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.komponen_evaluasi_kelas.get_komponen_evaluasi_kela", komponen_evaluasi_kelas::get_komponen_evaluasi_kela)
                        .put_named("feeder.master.komponen_evaluasi_kelas.update_komponen_evaluasi_kela", komponen_evaluasi_kelas::update_komponen_evaluasi_kela)
                        .delete_named("feeder.master.komponen_evaluasi_kelas.delete_komponen_evaluasi_kela", komponen_evaluasi_kelas::delete_komponen_evaluasi_kela),
                ),
        )
        .push(
            Router::with_path("konsistensi-data")
                .get_named("feeder.master.konsistensi_data.list_konsistensi_data", konsistensi_data::list_konsistensi_data)
                .post_named("feeder.master.konsistensi_data.create_konsistensi_data", konsistensi_data::create_konsistensi_data)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.konsistensi_data.get_konsistensi_data", konsistensi_data::get_konsistensi_data)
                        .put_named("feeder.master.konsistensi_data.update_konsistensi_data", konsistensi_data::update_konsistensi_data)
                        .delete_named("feeder.master.konsistensi_data.delete_konsistensi_data", konsistensi_data::delete_konsistensi_data),
                ),
        )
        .push(
            Router::with_path("konversi-kampus-merdeka")
                .get_named("feeder.master.konversi_kampus_merdeka.list_konversi_kampus_merdeka", konversi_kampus_merdeka::list_konversi_kampus_merdeka)
                .post_named("feeder.master.konversi_kampus_merdeka.create_konversi_kampus_merdeka", konversi_kampus_merdeka::create_konversi_kampus_merdeka)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.konversi_kampus_merdeka.get_konversi_kampus_merdeka", konversi_kampus_merdeka::get_konversi_kampus_merdeka)
                        .put_named("feeder.master.konversi_kampus_merdeka.update_konversi_kampus_merdeka", konversi_kampus_merdeka::update_konversi_kampus_merdeka)
                        .delete_named("feeder.master.konversi_kampus_merdeka.delete_konversi_kampus_merdeka", konversi_kampus_merdeka::delete_konversi_kampus_merdeka),
                ),
        )
        .push(
            Router::with_path("kurikulum")
                .get_named("feeder.master.kurikulum.list_kurikulum", kurikulum::list_kurikulum)
                .post_named("feeder.master.kurikulum.create_kurikulum", kurikulum::create_kurikulum)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.kurikulum.get_kurikulum", kurikulum::get_kurikulum)
                        .put_named("feeder.master.kurikulum.update_kurikulum", kurikulum::update_kurikulum)
                        .delete_named("feeder.master.kurikulum.delete_kurikulum", kurikulum::delete_kurikulum),
                ),
        )
        .push(
            Router::with_path("mahasiswa")
                .get_named("feeder.master.mahasiswa.list_mahasiswa", mahasiswa::list_mahasiswa)
                .post_named("feeder.master.mahasiswa.create_mahasiswa", mahasiswa::create_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.mahasiswa.get_mahasiswa", mahasiswa::get_mahasiswa)
                        .put_named("feeder.master.mahasiswa.update_mahasiswa", mahasiswa::update_mahasiswa)
                        .delete_named("feeder.master.mahasiswa.delete_mahasiswa", mahasiswa::delete_mahasiswa),
                ),
        )
        .push(
            Router::with_path("mahasiswa-bimbingan-dosen")
                .get_named("feeder.master.mahasiswa_bimbingan_dosen.list_mahasiswa_bimbingan_dosen", mahasiswa_bimbingan_dosen::list_mahasiswa_bimbingan_dosen)
                .post_named("feeder.master.mahasiswa_bimbingan_dosen.create_mahasiswa_bimbingan_dosen", mahasiswa_bimbingan_dosen::create_mahasiswa_bimbingan_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.mahasiswa_bimbingan_dosen.get_mahasiswa_bimbingan_dosen", mahasiswa_bimbingan_dosen::get_mahasiswa_bimbingan_dosen)
                        .put_named("feeder.master.mahasiswa_bimbingan_dosen.update_mahasiswa_bimbingan_dosen", mahasiswa_bimbingan_dosen::update_mahasiswa_bimbingan_dosen)
                        .delete_named("feeder.master.mahasiswa_bimbingan_dosen.delete_mahasiswa_bimbingan_dosen", mahasiswa_bimbingan_dosen::delete_mahasiswa_bimbingan_dosen),
                ),
        )
        .push(
            Router::with_path("mahasiswa-lulusan-dropout")
                .get_named("feeder.master.mahasiswa_lulusan_dropout.list_mahasiswa_lulusan_dropout", mahasiswa_lulusan_dropout::list_mahasiswa_lulusan_dropout)
                .post_named("feeder.master.mahasiswa_lulusan_dropout.create_mahasiswa_lulusan_dropout", mahasiswa_lulusan_dropout::create_mahasiswa_lulusan_dropout)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.mahasiswa_lulusan_dropout.get_mahasiswa_lulusan_dropout", mahasiswa_lulusan_dropout::get_mahasiswa_lulusan_dropout)
                        .put_named("feeder.master.mahasiswa_lulusan_dropout.update_mahasiswa_lulusan_dropout", mahasiswa_lulusan_dropout::update_mahasiswa_lulusan_dropout)
                        .delete_named("feeder.master.mahasiswa_lulusan_dropout.delete_mahasiswa_lulusan_dropout", mahasiswa_lulusan_dropout::delete_mahasiswa_lulusan_dropout),
                ),
        )
        .push(
            Router::with_path("matakuliah")
                .get_named("feeder.master.matakuliah.list_matakuliah", matakuliah::list_matakuliah)
                .post_named("feeder.master.matakuliah.create_matakuliah", matakuliah::create_matakuliah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.matakuliah.get_matakuliah", matakuliah::get_matakuliah)
                        .put_named("feeder.master.matakuliah.update_matakuliah", matakuliah::update_matakuliah)
                        .delete_named("feeder.master.matakuliah.delete_matakuliah", matakuliah::delete_matakuliah),
                ),
        )
        .push(
            Router::with_path("matakuliah-kurikulum")
                .get_named("feeder.master.matakuliah_kurikulum.list_matakuliah_kurikulum", matakuliah_kurikulum::list_matakuliah_kurikulum)
                .post_named("feeder.master.matakuliah_kurikulum.create_matakuliah_kurikulum", matakuliah_kurikulum::create_matakuliah_kurikulum)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.matakuliah_kurikulum.get_matakuliah_kurikulum", matakuliah_kurikulum::get_matakuliah_kurikulum)
                        .put_named("feeder.master.matakuliah_kurikulum.update_matakuliah_kurikulum", matakuliah_kurikulum::update_matakuliah_kurikulum)
                        .delete_named("feeder.master.matakuliah_kurikulum.delete_matakuliah_kurikulum", matakuliah_kurikulum::delete_matakuliah_kurikulum),
                ),
        )
        .push(
            Router::with_path("nilai-perkuliahan-kelas")
                .get_named("feeder.master.nilai_perkuliahan_kelas.list_nilai_perkuliahan_kelas", nilai_perkuliahan_kelas::list_nilai_perkuliahan_kelas)
                .post_named("feeder.master.nilai_perkuliahan_kelas.create_nilai_perkuliahan_kela", nilai_perkuliahan_kelas::create_nilai_perkuliahan_kela)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.nilai_perkuliahan_kelas.get_nilai_perkuliahan_kela", nilai_perkuliahan_kelas::get_nilai_perkuliahan_kela)
                        .put_named("feeder.master.nilai_perkuliahan_kelas.update_nilai_perkuliahan_kela", nilai_perkuliahan_kelas::update_nilai_perkuliahan_kela)
                        .delete_named("feeder.master.nilai_perkuliahan_kelas.delete_nilai_perkuliahan_kela", nilai_perkuliahan_kelas::delete_nilai_perkuliahan_kela),
                ),
        )
        .push(
            Router::with_path("nilai-transfer-pendidikan-mahasiswa")
                .get_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.list_nilai_transfer_pendidikan_mahasiswa", nilai_transfer_pendidikan_mahasiswa::list_nilai_transfer_pendidikan_mahasiswa)
                .post_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.create_nilai_transfer_pendidikan_mahasiswa", nilai_transfer_pendidikan_mahasiswa::create_nilai_transfer_pendidikan_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.get_nilai_transfer_pendidikan_mahasiswa", nilai_transfer_pendidikan_mahasiswa::get_nilai_transfer_pendidikan_mahasiswa)
                        .put_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.update_nilai_transfer_pendidikan_mahasiswa", nilai_transfer_pendidikan_mahasiswa::update_nilai_transfer_pendidikan_mahasiswa)
                        .delete_named("feeder.master.nilai_transfer_pendidikan_mahasiswa.delete_nilai_transfer_pendidikan_mahasiswa", nilai_transfer_pendidikan_mahasiswa::delete_nilai_transfer_pendidikan_mahasiswa),
                ),
        )
        .push(
            Router::with_path("penugasan-dosen")
                .get_named("feeder.master.penugasan_dosen.list_penugasan_dosen", penugasan_dosen::list_penugasan_dosen)
                .post_named("feeder.master.penugasan_dosen.create_penugasan_dosen", penugasan_dosen::create_penugasan_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.penugasan_dosen.get_penugasan_dosen", penugasan_dosen::get_penugasan_dosen)
                        .put_named("feeder.master.penugasan_dosen.update_penugasan_dosen", penugasan_dosen::update_penugasan_dosen)
                        .delete_named("feeder.master.penugasan_dosen.delete_penugasan_dosen", penugasan_dosen::delete_penugasan_dosen),
                ),
        )
        .push(
            Router::with_path("perguruan-tinggi")
                .get_named("feeder.master.perguruan_tinggi.list_perguruan_tinggi", perguruan_tinggi::list_perguruan_tinggi)
                .post_named("feeder.master.perguruan_tinggi.create_perguruan_tinggi", perguruan_tinggi::create_perguruan_tinggi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.perguruan_tinggi.get_perguruan_tinggi", perguruan_tinggi::get_perguruan_tinggi)
                        .put_named("feeder.master.perguruan_tinggi.update_perguruan_tinggi", perguruan_tinggi::update_perguruan_tinggi)
                        .delete_named("feeder.master.perguruan_tinggi.delete_perguruan_tinggi", perguruan_tinggi::delete_perguruan_tinggi),
                ),
        )
        .push(
            Router::with_path("periode-aktif")
                .get_named("feeder.master.periode_aktif.list_periode_aktif", periode_aktif::list_periode_aktif)
                .post_named("feeder.master.periode_aktif.create_periode_aktif", periode_aktif::create_periode_aktif)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.periode_aktif.get_periode_aktif", periode_aktif::get_periode_aktif)
                        .put_named("feeder.master.periode_aktif.update_periode_aktif", periode_aktif::update_periode_aktif)
                        .delete_named("feeder.master.periode_aktif.delete_periode_aktif", periode_aktif::delete_periode_aktif),
                ),
        )
        .push(
            Router::with_path("periode-perkuliahan")
                .get_named("feeder.master.periode_perkuliahan.list_periode_perkuliahan", periode_perkuliahan::list_periode_perkuliahan)
                .post_named("feeder.master.periode_perkuliahan.create_periode_perkuliahan", periode_perkuliahan::create_periode_perkuliahan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.periode_perkuliahan.get_periode_perkuliahan", periode_perkuliahan::get_periode_perkuliahan)
                        .put_named("feeder.master.periode_perkuliahan.update_periode_perkuliahan", periode_perkuliahan::update_periode_perkuliahan)
                        .delete_named("feeder.master.periode_perkuliahan.delete_periode_perkuliahan", periode_perkuliahan::delete_periode_perkuliahan),
                ),
        )
        .push(
            Router::with_path("perkuliahan-mahasiswa")
                .get_named("feeder.master.perkuliahan_mahasiswa.list_perkuliahan_mahasiswa", perkuliahan_mahasiswa::list_perkuliahan_mahasiswa)
                .post_named("feeder.master.perkuliahan_mahasiswa.create_perkuliahan_mahasiswa", perkuliahan_mahasiswa::create_perkuliahan_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.perkuliahan_mahasiswa.get_perkuliahan_mahasiswa", perkuliahan_mahasiswa::get_perkuliahan_mahasiswa)
                        .put_named("feeder.master.perkuliahan_mahasiswa.update_perkuliahan_mahasiswa", perkuliahan_mahasiswa::update_perkuliahan_mahasiswa)
                        .delete_named("feeder.master.perkuliahan_mahasiswa.delete_perkuliahan_mahasiswa", perkuliahan_mahasiswa::delete_perkuliahan_mahasiswa),
                ),
        )
        .push(
            Router::with_path("peserta-kelas-kuliah")
                .get_named("feeder.master.peserta_kelas_kuliah.list_peserta_kelas_kuliah", peserta_kelas_kuliah::list_peserta_kelas_kuliah)
                .post_named("feeder.master.peserta_kelas_kuliah.create_peserta_kelas_kuliah", peserta_kelas_kuliah::create_peserta_kelas_kuliah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.peserta_kelas_kuliah.get_peserta_kelas_kuliah", peserta_kelas_kuliah::get_peserta_kelas_kuliah)
                        .put_named("feeder.master.peserta_kelas_kuliah.update_peserta_kelas_kuliah", peserta_kelas_kuliah::update_peserta_kelas_kuliah)
                        .delete_named("feeder.master.peserta_kelas_kuliah.delete_peserta_kelas_kuliah", peserta_kelas_kuliah::delete_peserta_kelas_kuliah),
                ),
        )
        .push(
            Router::with_path("prestasi-mahasiswa")
                .get_named("feeder.master.prestasi_mahasiswa.list_prestasi_mahasiswa", prestasi_mahasiswa::list_prestasi_mahasiswa)
                .post_named("feeder.master.prestasi_mahasiswa.create_prestasi_mahasiswa", prestasi_mahasiswa::create_prestasi_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.prestasi_mahasiswa.get_prestasi_mahasiswa", prestasi_mahasiswa::get_prestasi_mahasiswa)
                        .put_named("feeder.master.prestasi_mahasiswa.update_prestasi_mahasiswa", prestasi_mahasiswa::update_prestasi_mahasiswa)
                        .delete_named("feeder.master.prestasi_mahasiswa.delete_prestasi_mahasiswa", prestasi_mahasiswa::delete_prestasi_mahasiswa),
                ),
        )
        .push(
            Router::with_path("profil-perguruan-tinggi")
                .get_named("feeder.master.profil_perguruan_tinggi.list_profil_perguruan_tinggi", profil_perguruan_tinggi::list_profil_perguruan_tinggi)
                .post_named("feeder.master.profil_perguruan_tinggi.create_profil_perguruan_tinggi", profil_perguruan_tinggi::create_profil_perguruan_tinggi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.profil_perguruan_tinggi.get_profil_perguruan_tinggi", profil_perguruan_tinggi::get_profil_perguruan_tinggi)
                        .put_named("feeder.master.profil_perguruan_tinggi.update_profil_perguruan_tinggi", profil_perguruan_tinggi::update_profil_perguruan_tinggi)
                        .delete_named("feeder.master.profil_perguruan_tinggi.delete_profil_perguruan_tinggi", profil_perguruan_tinggi::delete_profil_perguruan_tinggi),
                ),
        )
        .push(
            Router::with_path("program-studi")
                .get_named("feeder.master.program_studi.list_program_studi", program_studi::list_program_studi)
                .post_named("feeder.master.program_studi.create_program_studi", program_studi::create_program_studi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.program_studi.get_program_studi", program_studi::get_program_studi)
                        .put_named("feeder.master.program_studi.update_program_studi", program_studi::update_program_studi)
                        .delete_named("feeder.master.program_studi.delete_program_studi", program_studi::delete_program_studi),
                ),
        )
        .push(
            Router::with_path("rencana-evaluasi")
                .get_named("feeder.master.rencana_evaluasi.list_rencana_evaluasi", rencana_evaluasi::list_rencana_evaluasi)
                .post_named("feeder.master.rencana_evaluasi.create_rencana_evaluasi", rencana_evaluasi::create_rencana_evaluasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.rencana_evaluasi.get_rencana_evaluasi", rencana_evaluasi::get_rencana_evaluasi)
                        .put_named("feeder.master.rencana_evaluasi.update_rencana_evaluasi", rencana_evaluasi::update_rencana_evaluasi)
                        .delete_named("feeder.master.rencana_evaluasi.delete_rencana_evaluasi", rencana_evaluasi::delete_rencana_evaluasi),
                ),
        )
        .push(
            Router::with_path("rencana-pembelajaran")
                .get_named("feeder.master.rencana_pembelajaran.list_rencana_pembelajaran", rencana_pembelajaran::list_rencana_pembelajaran)
                .post_named("feeder.master.rencana_pembelajaran.create_rencana_pembelajaran", rencana_pembelajaran::create_rencana_pembelajaran)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.rencana_pembelajaran.get_rencana_pembelajaran", rencana_pembelajaran::get_rencana_pembelajaran)
                        .put_named("feeder.master.rencana_pembelajaran.update_rencana_pembelajaran", rencana_pembelajaran::update_rencana_pembelajaran)
                        .delete_named("feeder.master.rencana_pembelajaran.delete_rencana_pembelajaran", rencana_pembelajaran::delete_rencana_pembelajaran),
                ),
        )
        .push(
            Router::with_path("riwayat-fungsional-dosen")
                .get_named("feeder.master.riwayat_fungsional_dosen.list_riwayat_fungsional_dosen", riwayat_fungsional_dosen::list_riwayat_fungsional_dosen)
                .post_named("feeder.master.riwayat_fungsional_dosen.create_riwayat_fungsional_dosen", riwayat_fungsional_dosen::create_riwayat_fungsional_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_fungsional_dosen.get_riwayat_fungsional_dosen", riwayat_fungsional_dosen::get_riwayat_fungsional_dosen)
                        .put_named("feeder.master.riwayat_fungsional_dosen.update_riwayat_fungsional_dosen", riwayat_fungsional_dosen::update_riwayat_fungsional_dosen)
                        .delete_named("feeder.master.riwayat_fungsional_dosen.delete_riwayat_fungsional_dosen", riwayat_fungsional_dosen::delete_riwayat_fungsional_dosen),
                ),
        )
        .push(
            Router::with_path("riwayat-nilai-mahasiswa")
                .get_named("feeder.master.riwayat_nilai_mahasiswa.list_riwayat_nilai_mahasiswa", riwayat_nilai_mahasiswa::list_riwayat_nilai_mahasiswa)
                .post_named("feeder.master.riwayat_nilai_mahasiswa.create_riwayat_nilai_mahasiswa", riwayat_nilai_mahasiswa::create_riwayat_nilai_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_nilai_mahasiswa.get_riwayat_nilai_mahasiswa", riwayat_nilai_mahasiswa::get_riwayat_nilai_mahasiswa)
                        .put_named("feeder.master.riwayat_nilai_mahasiswa.update_riwayat_nilai_mahasiswa", riwayat_nilai_mahasiswa::update_riwayat_nilai_mahasiswa)
                        .delete_named("feeder.master.riwayat_nilai_mahasiswa.delete_riwayat_nilai_mahasiswa", riwayat_nilai_mahasiswa::delete_riwayat_nilai_mahasiswa),
                ),
        )
        .push(
            Router::with_path("riwayat-pangkat-dosen")
                .get_named("feeder.master.riwayat_pangkat_dosen.list_riwayat_pangkat_dosen", riwayat_pangkat_dosen::list_riwayat_pangkat_dosen)
                .post_named("feeder.master.riwayat_pangkat_dosen.create_riwayat_pangkat_dosen", riwayat_pangkat_dosen::create_riwayat_pangkat_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_pangkat_dosen.get_riwayat_pangkat_dosen", riwayat_pangkat_dosen::get_riwayat_pangkat_dosen)
                        .put_named("feeder.master.riwayat_pangkat_dosen.update_riwayat_pangkat_dosen", riwayat_pangkat_dosen::update_riwayat_pangkat_dosen)
                        .delete_named("feeder.master.riwayat_pangkat_dosen.delete_riwayat_pangkat_dosen", riwayat_pangkat_dosen::delete_riwayat_pangkat_dosen),
                ),
        )
        .push(
            Router::with_path("riwayat-pendidikan-dosen")
                .get_named("feeder.master.riwayat_pendidikan_dosen.list_riwayat_pendidikan_dosen", riwayat_pendidikan_dosen::list_riwayat_pendidikan_dosen)
                .post_named("feeder.master.riwayat_pendidikan_dosen.create_riwayat_pendidikan_dosen", riwayat_pendidikan_dosen::create_riwayat_pendidikan_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_pendidikan_dosen.get_riwayat_pendidikan_dosen", riwayat_pendidikan_dosen::get_riwayat_pendidikan_dosen)
                        .put_named("feeder.master.riwayat_pendidikan_dosen.update_riwayat_pendidikan_dosen", riwayat_pendidikan_dosen::update_riwayat_pendidikan_dosen)
                        .delete_named("feeder.master.riwayat_pendidikan_dosen.delete_riwayat_pendidikan_dosen", riwayat_pendidikan_dosen::delete_riwayat_pendidikan_dosen),
                ),
        )
        .push(
            Router::with_path("riwayat-pendidikan-mahasiswa")
                .get_named("feeder.master.riwayat_pendidikan_mahasiswa.list_riwayat_pendidikan_mahasiswa", riwayat_pendidikan_mahasiswa::list_riwayat_pendidikan_mahasiswa)
                .post_named("feeder.master.riwayat_pendidikan_mahasiswa.create_riwayat_pendidikan_mahasiswa", riwayat_pendidikan_mahasiswa::create_riwayat_pendidikan_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_pendidikan_mahasiswa.get_riwayat_pendidikan_mahasiswa", riwayat_pendidikan_mahasiswa::get_riwayat_pendidikan_mahasiswa)
                        .put_named("feeder.master.riwayat_pendidikan_mahasiswa.update_riwayat_pendidikan_mahasiswa", riwayat_pendidikan_mahasiswa::update_riwayat_pendidikan_mahasiswa)
                        .delete_named("feeder.master.riwayat_pendidikan_mahasiswa.delete_riwayat_pendidikan_mahasiswa", riwayat_pendidikan_mahasiswa::delete_riwayat_pendidikan_mahasiswa),
                ),
        )
        .push(
            Router::with_path("riwayat-penelitian-dosen")
                .get_named("feeder.master.riwayat_penelitian_dosen.list_riwayat_penelitian_dosen", riwayat_penelitian_dosen::list_riwayat_penelitian_dosen)
                .post_named("feeder.master.riwayat_penelitian_dosen.create_riwayat_penelitian_dosen", riwayat_penelitian_dosen::create_riwayat_penelitian_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_penelitian_dosen.get_riwayat_penelitian_dosen", riwayat_penelitian_dosen::get_riwayat_penelitian_dosen)
                        .put_named("feeder.master.riwayat_penelitian_dosen.update_riwayat_penelitian_dosen", riwayat_penelitian_dosen::update_riwayat_penelitian_dosen)
                        .delete_named("feeder.master.riwayat_penelitian_dosen.delete_riwayat_penelitian_dosen", riwayat_penelitian_dosen::delete_riwayat_penelitian_dosen),
                ),
        )
        .push(
            Router::with_path("riwayat-sertifikasi-dosen")
                .get_named("feeder.master.riwayat_sertifikasi_dosen.list_riwayat_sertifikasi_dosen", riwayat_sertifikasi_dosen::list_riwayat_sertifikasi_dosen)
                .post_named("feeder.master.riwayat_sertifikasi_dosen.create_riwayat_sertifikasi_dosen", riwayat_sertifikasi_dosen::create_riwayat_sertifikasi_dosen)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.riwayat_sertifikasi_dosen.get_riwayat_sertifikasi_dosen", riwayat_sertifikasi_dosen::get_riwayat_sertifikasi_dosen)
                        .put_named("feeder.master.riwayat_sertifikasi_dosen.update_riwayat_sertifikasi_dosen", riwayat_sertifikasi_dosen::update_riwayat_sertifikasi_dosen)
                        .delete_named("feeder.master.riwayat_sertifikasi_dosen.delete_riwayat_sertifikasi_dosen", riwayat_sertifikasi_dosen::delete_riwayat_sertifikasi_dosen),
                ),
        )
        .push(
            Router::with_path("skala-nilai-program-studi")
                .get_named("feeder.master.skala_nilai_program_studi.list_skala_nilai_program_studi", skala_nilai_program_studi::list_skala_nilai_program_studi)
                .post_named("feeder.master.skala_nilai_program_studi.create_skala_nilai_program_studi", skala_nilai_program_studi::create_skala_nilai_program_studi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.skala_nilai_program_studi.get_skala_nilai_program_studi", skala_nilai_program_studi::get_skala_nilai_program_studi)
                        .put_named("feeder.master.skala_nilai_program_studi.update_skala_nilai_program_studi", skala_nilai_program_studi::update_skala_nilai_program_studi)
                        .delete_named("feeder.master.skala_nilai_program_studi.delete_skala_nilai_program_studi", skala_nilai_program_studi::delete_skala_nilai_program_studi),
                ),
        )
        .push(
            Router::with_path("substansi-matakuliah")
                .get_named("feeder.master.substansi_matakuliah.list_substansi_matakuliah", substansi_matakuliah::list_substansi_matakuliah)
                .post_named("feeder.master.substansi_matakuliah.create_substansi_matakuliah", substansi_matakuliah::create_substansi_matakuliah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.substansi_matakuliah.get_substansi_matakuliah", substansi_matakuliah::get_substansi_matakuliah)
                        .put_named("feeder.master.substansi_matakuliah.update_substansi_matakuliah", substansi_matakuliah::update_substansi_matakuliah)
                        .delete_named("feeder.master.substansi_matakuliah.delete_substansi_matakuliah", substansi_matakuliah::delete_substansi_matakuliah),
                ),
        )
        .push(
            Router::with_path("transkrip-mahasiswa")
                .get_named("feeder.master.transkrip_mahasiswa.list_transkrip_mahasiswa", transkrip_mahasiswa::list_transkrip_mahasiswa)
                .post_named("feeder.master.transkrip_mahasiswa.create_transkrip_mahasiswa", transkrip_mahasiswa::create_transkrip_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.transkrip_mahasiswa.get_transkrip_mahasiswa", transkrip_mahasiswa::get_transkrip_mahasiswa)
                        .put_named("feeder.master.transkrip_mahasiswa.update_transkrip_mahasiswa", transkrip_mahasiswa::update_transkrip_mahasiswa)
                        .delete_named("feeder.master.transkrip_mahasiswa.delete_transkrip_mahasiswa", transkrip_mahasiswa::delete_transkrip_mahasiswa),
                ),
        )
        .push(
            Router::with_path("uji-mahasiswa")
                .get_named("feeder.master.uji_mahasiswa.list_uji_mahasiswa", uji_mahasiswa::list_uji_mahasiswa)
                .post_named("feeder.master.uji_mahasiswa.create_uji_mahasiswa", uji_mahasiswa::create_uji_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.master.uji_mahasiswa.get_uji_mahasiswa", uji_mahasiswa::get_uji_mahasiswa)
                        .put_named("feeder.master.uji_mahasiswa.update_uji_mahasiswa", uji_mahasiswa::update_uji_mahasiswa)
                        .delete_named("feeder.master.uji_mahasiswa.delete_uji_mahasiswa", uji_mahasiswa::delete_uji_mahasiswa),
                ),
        )
}
