# TODO: article.tex

Judul: Compliance Anomaly Detection in Higher Education Academic Data Using Rule-Based and Machine Learning Methods

Status: 6 halaman, 23 referensi, kompilasi bersih (`make pdf`). Draf, belum siap kirim.

## Yang harus dikerjakan

### Data dan etika
- [ ] Prosedur anonimisasi data (komentar TODO di PDDIKTI Dataset, `article.tex` baris 107)
- [ ] Pernyataan izin/etika penggunaan data PDDIKTI institusi (data dari Institut Teknologi dan Kesehatan Tri Tunas Nasional; belum ada keterangan izin tertulis)
- [ ] Hapus komentar TODO di Compliance Rules (baris 134); aturan sudah dicocokkan dengan panduan Feeder, tinggal hapus komentarnya

### Penulis dan format
- [ ] Cek ejaan nama promotor dan ko-promotor sesuai ORCID
- [ ] Matikan watermark DRAFT (3 baris `eso-pic` di preamble) untuk versi final
- [ ] Cek ketentuan konferensi tujuan (batas halaman, pernyataan penggunaan alat bantu AI, format referensi)

### Referensi dan klaim
- [ ] Cocokkan kalimat yang mengutip tiap referensi dengan isi paper aslinya (daftar di `citation_check.md`), terutama Han (ADBench), Mehta, Gorgun & Bulut, Yang, Klüttermann
- [ ] Ganti preprint arXiv (Mehta, Chen/PyOD 2, Gao) dengan versi terbit bila sudah ada
- [ ] Tahun Pang: makalah memakai edisi Mar. 2022 (terbit online 2021); putuskan mana yang dipakai

### Eksperimen
- [ ] Validasi pada pelanggaran nyata (bukan hanya injeksi), jika ada data
- [ ] Opsional: tambah entitas (riwayat pendidikan, periode perkuliahan) dan institusi lain
- [ ] Sinkronkan makalah dengan sistem terbaru di `server/` (autoencoder `burn`, soft voting per semester, fitur lebih banyak), atau jalankan ulang eksperimen dengan itu. Sekarang makalah mendeskripsikan skrip Python `experiment/run_experiment.py` (scikit-learn)
- [ ] Opsional: tuning bobot soft voting dengan label (angka Combined sekarang rata-rata rank tanpa bobot)

## Yang sudah dikerjakan

### Penulisan
- [x] Abstract (150-250 kata: konteks, masalah, data PDDIKTI saja, metode, hasil kuantitatif; tanpa simbol/math/footnote)
- [x] Introduction (peran PDDIKTI, regulasi penjaminan mutu, motivasi kualitas data, pertanyaan penelitian, struktur makalah)
- [x] Related Work (empat subbagian: outlier detection, benchmark dan ensemble, data quality dan rule-based, data pendidikan)
- [x] Methodology: rumus skor tiga detektor, soft vote berbasis percentile rank, definisi AUC dan Precision@k, tabel karakteristik detektor, tabel pengaturan eksperimen
- [x] Results: analisis per entitas, Table VII (precision, recall, F1), Practical Implications, Threats to Validity, Explainability of Findings
- [x] Catat di artikel bahwa anomali "subtle" didefinisikan penulis, termasuk catatan 20,7% record teaching asli sudah punya realisasi nol
- [x] Conclusion diperpanjang (future work: validasi pelanggaran nyata, bobot soft voting, RAG)
- [x] Acknowledgment (terima kasih atas data dari ITK Tri Tunas Nasional; tanpa pendanaan eksternal)

### Data dan aturan
- [x] Tabel aturan dicocokkan dengan panduan Feeder v4.0 (bagian 13.3); semua aturan ada di panduan
- [x] Alasan validasi di luar cakupan (DUKCAPIL, jenis kelamin, mahasiswa non registrasi, program studi belum diatur); DUKCAPIL dirujuk ke UU 24/2013 Pasal 58(4) dan 79(2)-(3)
- [x] Peraturan menteri diperbaiki: Permen 39/2025 diterbitkan Menteri Pendidikan Tinggi, Sains, dan Teknologi (BN 2025 No. 661, diundangkan 25 Sep. 2025) dan mencabut Permen 53/2023 (Pasal 117)

### Gambar dan penulis
- [x] Diagram pipeline (dibuat dengan TikZ di dokumen, `pipeline.png` tidak diperlukan)
- [x] Tambah penulis ke-2 dan ke-3 (promotor/ko-promotor)

### Referensi
- [x] Isolation Forest, LOF, Autoencoder
- [x] Tambah literatur data quality / anomaly detection (15 referensi 2021-2025, total 23)
- [x] Cek entri `feeder_guide` (cocok dengan PDF: User Guide Feeder PDDIKTI versi 4.0, 7 Des 2020)
- [x] Detail referensi dicocokkan dengan sumber (BibTeX/RIS, Crossref, arXiv, PDF): Chang, Klüttermann, Smith, Han, Zha, Whang, Hariri, Gorgun & Bulut, Ruff, Pang, Yang, Sumadi & Wilantika, Liu, Breunig, scikit-learn, Permen 53/2023, Permen 39/2025, UU 24/2013

### Eksperimen
- [x] Tabel V dan VI dicocokkan dengan `experiment/results/metrics_summary.csv` (semua sel sama)
- [x] Eksperimen dijalankan ulang dengan database, hasil identik (selisih maksimum 0)
- [x] Cek label noise anomali subtle teaching (6,1% injeksi tidak mengubah nilai; 20,7% record asli sudah realisasi nol)

### Build
- [x] TeX Live terpasang (`latexmk`, `pdflatex`)
- [x] `make pdf` berhasil, 6 halaman
