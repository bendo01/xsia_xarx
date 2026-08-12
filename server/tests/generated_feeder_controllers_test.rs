use salvo::prelude::*;
use salvo::test::*;
use xsia_xarx::controllers;
use xsia_xarx::db::connect_db;

#[handler]
async fn inject_db(depot: &mut Depot) {
    let db = connect_db().await.expect("Failed to connect to DB");
    depot.insert_typed(db);
}

#[tokio::test]
async fn test_feeder_controllers() {
    let router = controllers::feeder::router();
    let service = Service::new(router).hoop(inject_db);

    let paths = vec![
        "/akumulasi/estimasi",
        "/akumulasi/jumlah-data",
        "/akun/kredential",
        "/master/aktifitas-kuliah-mahasiswa",
        "/master/aktifitas-mahasiswa",
        "/master/aktifitas-mengajar-dosen",
        "/master/anggota-aktifitas-mahasiswa",
        "/master/bidang-minat-perguruan-tinggi",
        "/master/bimbing-mahasiswa",
        "/master/biodata-dosen",
        "/master/biodata-mahasiswa",
        "/master/detail-nilai-perkuliahan-kelas",
        "/master/dosen",
        "/master/dosen-pembimbing",
        "/master/dosen-pengajar-kelas-kuliah",
        "/master/fakultas",
        "/master/hitung-transkrip-angkatan-mahasiswa",
        "/master/kartu-rencana-studi-mahasiswa",
        "/master/kelas-kuliah",
        "/master/komponen-evaluasi-kelas",
        "/master/konsistensi-data",
        "/master/konversi-kampus-merdeka",
        "/master/kurikulum",
        "/master/mahasiswa",
        "/master/mahasiswa-bimbingan-dosen",
        "/master/mahasiswa-lulusan-dropout",
        "/master/matakuliah",
        "/master/matakuliah-kurikulum",
        "/master/nilai-perkuliahan-kelas",
        "/master/nilai-transfer-pendidikan-mahasiswa",
        "/master/penugasan-dosen",
        "/master/perguruan-tinggi",
        "/master/periode-aktif",
        "/master/periode-perkuliahan",
        "/master/perkuliahan-mahasiswa",
        "/master/peserta-kelas-kuliah",
        "/master/prestasi-mahasiswa",
        "/master/profil-perguruan-tinggi",
        "/master/program-studi",
        "/master/rencana-evaluasi",
        "/master/rencana-pembelajaran",
        "/master/riwayat-fungsional-dosen",
        "/master/riwayat-nilai-mahasiswa",
        "/master/riwayat-pangkat-dosen",
        "/master/riwayat-pendidikan-dosen",
        "/master/riwayat-pendidikan-mahasiswa",
        "/master/riwayat-penelitian-dosen",
        "/master/riwayat-sertifikasi-dosen",
        "/master/skala-nilai-program-studi",
        "/master/substansi-matakuliah",
        "/master/transkrip-mahasiswa",
        "/master/uji-mahasiswa",
        "/referensi/agama",
        "/referensi/alat-transportasi",
        "/referensi/bentuk-pendidikan",
        "/referensi/ikatan-kerja-sumber-daya-manusia",
        "/referensi/jabatan-fungsional",
        "/referensi/jalur-masuk",
        "/referensi/jenis-aktifitas-mahasiswa",
        "/referensi/jenis-evaluasi",
        "/referensi/jenis-keluar",
        "/referensi/jenis-pendaftaran",
        "/referensi/jenis-prestasi",
        "/referensi/jenis-satuan-manajemen-sumberdaya",
        "/referensi/jenis-sertifikasi",
        "/referensi/jenis-substansi",
        "/referensi/jenis-tinggal",
        "/referensi/jenjang-pendidikan",
        "/referensi/kategori-kegiatan",
        "/referensi/kebutuhan-khusus",
        "/referensi/lembaga-pengangkat",
        "/referensi/level-wilayah",
        "/referensi/negara",
        "/referensi/pangkat-golongan",
        "/referensi/pekerjaan",
        "/referensi/pembiayaan",
        "/referensi/penghasilan",
        "/referensi/periode-lampau",
        "/referensi/semester",
        "/referensi/status-keaktifan-pegawai",
        "/referensi/status-kepegawaian",
        "/referensi/status-mahasiswa",
        "/referensi/tahun-ajaran",
        "/referensi/tingkat-prestasi",
        "/referensi/wilayah",
        "/rekapitulasi/indeks-prestasi-sementara-mahasiswa",
        "/rekapitulasi/jumlah-dosen",
        "/rekapitulasi/jumlah-mahasiswa",
        "/rekapitulasi/kartu-hasil-studi-mahasiswa",
        "/rekapitulasi/kartu-rencana-studi-mahasiswa",
        "/rekapitulasi/laporan",
    ];

    for path in paths {
        let url = format!("http://127.0.0.1:5800{}", path);
        let res = TestClient::get(&url).send(&service).await;
        assert!(res.status_code.is_some(), "Failed to reach {}", path);
    }
}
