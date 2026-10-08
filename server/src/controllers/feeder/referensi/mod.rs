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
                .get_named("feeder.referensi.agama.index", agama::index)
                .post_named("feeder.referensi.agama.store", agama::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.agama.show", agama::show)
                        .put_named("feeder.referensi.agama.update", agama::update)
                        .delete_named("feeder.referensi.agama.delete", agama::delete),
                ),
        )
        .push(
            Router::with_path("alat-transportasi")
                .get_named("feeder.referensi.alat_transportasi.index", alat_transportasi::index)
                .post_named("feeder.referensi.alat_transportasi.store", alat_transportasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.alat_transportasi.show", alat_transportasi::show)
                        .put_named("feeder.referensi.alat_transportasi.update", alat_transportasi::update)
                        .delete_named("feeder.referensi.alat_transportasi.delete", alat_transportasi::delete),
                ),
        )
        .push(
            Router::with_path("bentuk-pendidikan")
                .get_named("feeder.referensi.bentuk_pendidikan.index", bentuk_pendidikan::index)
                .post_named("feeder.referensi.bentuk_pendidikan.store", bentuk_pendidikan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.bentuk_pendidikan.show", bentuk_pendidikan::show)
                        .put_named("feeder.referensi.bentuk_pendidikan.update", bentuk_pendidikan::update)
                        .delete_named("feeder.referensi.bentuk_pendidikan.delete", bentuk_pendidikan::delete),
                ),
        )
        .push(
            Router::with_path("ikatan-kerja-sumber-daya-manusia")
                .get_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.index", ikatan_kerja_sumber_daya_manusia::index)
                .post_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.store", ikatan_kerja_sumber_daya_manusia::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.show", ikatan_kerja_sumber_daya_manusia::show)
                        .put_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.update", ikatan_kerja_sumber_daya_manusia::update)
                        .delete_named("feeder.referensi.ikatan_kerja_sumber_daya_manusia.delete", ikatan_kerja_sumber_daya_manusia::delete),
                ),
        )
        .push(
            Router::with_path("jabatan-fungsional")
                .get_named("feeder.referensi.jabatan_fungsional.index", jabatan_fungsional::index)
                .post_named("feeder.referensi.jabatan_fungsional.store", jabatan_fungsional::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jabatan_fungsional.show", jabatan_fungsional::show)
                        .put_named("feeder.referensi.jabatan_fungsional.update", jabatan_fungsional::update)
                        .delete_named("feeder.referensi.jabatan_fungsional.delete", jabatan_fungsional::delete),
                ),
        )
        .push(
            Router::with_path("jalur-masuk")
                .get_named("feeder.referensi.jalur_masuk.index", jalur_masuk::index)
                .post_named("feeder.referensi.jalur_masuk.store", jalur_masuk::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jalur_masuk.show", jalur_masuk::show)
                        .put_named("feeder.referensi.jalur_masuk.update", jalur_masuk::update)
                        .delete_named("feeder.referensi.jalur_masuk.delete", jalur_masuk::delete),
                ),
        )
        .push(
            Router::with_path("jenis-aktifitas-mahasiswa")
                .get_named("feeder.referensi.jenis_aktifitas_mahasiswa.index", jenis_aktifitas_mahasiswa::index)
                .post_named("feeder.referensi.jenis_aktifitas_mahasiswa.store", jenis_aktifitas_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_aktifitas_mahasiswa.show", jenis_aktifitas_mahasiswa::show)
                        .put_named("feeder.referensi.jenis_aktifitas_mahasiswa.update", jenis_aktifitas_mahasiswa::update)
                        .delete_named("feeder.referensi.jenis_aktifitas_mahasiswa.delete", jenis_aktifitas_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("jenis-evaluasi")
                .get_named("feeder.referensi.jenis_evaluasi.index", jenis_evaluasi::index)
                .post_named("feeder.referensi.jenis_evaluasi.store", jenis_evaluasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_evaluasi.show", jenis_evaluasi::show)
                        .put_named("feeder.referensi.jenis_evaluasi.update", jenis_evaluasi::update)
                        .delete_named("feeder.referensi.jenis_evaluasi.delete", jenis_evaluasi::delete),
                ),
        )
        .push(
            Router::with_path("jenis-keluar")
                .get_named("feeder.referensi.jenis_keluar.index", jenis_keluar::index)
                .post_named("feeder.referensi.jenis_keluar.store", jenis_keluar::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_keluar.show", jenis_keluar::show)
                        .put_named("feeder.referensi.jenis_keluar.update", jenis_keluar::update)
                        .delete_named("feeder.referensi.jenis_keluar.delete", jenis_keluar::delete),
                ),
        )
        .push(
            Router::with_path("jenis-pendaftaran")
                .get_named("feeder.referensi.jenis_pendaftaran.index", jenis_pendaftaran::index)
                .post_named("feeder.referensi.jenis_pendaftaran.store", jenis_pendaftaran::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_pendaftaran.show", jenis_pendaftaran::show)
                        .put_named("feeder.referensi.jenis_pendaftaran.update", jenis_pendaftaran::update)
                        .delete_named("feeder.referensi.jenis_pendaftaran.delete", jenis_pendaftaran::delete),
                ),
        )
        .push(
            Router::with_path("jenis-prestasi")
                .get_named("feeder.referensi.jenis_prestasi.index", jenis_prestasi::index)
                .post_named("feeder.referensi.jenis_prestasi.store", jenis_prestasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_prestasi.show", jenis_prestasi::show)
                        .put_named("feeder.referensi.jenis_prestasi.update", jenis_prestasi::update)
                        .delete_named("feeder.referensi.jenis_prestasi.delete", jenis_prestasi::delete),
                ),
        )
        .push(
            Router::with_path("jenis-satuan-manajemen-sumberdaya")
                .get_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.index", jenis_satuan_manajemen_sumberdaya::index)
                .post_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.store", jenis_satuan_manajemen_sumberdaya::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.show", jenis_satuan_manajemen_sumberdaya::show)
                        .put_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.update", jenis_satuan_manajemen_sumberdaya::update)
                        .delete_named("feeder.referensi.jenis_satuan_manajemen_sumberdaya.delete", jenis_satuan_manajemen_sumberdaya::delete),
                ),
        )
        .push(
            Router::with_path("jenis-sertifikasi")
                .get_named("feeder.referensi.jenis_sertifikasi.index", jenis_sertifikasi::index)
                .post_named("feeder.referensi.jenis_sertifikasi.store", jenis_sertifikasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_sertifikasi.show", jenis_sertifikasi::show)
                        .put_named("feeder.referensi.jenis_sertifikasi.update", jenis_sertifikasi::update)
                        .delete_named("feeder.referensi.jenis_sertifikasi.delete", jenis_sertifikasi::delete),
                ),
        )
        .push(
            Router::with_path("jenis-substansi")
                .get_named("feeder.referensi.jenis_substansi.index", jenis_substansi::index)
                .post_named("feeder.referensi.jenis_substansi.store", jenis_substansi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_substansi.show", jenis_substansi::show)
                        .put_named("feeder.referensi.jenis_substansi.update", jenis_substansi::update)
                        .delete_named("feeder.referensi.jenis_substansi.delete", jenis_substansi::delete),
                ),
        )
        .push(
            Router::with_path("jenis-tinggal")
                .get_named("feeder.referensi.jenis_tinggal.index", jenis_tinggal::index)
                .post_named("feeder.referensi.jenis_tinggal.store", jenis_tinggal::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenis_tinggal.show", jenis_tinggal::show)
                        .put_named("feeder.referensi.jenis_tinggal.update", jenis_tinggal::update)
                        .delete_named("feeder.referensi.jenis_tinggal.delete", jenis_tinggal::delete),
                ),
        )
        .push(
            Router::with_path("jenjang-pendidikan")
                .get_named("feeder.referensi.jenjang_pendidikan.index", jenjang_pendidikan::index)
                .post_named("feeder.referensi.jenjang_pendidikan.store", jenjang_pendidikan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.jenjang_pendidikan.show", jenjang_pendidikan::show)
                        .put_named("feeder.referensi.jenjang_pendidikan.update", jenjang_pendidikan::update)
                        .delete_named("feeder.referensi.jenjang_pendidikan.delete", jenjang_pendidikan::delete),
                ),
        )
        .push(
            Router::with_path("kategori-kegiatan")
                .get_named("feeder.referensi.kategori_kegiatan.index", kategori_kegiatan::index)
                .post_named("feeder.referensi.kategori_kegiatan.store", kategori_kegiatan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.kategori_kegiatan.show", kategori_kegiatan::show)
                        .put_named("feeder.referensi.kategori_kegiatan.update", kategori_kegiatan::update)
                        .delete_named("feeder.referensi.kategori_kegiatan.delete", kategori_kegiatan::delete),
                ),
        )
        .push(
            Router::with_path("kebutuhan-khusus")
                .get_named("feeder.referensi.kebutuhan_khusus.index", kebutuhan_khusus::index)
                .post_named("feeder.referensi.kebutuhan_khusus.store", kebutuhan_khusus::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.kebutuhan_khusus.show", kebutuhan_khusus::show)
                        .put_named("feeder.referensi.kebutuhan_khusus.update", kebutuhan_khusus::update)
                        .delete_named("feeder.referensi.kebutuhan_khusus.delete", kebutuhan_khusus::delete),
                ),
        )
        .push(
            Router::with_path("lembaga-pengangkat")
                .get_named("feeder.referensi.lembaga_pengangkat.index", lembaga_pengangkat::index)
                .post_named("feeder.referensi.lembaga_pengangkat.store", lembaga_pengangkat::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.lembaga_pengangkat.show", lembaga_pengangkat::show)
                        .put_named("feeder.referensi.lembaga_pengangkat.update", lembaga_pengangkat::update)
                        .delete_named("feeder.referensi.lembaga_pengangkat.delete", lembaga_pengangkat::delete),
                ),
        )
        .push(
            Router::with_path("level-wilayah")
                .get_named("feeder.referensi.level_wilayah.index", level_wilayah::index)
                .post_named("feeder.referensi.level_wilayah.store", level_wilayah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.level_wilayah.show", level_wilayah::show)
                        .put_named("feeder.referensi.level_wilayah.update", level_wilayah::update)
                        .delete_named("feeder.referensi.level_wilayah.delete", level_wilayah::delete),
                ),
        )
        .push(
            Router::with_path("negara")
                .get_named("feeder.referensi.negara.index", negara::index)
                .post_named("feeder.referensi.negara.store", negara::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.negara.show", negara::show)
                        .put_named("feeder.referensi.negara.update", negara::update)
                        .delete_named("feeder.referensi.negara.delete", negara::delete),
                ),
        )
        .push(
            Router::with_path("pangkat-golongan")
                .get_named("feeder.referensi.pangkat_golongan.index", pangkat_golongan::index)
                .post_named("feeder.referensi.pangkat_golongan.store", pangkat_golongan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.pangkat_golongan.show", pangkat_golongan::show)
                        .put_named("feeder.referensi.pangkat_golongan.update", pangkat_golongan::update)
                        .delete_named("feeder.referensi.pangkat_golongan.delete", pangkat_golongan::delete),
                ),
        )
        .push(
            Router::with_path("pekerjaan")
                .get_named("feeder.referensi.pekerjaan.index", pekerjaan::index)
                .post_named("feeder.referensi.pekerjaan.store", pekerjaan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.pekerjaan.show", pekerjaan::show)
                        .put_named("feeder.referensi.pekerjaan.update", pekerjaan::update)
                        .delete_named("feeder.referensi.pekerjaan.delete", pekerjaan::delete),
                ),
        )
        .push(
            Router::with_path("pembiayaan")
                .get_named("feeder.referensi.pembiayaan.index", pembiayaan::index)
                .post_named("feeder.referensi.pembiayaan.store", pembiayaan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.pembiayaan.show", pembiayaan::show)
                        .put_named("feeder.referensi.pembiayaan.update", pembiayaan::update)
                        .delete_named("feeder.referensi.pembiayaan.delete", pembiayaan::delete),
                ),
        )
        .push(
            Router::with_path("penghasilan")
                .get_named("feeder.referensi.penghasilan.index", penghasilan::index)
                .post_named("feeder.referensi.penghasilan.store", penghasilan::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.penghasilan.show", penghasilan::show)
                        .put_named("feeder.referensi.penghasilan.update", penghasilan::update)
                        .delete_named("feeder.referensi.penghasilan.delete", penghasilan::delete),
                ),
        )
        .push(
            Router::with_path("periode-lampau")
                .get_named("feeder.referensi.periode_lampau.index", periode_lampau::index)
                .post_named("feeder.referensi.periode_lampau.store", periode_lampau::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.periode_lampau.show", periode_lampau::show)
                        .put_named("feeder.referensi.periode_lampau.update", periode_lampau::update)
                        .delete_named("feeder.referensi.periode_lampau.delete", periode_lampau::delete),
                ),
        )
        .push(
            Router::with_path("semester")
                .get_named("feeder.referensi.semester.index", semester::index)
                .post_named("feeder.referensi.semester.store", semester::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.semester.show", semester::show)
                        .put_named("feeder.referensi.semester.update", semester::update)
                        .delete_named("feeder.referensi.semester.delete", semester::delete),
                ),
        )
        .push(
            Router::with_path("status-keaktifan-pegawai")
                .get_named("feeder.referensi.status_keaktifan_pegawai.index", status_keaktifan_pegawai::index)
                .post_named("feeder.referensi.status_keaktifan_pegawai.store", status_keaktifan_pegawai::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.status_keaktifan_pegawai.show", status_keaktifan_pegawai::show)
                        .put_named("feeder.referensi.status_keaktifan_pegawai.update", status_keaktifan_pegawai::update)
                        .delete_named("feeder.referensi.status_keaktifan_pegawai.delete", status_keaktifan_pegawai::delete),
                ),
        )
        .push(
            Router::with_path("status-kepegawaian")
                .get_named("feeder.referensi.status_kepegawaian.index", status_kepegawaian::index)
                .post_named("feeder.referensi.status_kepegawaian.store", status_kepegawaian::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.status_kepegawaian.show", status_kepegawaian::show)
                        .put_named("feeder.referensi.status_kepegawaian.update", status_kepegawaian::update)
                        .delete_named("feeder.referensi.status_kepegawaian.delete", status_kepegawaian::delete),
                ),
        )
        .push(
            Router::with_path("status-mahasiswa")
                .get_named("feeder.referensi.status_mahasiswa.index", status_mahasiswa::index)
                .post_named("feeder.referensi.status_mahasiswa.store", status_mahasiswa::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.status_mahasiswa.show", status_mahasiswa::show)
                        .put_named("feeder.referensi.status_mahasiswa.update", status_mahasiswa::update)
                        .delete_named("feeder.referensi.status_mahasiswa.delete", status_mahasiswa::delete),
                ),
        )
        .push(
            Router::with_path("tahun-ajaran")
                .get_named("feeder.referensi.tahun_ajaran.index", tahun_ajaran::index)
                .post_named("feeder.referensi.tahun_ajaran.store", tahun_ajaran::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.tahun_ajaran.show", tahun_ajaran::show)
                        .put_named("feeder.referensi.tahun_ajaran.update", tahun_ajaran::update)
                        .delete_named("feeder.referensi.tahun_ajaran.delete", tahun_ajaran::delete),
                ),
        )
        .push(
            Router::with_path("tingkat-prestasi")
                .get_named("feeder.referensi.tingkat_prestasi.index", tingkat_prestasi::index)
                .post_named("feeder.referensi.tingkat_prestasi.store", tingkat_prestasi::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.tingkat_prestasi.show", tingkat_prestasi::show)
                        .put_named("feeder.referensi.tingkat_prestasi.update", tingkat_prestasi::update)
                        .delete_named("feeder.referensi.tingkat_prestasi.delete", tingkat_prestasi::delete),
                ),
        )
        .push(
            Router::with_path("wilayah")
                .get_named("feeder.referensi.wilayah.index", wilayah::index)
                .post_named("feeder.referensi.wilayah.store", wilayah::store)
                .push(
                    Router::with_path("{id}")
                        .get_named("feeder.referensi.wilayah.show", wilayah::show)
                        .put_named("feeder.referensi.wilayah.update", wilayah::update)
                        .delete_named("feeder.referensi.wilayah.delete", wilayah::delete),
                ),
        )
}
