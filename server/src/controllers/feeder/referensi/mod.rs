use salvo::prelude::*;
use crate::middleware::rbac::NamedRouterExt;

pub mod agama;
pub mod alat_transportasi;
pub mod bentuk_pendidikan;
pub mod ikatan_kerja_sumber_daya_manusia;
pub mod jabatan_fungsional;
pub mod jalur_masuk;
pub mod jenis_aktifitas_mahasiswa;
pub mod jenis_evaluasi;
pub mod jenis_keluar;
pub mod jenis_pendaftaran;
pub mod jenis_prestasi;
pub mod jenis_satuan_manajemen_sumberdaya;
pub mod jenis_sertifikasi;
pub mod jenis_substansi;
pub mod jenis_tinggal;
pub mod jenjang_pendidikan;
pub mod kategori_kegiatan;
pub mod kebutuhan_khusus;
pub mod lembaga_pengangkat;
pub mod level_wilayah;
pub mod negara;
pub mod pangkat_golongan;
pub mod pekerjaan;
pub mod pembiayaan;
pub mod penghasilan;
pub mod periode_lampau;
pub mod semester;
pub mod status_keaktifan_pegawai;
pub mod status_kepegawaian;
pub mod status_mahasiswa;
pub mod tahun_ajaran;
pub mod tingkat_prestasi;
pub mod wilayah;

