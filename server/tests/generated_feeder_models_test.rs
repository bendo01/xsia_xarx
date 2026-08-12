use sea_orm::*;
use xsia_xarx::db::connect_db;
use xsia_xarx::models;

#[tokio::test]
async fn test_feeder_models_query() {
    let db = connect_db().await.expect("Failed to connect to the database");

    // Test query for feeder::akumulasi::estimasi
    let result = models::feeder::akumulasi::estimasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::akumulasi::estimasi");

    // Test query for feeder::akumulasi::jumlah_data
    let result = models::feeder::akumulasi::jumlah_data::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::akumulasi::jumlah_data");

    // Test query for feeder::akun::kredential
    let result = models::feeder::akun::kredential::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::akun::kredential");

    // Test query for feeder::master::aktifitas_kuliah_mahasiswa
    let result = models::feeder::master::aktifitas_kuliah_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::aktifitas_kuliah_mahasiswa");

    // Test query for feeder::master::aktifitas_mahasiswa
    let result = models::feeder::master::aktifitas_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::aktifitas_mahasiswa");

    // Test query for feeder::master::aktifitas_mengajar_dosen
    let result = models::feeder::master::aktifitas_mengajar_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::aktifitas_mengajar_dosen");

    // Test query for feeder::master::anggota_aktifitas_mahasiswa
    let result = models::feeder::master::anggota_aktifitas_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::anggota_aktifitas_mahasiswa");

    // Test query for feeder::master::bidang_minat_perguruan_tinggi
    let result = models::feeder::master::bidang_minat_perguruan_tinggi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::bidang_minat_perguruan_tinggi");

    // Test query for feeder::master::bimbing_mahasiswa
    let result = models::feeder::master::bimbing_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::bimbing_mahasiswa");

    // Test query for feeder::master::biodata_dosen
    let result = models::feeder::master::biodata_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::biodata_dosen");

    // Test query for feeder::master::biodata_mahasiswa
    let result = models::feeder::master::biodata_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::biodata_mahasiswa");

    // Test query for feeder::master::detail_nilai_perkuliahan_kelas
    let result = models::feeder::master::detail_nilai_perkuliahan_kelas::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::detail_nilai_perkuliahan_kelas");

    // Test query for feeder::master::dosen
    let result = models::feeder::master::dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::dosen");

    // Test query for feeder::master::dosen_pembimbing
    let result = models::feeder::master::dosen_pembimbing::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::dosen_pembimbing");

    // Test query for feeder::master::dosen_pengajar_kelas_kuliah
    let result = models::feeder::master::dosen_pengajar_kelas_kuliah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::dosen_pengajar_kelas_kuliah");

    // Test query for feeder::master::fakultas
    let result = models::feeder::master::fakultas::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::fakultas");

    // Test query for feeder::master::hitung_transkrip_angkatan_mahasiswa
    let result = models::feeder::master::hitung_transkrip_angkatan_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::hitung_transkrip_angkatan_mahasiswa");

    // Test query for feeder::master::kartu_rencana_studi_mahasiswa
    let result = models::feeder::master::kartu_rencana_studi_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::kartu_rencana_studi_mahasiswa");

    // Test query for feeder::master::kelas_kuliah
    let result = models::feeder::master::kelas_kuliah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::kelas_kuliah");

    // Test query for feeder::master::komponen_evaluasi_kelas
    let result = models::feeder::master::komponen_evaluasi_kelas::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::komponen_evaluasi_kelas");

    // Test query for feeder::master::konsistensi_data
    let result = models::feeder::master::konsistensi_data::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::konsistensi_data");

    // Test query for feeder::master::konversi_kampus_merdeka
    let result = models::feeder::master::konversi_kampus_merdeka::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::konversi_kampus_merdeka");

    // Test query for feeder::master::kurikulum
    let result = models::feeder::master::kurikulum::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::kurikulum");

    // Test query for feeder::master::mahasiswa
    let result = models::feeder::master::mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::mahasiswa");

    // Test query for feeder::master::mahasiswa_bimbingan_dosen
    let result = models::feeder::master::mahasiswa_bimbingan_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::mahasiswa_bimbingan_dosen");

    // Test query for feeder::master::mahasiswa_lulusan_dropout
    let result = models::feeder::master::mahasiswa_lulusan_dropout::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::mahasiswa_lulusan_dropout");

    // Test query for feeder::master::matakuliah
    let result = models::feeder::master::matakuliah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::matakuliah");

    // Test query for feeder::master::matakuliah_kurikulum
    let result = models::feeder::master::matakuliah_kurikulum::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::matakuliah_kurikulum");

    // Test query for feeder::master::nilai_perkuliahan_kelas
    let result = models::feeder::master::nilai_perkuliahan_kelas::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::nilai_perkuliahan_kelas");

    // Test query for feeder::master::nilai_transfer_pendidikan_mahasiswa
    let result = models::feeder::master::nilai_transfer_pendidikan_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::nilai_transfer_pendidikan_mahasiswa");

    // Test query for feeder::master::penugasan_dosen
    let result = models::feeder::master::penugasan_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::penugasan_dosen");

    // Test query for feeder::master::perguruan_tinggi
    let result = models::feeder::master::perguruan_tinggi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::perguruan_tinggi");

    // Test query for feeder::master::periode_aktif
    let result = models::feeder::master::periode_aktif::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::periode_aktif");

    // Test query for feeder::master::periode_perkuliahan
    let result = models::feeder::master::periode_perkuliahan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::periode_perkuliahan");

    // Test query for feeder::master::perkuliahan_mahasiswa
    let result = models::feeder::master::perkuliahan_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::perkuliahan_mahasiswa");

    // Test query for feeder::master::peserta_kelas_kuliah
    let result = models::feeder::master::peserta_kelas_kuliah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::peserta_kelas_kuliah");

    // Test query for feeder::master::prestasi_mahasiswa
    let result = models::feeder::master::prestasi_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::prestasi_mahasiswa");

    // Test query for feeder::master::profil_perguruan_tinggi
    let result = models::feeder::master::profil_perguruan_tinggi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::profil_perguruan_tinggi");

    // Test query for feeder::master::program_studi
    let result = models::feeder::master::program_studi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::program_studi");

    // Test query for feeder::master::rencana_evaluasi
    let result = models::feeder::master::rencana_evaluasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::rencana_evaluasi");

    // Test query for feeder::master::rencana_pembelajaran
    let result = models::feeder::master::rencana_pembelajaran::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::rencana_pembelajaran");

    // Test query for feeder::master::riwayat_fungsional_dosen
    let result = models::feeder::master::riwayat_fungsional_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_fungsional_dosen");

    // Test query for feeder::master::riwayat_nilai_mahasiswa
    let result = models::feeder::master::riwayat_nilai_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_nilai_mahasiswa");

    // Test query for feeder::master::riwayat_pangkat_dosen
    let result = models::feeder::master::riwayat_pangkat_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_pangkat_dosen");

    // Test query for feeder::master::riwayat_pendidikan_dosen
    let result = models::feeder::master::riwayat_pendidikan_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_pendidikan_dosen");

    // Test query for feeder::master::riwayat_pendidikan_mahasiswa
    let result = models::feeder::master::riwayat_pendidikan_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_pendidikan_mahasiswa");

    // Test query for feeder::master::riwayat_penelitian_dosen
    let result = models::feeder::master::riwayat_penelitian_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_penelitian_dosen");

    // Test query for feeder::master::riwayat_sertifikasi_dosen
    let result = models::feeder::master::riwayat_sertifikasi_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::riwayat_sertifikasi_dosen");

    // Test query for feeder::master::skala_nilai_program_studi
    let result = models::feeder::master::skala_nilai_program_studi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::skala_nilai_program_studi");

    // Test query for feeder::master::substansi_matakuliah
    let result = models::feeder::master::substansi_matakuliah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::substansi_matakuliah");

    // Test query for feeder::master::transkrip_mahasiswa
    let result = models::feeder::master::transkrip_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::transkrip_mahasiswa");

    // Test query for feeder::master::uji_mahasiswa
    let result = models::feeder::master::uji_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::master::uji_mahasiswa");

    // Test query for feeder::referensi::agama
    let result = models::feeder::referensi::agama::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::agama");

    // Test query for feeder::referensi::alat_transportasi
    let result = models::feeder::referensi::alat_transportasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::alat_transportasi");

    // Test query for feeder::referensi::bentuk_pendidikan
    let result = models::feeder::referensi::bentuk_pendidikan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::bentuk_pendidikan");

    // Test query for feeder::referensi::ikatan_kerja_sumber_daya_manusia
    let result = models::feeder::referensi::ikatan_kerja_sumber_daya_manusia::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::ikatan_kerja_sumber_daya_manusia");

    // Test query for feeder::referensi::jabatan_fungsional
    let result = models::feeder::referensi::jabatan_fungsional::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jabatan_fungsional");

    // Test query for feeder::referensi::jalur_masuk
    let result = models::feeder::referensi::jalur_masuk::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jalur_masuk");

    // Test query for feeder::referensi::jenis_aktifitas_mahasiswa
    let result = models::feeder::referensi::jenis_aktifitas_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_aktifitas_mahasiswa");

    // Test query for feeder::referensi::jenis_evaluasi
    let result = models::feeder::referensi::jenis_evaluasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_evaluasi");

    // Test query for feeder::referensi::jenis_keluar
    let result = models::feeder::referensi::jenis_keluar::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_keluar");

    // Test query for feeder::referensi::jenis_pendaftaran
    let result = models::feeder::referensi::jenis_pendaftaran::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_pendaftaran");

    // Test query for feeder::referensi::jenis_prestasi
    let result = models::feeder::referensi::jenis_prestasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_prestasi");

    // Test query for feeder::referensi::jenis_satuan_manajemen_sumberdaya
    let result = models::feeder::referensi::jenis_satuan_manajemen_sumberdaya::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_satuan_manajemen_sumberdaya");

    // Test query for feeder::referensi::jenis_sertifikasi
    let result = models::feeder::referensi::jenis_sertifikasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_sertifikasi");

    // Test query for feeder::referensi::jenis_substansi
    let result = models::feeder::referensi::jenis_substansi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_substansi");

    // Test query for feeder::referensi::jenis_tinggal
    let result = models::feeder::referensi::jenis_tinggal::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenis_tinggal");

    // Test query for feeder::referensi::jenjang_pendidikan
    let result = models::feeder::referensi::jenjang_pendidikan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::jenjang_pendidikan");

    // Test query for feeder::referensi::kategori_kegiatan
    let result = models::feeder::referensi::kategori_kegiatan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::kategori_kegiatan");

    // Test query for feeder::referensi::kebutuhan_khusus
    let result = models::feeder::referensi::kebutuhan_khusus::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::kebutuhan_khusus");

    // Test query for feeder::referensi::lembaga_pengangkat
    let result = models::feeder::referensi::lembaga_pengangkat::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::lembaga_pengangkat");

    // Test query for feeder::referensi::level_wilayah
    let result = models::feeder::referensi::level_wilayah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::level_wilayah");

    // Test query for feeder::referensi::negara
    let result = models::feeder::referensi::negara::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::negara");

    // Test query for feeder::referensi::pangkat_golongan
    let result = models::feeder::referensi::pangkat_golongan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::pangkat_golongan");

    // Test query for feeder::referensi::pekerjaan
    let result = models::feeder::referensi::pekerjaan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::pekerjaan");

    // Test query for feeder::referensi::pembiayaan
    let result = models::feeder::referensi::pembiayaan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::pembiayaan");

    // Test query for feeder::referensi::penghasilan
    let result = models::feeder::referensi::penghasilan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::penghasilan");

    // Test query for feeder::referensi::periode_lampau
    let result = models::feeder::referensi::periode_lampau::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::periode_lampau");

    // Test query for feeder::referensi::semester
    let result = models::feeder::referensi::semester::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::semester");

    // Test query for feeder::referensi::status_keaktifan_pegawai
    let result = models::feeder::referensi::status_keaktifan_pegawai::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::status_keaktifan_pegawai");

    // Test query for feeder::referensi::status_kepegawaian
    let result = models::feeder::referensi::status_kepegawaian::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::status_kepegawaian");

    // Test query for feeder::referensi::status_mahasiswa
    let result = models::feeder::referensi::status_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::status_mahasiswa");

    // Test query for feeder::referensi::tahun_ajaran
    let result = models::feeder::referensi::tahun_ajaran::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::tahun_ajaran");

    // Test query for feeder::referensi::tingkat_prestasi
    let result = models::feeder::referensi::tingkat_prestasi::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::tingkat_prestasi");

    // Test query for feeder::referensi::wilayah
    let result = models::feeder::referensi::wilayah::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::referensi::wilayah");

    // Test query for feeder::rekapitulasi::indeks_prestasi_sementara_mahasiswa
    let result = models::feeder::rekapitulasi::indeks_prestasi_sementara_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::rekapitulasi::indeks_prestasi_sementara_mahasiswa");

    // Test query for feeder::rekapitulasi::jumlah_dosen
    let result = models::feeder::rekapitulasi::jumlah_dosen::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::rekapitulasi::jumlah_dosen");

    // Test query for feeder::rekapitulasi::jumlah_mahasiswa
    let result = models::feeder::rekapitulasi::jumlah_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::rekapitulasi::jumlah_mahasiswa");

    // Test query for feeder::rekapitulasi::kartu_hasil_studi_mahasiswa
    let result = models::feeder::rekapitulasi::kartu_hasil_studi_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::rekapitulasi::kartu_hasil_studi_mahasiswa");

    // Test query for feeder::rekapitulasi::kartu_rencana_studi_mahasiswa
    let result = models::feeder::rekapitulasi::kartu_rencana_studi_mahasiswa::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::rekapitulasi::kartu_rencana_studi_mahasiswa");

    // Test query for feeder::rekapitulasi::laporan
    let result = models::feeder::rekapitulasi::laporan::Entity::find().one(&db).await;
    assert!(result.is_ok(), "Query failed for feeder::rekapitulasi::laporan");

}
