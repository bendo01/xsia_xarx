# TODO: article.tex

Judul: Compliance Anomaly Detection in Higher Education Academic Data Using Rule-Based and Machine Learning Methods

## Penulisan
- [x] Abstract (150-250 kata: konteks, masalah, data PDDIKTI saja, metode, hasil kuantitatif; tanpa simbol/math/footnote)
- [x] Introduction (peran PDDIKTI, regulasi penjaminan mutu, contoh ketidakpatuhan, pertanyaan penelitian, struktur makalah)
- [x] Related Work (anomaly/outlier detection, rule-based compliance checking, data quality di data pendidikan)
- [ ] Acknowledgment (isi atau hapus)

## Data dan etika
- [ ] Prosedur anonimisasi data
- [ ] Pernyataan izin/etika penggunaan data PDDIKTI institusi
- [ ] Hapus komentar TODO di Compliance Rules setelah aturan dikonfirmasi

## Gambar dan penulis
- [ ] Diagram pipeline (`pipeline.png`), lalu aktifkan blok figure yang dikomentari di Methodology
- [x] Tambah penulis ke-2 dan ke-3 (promotor/ko-promotor)
- [ ] Cek ejaan nama promotor dan ko-promotor sesuai ORCID

## Referensi
- [x] Isolation Forest, LOF, Autoencoder
- [ ] Tambah literatur data quality / anomaly detection di data pendidikan untuk Related Work (saat ini hanya referensi dasar)
- [ ] Cek entri `feeder_guide` (penerbit dan format)

## Eksperimen
- [ ] Validasi pada pelanggaran nyata (bukan hanya injeksi), jika ada data
- [ ] Opsional: tambah entitas (riwayat pendidikan, periode perkuliahan) dan institusi lain
- [ ] Catat di artikel bahwa anomali "subtle" didefinisikan penulis

## Build
- [ ] Pasang TeX Live (`sudo pacman -S --needed texlive texlive-publishers`) atau `tectonic`
- [ ] Jalankan `make pdf`, perbaiki error kompilasi, cek batas halaman konferensi