pub fn router() -> Router {
    Router::with_path("referensi")
        .push(
            Router::with_path("agama")
                .get_named("feeder.referensi.agama.list_agama", agama::list_agama)
                .post_named("feeder.referensi.agama.create_agama", agama::create_agama)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.agama.get_agama", agama::get_agama)
                        .put_named("feeder.referensi.agama.update_agama", agama::update_agama)
                        .delete_named("feeder.referensi.agama.delete_agama", agama::delete_agama),
                ),
        )
        .push(
            Router::with_path("alat-transportasi")
                .get_named("feeder.referensi.alat_transportasi.list_alat_transportasi", alat_transportasi::list_alat_transportasi)
                .post_named("feeder.referensi.alat_transportasi.create_alat_transportasi", alat_transportasi::create_alat_transportasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.alat_transportasi.get_alat_transportasi", alat_transportasi::get_alat_transportasi)
                        .put_named("feeder.referensi.alat_transportasi.update_alat_transportasi", alat_transportasi::update_alat_transportasi)
                        .delete_named("feeder.referensi.alat_transportasi.delete_alat_transportasi", alat_transportasi::delete_alat_transportasi),
                ),
        )
        .push(
            Router::with_path("bentuk-pendidikan")
                .get_named("feeder.referensi.bentuk_pendidikan.list_bentuk_pendidikan", bentuk_pendidikan::list_bentuk_pendidikan)
                .post_named("feeder.referensi.bentuk_pendidikan.create_bentuk_pendidikan", bentuk_pendidikan::create_bentuk_pendidikan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.bentuk_pendidikan.get_bentuk_pendidikan", bentuk_pendidikan::get_bentuk_pendidikan)
                        .put_named("feeder.referensi.bentuk_pendidikan.update_bentuk_pendidikan", bentuk_pendidikan::update_bentuk_pendidikan)
                        .delete_named("feeder.referensi.bentuk_pendidikan.delete_bentuk_pendidikan", bentuk_pendidikan::delete_bentuk_pendidikan),
                ),
        )
        .push(
            Router::with_path("ikatan-kerja-sumber-daya-manusia")
                .get_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.list_ikatan_kerja_sumber_daya_manusia", ikatan_kerja_sumber_daya_manusia::list_ikatan_kerja_sumber_daya_manusia)
                .post_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.create_ikatan_kerja_sumber_daya_manusia", ikatan_kerja_sumber_daya_manusia::create_ikatan_kerja_sumber_daya_manusia)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.get_ikatan_kerja_sumber_daya_manusia", ikatan_kerja_sumber_daya_manusia::get_ikatan_kerja_sumber_daya_manusia)
                        .put_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.update_ikatan_kerja_sumber_daya_manusia", ikatan_kerja_sumber_daya_manusia::update_ikatan_kerja_sumber_daya_manusia)
                        .delete_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.delete_ikatan_kerja_sumber_daya_manusia", ikatan_kerja_sumber_daya_manusia::delete_ikatan_kerja_sumber_daya_manusia),
                ),
        )
        .push(
            Router::with_path("jabatan-fungsional")
                .get_named("feeder.referensi.jabatan_fungsional.list_jabatan_fungsional", jabatan_fungsional::list_jabatan_fungsional)
                .post_named("feeder.referensi.jabatan_fungsional.create_jabatan_fungsional", jabatan_fungsional::create_jabatan_fungsional)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jabatan_fungsional.get_jabatan_fungsional", jabatan_fungsional::get_jabatan_fungsional)
                        .put_named("feeder.referensi.jabatan_fungsional.update_jabatan_fungsional", jabatan_fungsional::update_jabatan_fungsional)
                        .delete_named("feeder.referensi.jabatan_fungsional.delete_jabatan_fungsional", jabatan_fungsional::delete_jabatan_fungsional),
                ),
        )
        .push(
            Router::with_path("jalur-masuk")
                .get_named("feeder.referensi.jalur_masuk.list_jalur_masuk", jalur_masuk::list_jalur_masuk)
                .post_named("feeder.referensi.jalur_masuk.create_jalur_masuk", jalur_masuk::create_jalur_masuk)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jalur_masuk.get_jalur_masuk", jalur_masuk::get_jalur_masuk)
                        .put_named("feeder.referensi.jalur_masuk.update_jalur_masuk", jalur_masuk::update_jalur_masuk)
                        .delete_named("feeder.referensi.jalur_masuk.delete_jalur_masuk", jalur_masuk::delete_jalur_masuk),
                ),
        )
        .push(
            Router::with_path("jenis-aktifitas-mahasiswa")
                .get_named("feeder.referensi.jenis_aktifitas_mahasiswa.list_jenis_aktifitas_mahasiswa", jenis_aktifitas_mahasiswa::list_jenis_aktifitas_mahasiswa)
                .post_named("feeder.referensi.jenis_aktifitas_mahasiswa.create_jenis_aktifitas_mahasiswa", jenis_aktifitas_mahasiswa::create_jenis_aktifitas_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_aktifitas_mahasiswa.get_jenis_aktifitas_mahasiswa", jenis_aktifitas_mahasiswa::get_jenis_aktifitas_mahasiswa)
                        .put_named("feeder.referensi.jenis_aktifitas_mahasiswa.update_jenis_aktifitas_mahasiswa", jenis_aktifitas_mahasiswa::update_jenis_aktifitas_mahasiswa)
                        .delete_named("feeder.referensi.jenis_aktifitas_mahasiswa.delete_jenis_aktifitas_mahasiswa", jenis_aktifitas_mahasiswa::delete_jenis_aktifitas_mahasiswa),
                ),
        )
        .push(
            Router::with_path("jenis-evaluasi")
                .get_named("feeder.referensi.jenis_evaluasi.list_jenis_evaluasi", jenis_evaluasi::list_jenis_evaluasi)
                .post_named("feeder.referensi.jenis_evaluasi.create_jenis_evaluasi", jenis_evaluasi::create_jenis_evaluasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_evaluasi.get_jenis_evaluasi", jenis_evaluasi::get_jenis_evaluasi)
                        .put_named("feeder.referensi.jenis_evaluasi.update_jenis_evaluasi", jenis_evaluasi::update_jenis_evaluasi)
                        .delete_named("feeder.referensi.jenis_evaluasi.delete_jenis_evaluasi", jenis_evaluasi::delete_jenis_evaluasi),
                ),
        )
        .push(
            Router::with_path("jenis-keluar")
                .get_named("feeder.referensi.jenis_keluar.list_jenis_keluar", jenis_keluar::list_jenis_keluar)
                .post_named("feeder.referensi.jenis_keluar.create_jenis_keluar", jenis_keluar::create_jenis_keluar)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_keluar.get_jenis_keluar", jenis_keluar::get_jenis_keluar)
                        .put_named("feeder.referensi.jenis_keluar.update_jenis_keluar", jenis_keluar::update_jenis_keluar)
                        .delete_named("feeder.referensi.jenis_keluar.delete_jenis_keluar", jenis_keluar::delete_jenis_keluar),
                ),
        )
        .push(
            Router::with_path("jenis-pendaftaran")
                .get_named("feeder.referensi.jenis_pendaftaran.list_jenis_pendaftaran", jenis_pendaftaran::list_jenis_pendaftaran)
                .post_named("feeder.referensi.jenis_pendaftaran.create_jenis_pendaftaran", jenis_pendaftaran::create_jenis_pendaftaran)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_pendaftaran.get_jenis_pendaftaran", jenis_pendaftaran::get_jenis_pendaftaran)
                        .put_named("feeder.referensi.jenis_pendaftaran.update_jenis_pendaftaran", jenis_pendaftaran::update_jenis_pendaftaran)
                        .delete_named("feeder.referensi.jenis_pendaftaran.delete_jenis_pendaftaran", jenis_pendaftaran::delete_jenis_pendaftaran),
                ),
        )
        .push(
            Router::with_path("jenis-prestasi")
                .get_named("feeder.referensi.jenis_prestasi.list_jenis_prestasi", jenis_prestasi::list_jenis_prestasi)
                .post_named("feeder.referensi.jenis_prestasi.create_jenis_prestasi", jenis_prestasi::create_jenis_prestasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_prestasi.get_jenis_prestasi", jenis_prestasi::get_jenis_prestasi)
                        .put_named("feeder.referensi.jenis_prestasi.update_jenis_prestasi", jenis_prestasi::update_jenis_prestasi)
                        .delete_named("feeder.referensi.jenis_prestasi.delete_jenis_prestasi", jenis_prestasi::delete_jenis_prestasi),
                ),
        )
        .push(
            Router::with_path("jenis-satuan-manajemen-sumberdaya")
                .get_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.list_jenis_satuan_manajemen_sumberdaya", jenis_satuan_manajemen_sumberdaya::list_jenis_satuan_manajemen_sumberdaya)
                .post_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.create_jenis_satuan_manajemen_sumberdaya", jenis_satuan_manajemen_sumberdaya::create_jenis_satuan_manajemen_sumberdaya)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.get_jenis_satuan_manajemen_sumberdaya", jenis_satuan_manajemen_sumberdaya::get_jenis_satuan_manajemen_sumberdaya)
                        .put_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.update_jenis_satuan_manajemen_sumberdaya", jenis_satuan_manajemen_sumberdaya::update_jenis_satuan_manajemen_sumberdaya)
                        .delete_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.delete_jenis_satuan_manajemen_sumberdaya", jenis_satuan_manajemen_sumberdaya::delete_jenis_satuan_manajemen_sumberdaya),
                ),
        )
        .push(
            Router::with_path("jenis-sertifikasi")
                .get_named("feeder.referensi.jenis_sertifikasi.list_jenis_sertifikasi", jenis_sertifikasi::list_jenis_sertifikasi)
                .post_named("feeder.referensi.jenis_sertifikasi.create_jenis_sertifikasi", jenis_sertifikasi::create_jenis_sertifikasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_sertifikasi.get_jenis_sertifikasi", jenis_sertifikasi::get_jenis_sertifikasi)
                        .put_named("feeder.referensi.jenis_sertifikasi.update_jenis_sertifikasi", jenis_sertifikasi::update_jenis_sertifikasi)
                        .delete_named("feeder.referensi.jenis_sertifikasi.delete_jenis_sertifikasi", jenis_sertifikasi::delete_jenis_sertifikasi),
                ),
        )
        .push(
            Router::with_path("jenis-substansi")
                .get_named("feeder.referensi.jenis_substansi.list_jenis_substansi", jenis_substansi::list_jenis_substansi)
                .post_named("feeder.referensi.jenis_substansi.create_jenis_substansi", jenis_substansi::create_jenis_substansi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_substansi.get_jenis_substansi", jenis_substansi::get_jenis_substansi)
                        .put_named("feeder.referensi.jenis_substansi.update_jenis_substansi", jenis_substansi::update_jenis_substansi)
                        .delete_named("feeder.referensi.jenis_substansi.delete_jenis_substansi", jenis_substansi::delete_jenis_substansi),
                ),
        )
        .push(
            Router::with_path("jenis-tinggal")
                .get_named("feeder.referensi.jenis_tinggal.list_jenis_tinggal", jenis_tinggal::list_jenis_tinggal)
                .post_named("feeder.referensi.jenis_tinggal.create_jenis_tinggal", jenis_tinggal::create_jenis_tinggal)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_tinggal.get_jenis_tinggal", jenis_tinggal::get_jenis_tinggal)
                        .put_named("feeder.referensi.jenis_tinggal.update_jenis_tinggal", jenis_tinggal::update_jenis_tinggal)
                        .delete_named("feeder.referensi.jenis_tinggal.delete_jenis_tinggal", jenis_tinggal::delete_jenis_tinggal),
                ),
        )
        .push(
            Router::with_path("jenjang-pendidikan")
                .get_named("feeder.referensi.jenjang_pendidikan.list_jenjang_pendidikan", jenjang_pendidikan::list_jenjang_pendidikan)
                .post_named("feeder.referensi.jenjang_pendidikan.create_jenjang_pendidikan", jenjang_pendidikan::create_jenjang_pendidikan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenjang_pendidikan.get_jenjang_pendidikan", jenjang_pendidikan::get_jenjang_pendidikan)
                        .put_named("feeder.referensi.jenjang_pendidikan.update_jenjang_pendidikan", jenjang_pendidikan::update_jenjang_pendidikan)
                        .delete_named("feeder.referensi.jenjang_pendidikan.delete_jenjang_pendidikan", jenjang_pendidikan::delete_jenjang_pendidikan),
                ),
        )
        .push(
            Router::with_path("kategori-kegiatan")
                .get_named("feeder.referensi.kategori_kegiatan.list_kategori_kegiatan", kategori_kegiatan::list_kategori_kegiatan)
                .post_named("feeder.referensi.kategori_kegiatan.create_kategori_kegiatan", kategori_kegiatan::create_kategori_kegiatan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.kategori_kegiatan.get_kategori_kegiatan", kategori_kegiatan::get_kategori_kegiatan)
                        .put_named("feeder.referensi.kategori_kegiatan.update_kategori_kegiatan", kategori_kegiatan::update_kategori_kegiatan)
                        .delete_named("feeder.referensi.kategori_kegiatan.delete_kategori_kegiatan", kategori_kegiatan::delete_kategori_kegiatan),
                ),
        )
        .push(
            Router::with_path("kebutuhan-khusus")
                .get_named("feeder.referensi.kebutuhan_khusus.list_kebutuhan_khusus", kebutuhan_khusus::list_kebutuhan_khusus)
                .post_named("feeder.referensi.kebutuhan_khusus.create_kebutuhan_khusu", kebutuhan_khusus::create_kebutuhan_khusu)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.kebutuhan_khusus.get_kebutuhan_khusu", kebutuhan_khusus::get_kebutuhan_khusu)
                        .put_named("feeder.referensi.kebutuhan_khusus.update_kebutuhan_khusu", kebutuhan_khusus::update_kebutuhan_khusu)
                        .delete_named("feeder.referensi.kebutuhan_khusus.delete_kebutuhan_khusu", kebutuhan_khusus::delete_kebutuhan_khusu),
                ),
        )
        .push(
            Router::with_path("lembaga-pengangkat")
                .get_named("feeder.referensi.lembaga_pengangkat.list_lembaga_pengangkat", lembaga_pengangkat::list_lembaga_pengangkat)
                .post_named("feeder.referensi.lembaga_pengangkat.create_lembaga_pengangkat", lembaga_pengangkat::create_lembaga_pengangkat)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.lembaga_pengangkat.get_lembaga_pengangkat", lembaga_pengangkat::get_lembaga_pengangkat)
                        .put_named("feeder.referensi.lembaga_pengangkat.update_lembaga_pengangkat", lembaga_pengangkat::update_lembaga_pengangkat)
                        .delete_named("feeder.referensi.lembaga_pengangkat.delete_lembaga_pengangkat", lembaga_pengangkat::delete_lembaga_pengangkat),
                ),
        )
        .push(
            Router::with_path("level-wilayah")
                .get_named("feeder.referensi.level_wilayah.list_level_wilayah", level_wilayah::list_level_wilayah)
                .post_named("feeder.referensi.level_wilayah.create_level_wilayah", level_wilayah::create_level_wilayah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.level_wilayah.get_level_wilayah", level_wilayah::get_level_wilayah)
                        .put_named("feeder.referensi.level_wilayah.update_level_wilayah", level_wilayah::update_level_wilayah)
                        .delete_named("feeder.referensi.level_wilayah.delete_level_wilayah", level_wilayah::delete_level_wilayah),
                ),
        )
        .push(
            Router::with_path("negara")
                .get_named("feeder.referensi.negara.list_negara", negara::list_negara)
                .post_named("feeder.referensi.negara.create_negara", negara::create_negara)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.negara.get_negara", negara::get_negara)
                        .put_named("feeder.referensi.negara.update_negara", negara::update_negara)
                        .delete_named("feeder.referensi.negara.delete_negara", negara::delete_negara),
                ),
        )
        .push(
            Router::with_path("pangkat-golongan")
                .get_named("feeder.referensi.pangkat_golongan.list_pangkat_golongan", pangkat_golongan::list_pangkat_golongan)
                .post_named("feeder.referensi.pangkat_golongan.create_pangkat_golongan", pangkat_golongan::create_pangkat_golongan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.pangkat_golongan.get_pangkat_golongan", pangkat_golongan::get_pangkat_golongan)
                        .put_named("feeder.referensi.pangkat_golongan.update_pangkat_golongan", pangkat_golongan::update_pangkat_golongan)
                        .delete_named("feeder.referensi.pangkat_golongan.delete_pangkat_golongan", pangkat_golongan::delete_pangkat_golongan),
                ),
        )
        .push(
            Router::with_path("pekerjaan")
                .get_named("feeder.referensi.pekerjaan.list_pekerjaan", pekerjaan::list_pekerjaan)
                .post_named("feeder.referensi.pekerjaan.create_pekerjaan", pekerjaan::create_pekerjaan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.pekerjaan.get_pekerjaan", pekerjaan::get_pekerjaan)
                        .put_named("feeder.referensi.pekerjaan.update_pekerjaan", pekerjaan::update_pekerjaan)
                        .delete_named("feeder.referensi.pekerjaan.delete_pekerjaan", pekerjaan::delete_pekerjaan),
                ),
        )
        .push(
            Router::with_path("pembiayaan")
                .get_named("feeder.referensi.pembiayaan.list_pembiayaan", pembiayaan::list_pembiayaan)
                .post_named("feeder.referensi.pembiayaan.create_pembiayaan", pembiayaan::create_pembiayaan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.pembiayaan.get_pembiayaan", pembiayaan::get_pembiayaan)
                        .put_named("feeder.referensi.pembiayaan.update_pembiayaan", pembiayaan::update_pembiayaan)
                        .delete_named("feeder.referensi.pembiayaan.delete_pembiayaan", pembiayaan::delete_pembiayaan),
                ),
        )
        .push(
            Router::with_path("penghasilan")
                .get_named("feeder.referensi.penghasilan.list_penghasilan", penghasilan::list_penghasilan)
                .post_named("feeder.referensi.penghasilan.create_penghasilan", penghasilan::create_penghasilan)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.penghasilan.get_penghasilan", penghasilan::get_penghasilan)
                        .put_named("feeder.referensi.penghasilan.update_penghasilan", penghasilan::update_penghasilan)
                        .delete_named("feeder.referensi.penghasilan.delete_penghasilan", penghasilan::delete_penghasilan),
                ),
        )
        .push(
            Router::with_path("periode-lampau")
                .get_named("feeder.referensi.periode_lampau.list_periode_lampau", periode_lampau::list_periode_lampau)
                .post_named("feeder.referensi.periode_lampau.create_periode_lampau", periode_lampau::create_periode_lampau)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.periode_lampau.get_periode_lampau", periode_lampau::get_periode_lampau)
                        .put_named("feeder.referensi.periode_lampau.update_periode_lampau", periode_lampau::update_periode_lampau)
                        .delete_named("feeder.referensi.periode_lampau.delete_periode_lampau", periode_lampau::delete_periode_lampau),
                ),
        )
        .push(
            Router::with_path("semester")
                .get_named("feeder.referensi.semester.list_semester", semester::list_semester)
                .post_named("feeder.referensi.semester.create_semester", semester::create_semester)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.semester.get_semester", semester::get_semester)
                        .put_named("feeder.referensi.semester.update_semester", semester::update_semester)
                        .delete_named("feeder.referensi.semester.delete_semester", semester::delete_semester),
                ),
        )
        .push(
            Router::with_path("status-keaktifan-pegawai")
                .get_named("feeder.referensi.status_keaktifan_pegawai.list_status_keaktifan_pegawai", status_keaktifan_pegawai::list_status_keaktifan_pegawai)
                .post_named("feeder.referensi.status_keaktifan_pegawai.create_status_keaktifan_pegawai", status_keaktifan_pegawai::create_status_keaktifan_pegawai)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.status_keaktifan_pegawai.get_status_keaktifan_pegawai", status_keaktifan_pegawai::get_status_keaktifan_pegawai)
                        .put_named("feeder.referensi.status_keaktifan_pegawai.update_status_keaktifan_pegawai", status_keaktifan_pegawai::update_status_keaktifan_pegawai)
                        .delete_named("feeder.referensi.status_keaktifan_pegawai.delete_status_keaktifan_pegawai", status_keaktifan_pegawai::delete_status_keaktifan_pegawai),
                ),
        )
        .push(
            Router::with_path("status-kepegawaian")
                .get_named("feeder.referensi.status_kepegawaian.list_status_kepegawaian", status_kepegawaian::list_status_kepegawaian)
                .post_named("feeder.referensi.status_kepegawaian.create_status_kepegawaian", status_kepegawaian::create_status_kepegawaian)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.status_kepegawaian.get_status_kepegawaian", status_kepegawaian::get_status_kepegawaian)
                        .put_named("feeder.referensi.status_kepegawaian.update_status_kepegawaian", status_kepegawaian::update_status_kepegawaian)
                        .delete_named("feeder.referensi.status_kepegawaian.delete_status_kepegawaian", status_kepegawaian::delete_status_kepegawaian),
                ),
        )
        .push(
            Router::with_path("status-mahasiswa")
                .get_named("feeder.referensi.status_mahasiswa.list_status_mahasiswa", status_mahasiswa::list_status_mahasiswa)
                .post_named("feeder.referensi.status_mahasiswa.create_status_mahasiswa", status_mahasiswa::create_status_mahasiswa)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.status_mahasiswa.get_status_mahasiswa", status_mahasiswa::get_status_mahasiswa)
                        .put_named("feeder.referensi.status_mahasiswa.update_status_mahasiswa", status_mahasiswa::update_status_mahasiswa)
                        .delete_named("feeder.referensi.status_mahasiswa.delete_status_mahasiswa", status_mahasiswa::delete_status_mahasiswa),
                ),
        )
        .push(
            Router::with_path("tahun-ajaran")
                .get_named("feeder.referensi.tahun_ajaran.list_tahun_ajaran", tahun_ajaran::list_tahun_ajaran)
                .post_named("feeder.referensi.tahun_ajaran.create_tahun_ajaran", tahun_ajaran::create_tahun_ajaran)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.tahun_ajaran.get_tahun_ajaran", tahun_ajaran::get_tahun_ajaran)
                        .put_named("feeder.referensi.tahun_ajaran.update_tahun_ajaran", tahun_ajaran::update_tahun_ajaran)
                        .delete_named("feeder.referensi.tahun_ajaran.delete_tahun_ajaran", tahun_ajaran::delete_tahun_ajaran),
                ),
        )
        .push(
            Router::with_path("tingkat-prestasi")
                .get_named("feeder.referensi.tingkat_prestasi.list_tingkat_prestasi", tingkat_prestasi::list_tingkat_prestasi)
                .post_named("feeder.referensi.tingkat_prestasi.create_tingkat_prestasi", tingkat_prestasi::create_tingkat_prestasi)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.tingkat_prestasi.get_tingkat_prestasi", tingkat_prestasi::get_tingkat_prestasi)
                        .put_named("feeder.referensi.tingkat_prestasi.update_tingkat_prestasi", tingkat_prestasi::update_tingkat_prestasi)
                        .delete_named("feeder.referensi.tingkat_prestasi.delete_tingkat_prestasi", tingkat_prestasi::delete_tingkat_prestasi),
                ),
        )
        .push(
            Router::with_path("wilayah")
                .get_named("feeder.referensi.wilayah.list_wilayah", wilayah::list_wilayah)
                .post_named("feeder.referensi.wilayah.create_wilayah", wilayah::create_wilayah)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.wilayah.get_wilayah", wilayah::get_wilayah)
                        .put_named("feeder.referensi.wilayah.update_wilayah", wilayah::update_wilayah)
                        .delete_named("feeder.referensi.wilayah.delete_wilayah", wilayah::delete_wilayah),
                ),
        )
}
