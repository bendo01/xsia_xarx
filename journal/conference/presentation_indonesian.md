---
title: "Deteksi Anomali Kepatuhan pada Data Akademik Pendidikan Tinggi"
theme: "catppuccin"
color_accent: "#89b4fa"
color_selection: "#45475a"
color_muted: "#585b70"
color_background: "#1e1e2e"
color_dark_background: "#161622"
color_darker_background: "#101019"
color_lighter_background: "#313244"
color_foreground: "#cdd6f4"
color_dark_foreground: "#6c7086"
color_light_foreground: "#bac2de"
color_bright_foreground: "#cdd6f4"
color_red: "#f38ba8"
color_yellow: "#f9e2af"
color_orange: "#f6b6ab"
color_green: "#a6e3a1"
color_cyan: "#94e2d5"
color_blue: "#89b4fa"
color_magenta: "#f5c2e7"
color_brown: "#7b5b55"
color_bright_red: "#f38ba8"
color_bright_yellow: "#f9e2af"
color_bright_green: "#a6e3a1"
color_bright_cyan: "#94e2d5"
color_bright_blue: "#89b4fa"
color_bright_magenta: "#f5c2e7"
---

# Deteksi Anomali Kepatuhan pada Data Akademik Pendidikan Tinggi

```svg
<svg viewBox="0 0 800 360">
<circle cx="200" cy="100" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="230" cy="120" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="260" cy="85" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="290" cy="125" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="320" cy="105" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="210" cy="150" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="270" cy="155" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="310" cy="75" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="350" cy="140" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="245" cy="110" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="370" cy="95" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="180" cy="125" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="295" cy="100" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="330" cy="120" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="640" cy="60" r="9" fill="var(--red)"/><circle cx="640" cy="60" r="20" fill="none" stroke="var(--red)" stroke-width="2" stroke-dasharray="4 4"/><circle cx="560" cy="170" r="9" fill="var(--yellow)"/><circle cx="560" cy="170" r="20" fill="none" stroke="var(--yellow)" stroke-width="2" stroke-dasharray="4 4"/><text x="400" y="300" font-size="22" text-anchor="middle" fill="var(--foreground)">Aturan + Isolation Forest + LOF + Autoencoder</text><text x="400" y="335" font-size="18" text-anchor="middle" fill="var(--dark-foreground)">Studi kasus data PDDIKTI</text>
</svg>
```

<!-- Tambahkan nama penulis dan afiliasi di sini (makalah bersifat double-blind). -->

---

# Mengapa penting

```svg
<svg viewBox="0 0 800 360">
<rect x="40" y="60" width="200" height="130" rx="14" fill="var(--accent)" fill-opacity="0.12" stroke="var(--accent)" stroke-width="2"/><text x="140" y="115" font-size="17" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Perguruan tinggi</text><text x="140" y="150" font-size="13" text-anchor="middle" fill="var(--foreground)">lapor tiap semester</text><rect x="300" y="60" width="200" height="130" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><text x="400" y="115" font-size="26" text-anchor="middle" fill="var(--foreground)" font-weight="bold">PDDIKTI</text><text x="400" y="150" font-size="13" text-anchor="middle" fill="var(--foreground)">sumber data utama</text><rect x="560" y="60" width="200" height="130" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><text x="660" y="115" font-size="20" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Akreditasi</text><text x="660" y="150" font-size="13" text-anchor="middle" fill="var(--foreground)">dan penjaminan mutu</text><g stroke="var(--accent)" stroke-width="3" fill="var(--accent)"><line x1="245" y1="125" x2="290" y2="125"/><path d="M290,117 L304,125 L290,133 z"/><line x1="505" y1="125" x2="550" y2="125"/><path d="M550,117 L564,125 L550,133 z"/></g><rect x="40" y="240" width="720" height="80" rx="14" fill="var(--red)" fill-opacity="0.10" stroke="var(--red)" stroke-width="2"/><text x="400" y="288" font-size="24" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Data yang salah melemahkan mutu dan akreditasi</text>
</svg>
```

<!-- Permendiktisaintek 39/2025 menetapkan PDDIKTI sebagai sumber data utama penjaminan mutu. Setiap institusi bertanggung jawab atas kebenarannya. Pelaporan dilakukan melalui aplikasi Feeder, yang menerapkan aturan validasi bawaan sebelum sinkronisasi. -->

---

# Masalahnya

```svg
<svg viewBox="0 0 800 360">
<line x1="60" y1="330" x2="580" y2="330" stroke="var(--dark-foreground)" stroke-width="2"/><line x1="60" y1="20" x2="60" y2="330" stroke="var(--dark-foreground)" stroke-width="2"/><text x="320" y="352" font-size="16" text-anchor="middle" fill="var(--dark-foreground)">Beban SKS</text><text x="22" y="180" font-size="16" fill="var(--dark-foreground)" transform="rotate(-90 22 180)" text-anchor="middle">IPK</text><circle cx="220" cy="130" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="240" cy="150" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="260" cy="120" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="280" cy="160" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="300" cy="140" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="230" cy="175" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="270" cy="185" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="310" cy="170" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="250" cy="100" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="290" cy="110" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="210" cy="150" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="330" cy="130" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="200" cy="115" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="320" cy="100" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="255" cy="145" r="7" fill="var(--accent)" fill-opacity="0.8"/><line x1="480" y1="20" x2="480" y2="330" stroke="var(--yellow)" stroke-width="2" stroke-dasharray="8 6"/><text x="480" y="14" font-size="14" text-anchor="middle" fill="var(--yellow)">batas 24 SKS</text><circle cx="530" cy="120" r="8" fill="var(--red)"/><circle cx="540" cy="200" r="8" fill="var(--red)"/><circle cx="440" cy="300" r="8" fill="var(--yellow)"/><circle cx="440" cy="300" r="20" fill="none" stroke="var(--yellow)" stroke-width="2"/><circle cx="580" cy="90" r="8" fill="var(--red)"/><text x="600" y="96" font-size="13" text-anchor="start" fill="var(--foreground)">Melanggar aturan: terdeteksi</text><circle cx="580" cy="140" r="8" fill="var(--yellow)"/><text x="600" y="138" font-size="13" text-anchor="start" fill="var(--foreground)">Lolos semua aturan,</text><text x="600" y="160" font-size="13" text-anchor="start" fill="var(--foreground)">tetapi janggal: terlewat</text><circle cx="580" cy="200" r="8" fill="var(--accent)"/><text x="600" y="206" font-size="13" text-anchor="start" fill="var(--foreground)">Data normal</text>
</svg>
```

<!-- Aturan menangkap apa yang bisa dituliskan (IPK > 4,0, beban SKS > 24), tetapi melewatkan data yang lolos semua ambang batas namun janggal secara kombinasi, misalnya beban SKS tinggi dengan IPK sangat rendah. Setiap jenis kesalahan baru membutuhkan aturan baru. -->

---

# Pertanyaan penelitian

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="50" width="240" height="260" rx="14" fill="var(--accent)" fill-opacity="0.12" stroke="var(--accent)" stroke-width="2"/><circle cx="140" cy="105" r="32" fill="var(--accent)"/><text x="140" y="117" font-size="34" text-anchor="middle" fill="var(--background)" font-weight="bold">1</text><text x="140" y="190" font-size="15" text-anchor="middle" fill="var(--foreground)">Pelanggaran apa yang</text><text x="140" y="215" font-size="15" text-anchor="middle" fill="var(--foreground)">terdeteksi aturan Feeder?</text><rect x="280" y="50" width="240" height="260" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><circle cx="400" cy="105" r="32" fill="var(--magenta)"/><text x="400" y="117" font-size="34" text-anchor="middle" fill="var(--background)" font-weight="bold">2</text><text x="400" y="190" font-size="14" text-anchor="middle" fill="var(--foreground)">Dapatkah detektor</text><text x="400" y="215" font-size="14" text-anchor="middle" fill="var(--foreground)">tak terawasi menemukan</text><text x="400" y="240" font-size="15" text-anchor="middle" fill="var(--foreground)">data yang lolos aturan?</text><rect x="540" y="50" width="240" height="260" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><circle cx="660" cy="105" r="32" fill="var(--green)"/><text x="660" y="117" font-size="34" text-anchor="middle" fill="var(--background)" font-weight="bold">3</text><text x="660" y="190" font-size="15" text-anchor="middle" fill="var(--foreground)">Apakah gabungan keduanya</text><text x="660" y="215" font-size="15" text-anchor="middle" fill="var(--foreground)">meningkatkan deteksi?</text>
</svg>
```

<!-- Kontribusi: himpunan aturan yang dipetakan ke atribut PDDIKTI, protokol evaluasi dengan anomali yang disuntikkan, perbandingan empiris aturan, Isolation Forest, LOF, autoencoder, dan gabungannya. -->

---

# Data

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="40" width="240" height="180" rx="14" fill="var(--accent)" fill-opacity="0.12" stroke="var(--accent)" stroke-width="2"/><text x="140" y="135" font-size="56" text-anchor="middle" fill="var(--accent)" font-weight="bold">3.948</text><text x="140" y="185" font-size="18" text-anchor="middle" fill="var(--foreground)">Mahasiswa-semester</text><rect x="280" y="40" width="240" height="180" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><text x="400" y="135" font-size="56" text-anchor="middle" fill="var(--green)" font-weight="bold">348</text><text x="400" y="185" font-size="20" text-anchor="middle" fill="var(--foreground)">Mata kuliah</text><rect x="540" y="40" width="240" height="180" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><text x="660" y="135" font-size="56" text-anchor="middle" fill="var(--magenta)" font-weight="bold">1.636</text><text x="660" y="185" font-size="20" text-anchor="middle" fill="var(--foreground)">Pengajaran dosen</text><text x="400" y="290" font-size="22" text-anchor="middle" fill="var(--foreground)">1 institusi  ·  3 program studi  ·  15 semester (2020/1 - 2026/1)</text>
</svg>
```

<!-- Data direplikasi dari web service Feeder ke penyimpanan relasional. 709 mahasiswa, 1.607 kelas, 90 dosen. Data hasil ekstraksi sudah lolos validasi Feeder. -->

---

# Aturan kepatuhan Feeder

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="30" width="240" height="140" rx="14" fill="var(--accent)" fill-opacity="0.12" stroke="var(--accent)" stroke-width="2"/><text x="140" y="85" font-size="20" text-anchor="middle" fill="var(--foreground)">IPK atau IPS</text><text x="140" y="130" font-size="26" text-anchor="middle" fill="var(--accent)" font-weight="bold">> 4,0</text><rect x="280" y="30" width="240" height="140" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><text x="400" y="85" font-size="20" text-anchor="middle" fill="var(--foreground)">SKS semester</text><text x="400" y="130" font-size="26" text-anchor="middle" fill="var(--green)" font-weight="bold">> 24</text><rect x="540" y="30" width="240" height="140" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><text x="660" y="85" font-size="20" text-anchor="middle" fill="var(--foreground)">Komponen SKS</text><text x="660" y="130" font-size="17" text-anchor="middle" fill="var(--magenta)" font-weight="bold">tidak sama total</text><rect x="150" y="190" width="240" height="140" rx="14" fill="var(--yellow)" fill-opacity="0.12" stroke="var(--yellow)" stroke-width="2"/><text x="270" y="245" font-size="20" text-anchor="middle" fill="var(--foreground)">Pertemuan</text><text x="270" y="290" font-size="26" text-anchor="middle" fill="var(--yellow)" font-weight="bold">> 18</text><rect x="410" y="190" width="240" height="140" rx="14" fill="var(--red)" fill-opacity="0.12" stroke="var(--red)" stroke-width="2"/><text x="530" y="245" font-size="16" text-anchor="middle" fill="var(--foreground)">Periode tumpang tindih</text><text x="530" y="290" font-size="15" text-anchor="middle" fill="var(--red)" font-weight="bold">dan mahasiswa duplikat</text>
</svg>
```

<!-- Empat validasi Feeder dikecualikan: pemeriksaan identitas DUKCAPIL (data eksternal), konsistensi jenis kelamin (tidak ada nilai acuan), mahasiswa tanpa registrasi dan program studi yang belum ada di pengaturan periode (bukan level rekaman). Aturan lain: SKS mata kuliah > 9. -->

---

# Alur kerja

```svg
<svg viewBox="0 0 800 320">
  <defs>
    <marker id="a" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto">
      <path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/>
    </marker>
  </defs>
  <g fill="none" stroke="var(--accent)" stroke-width="2">
    <rect x="20" y="30" width="200" height="70" rx="8"/>
    <rect x="300" y="30" width="200" height="70" rx="8"/>
    <rect x="580" y="30" width="200" height="70" rx="8"/>
    <rect x="20" y="220" width="200" height="70" rx="8"/>
    <rect x="300" y="220" width="200" height="70" rx="8"/>
    <rect x="580" y="220" width="200" height="70" rx="8"/>
    <line x1="220" y1="65" x2="296" y2="65" marker-end="url(#a)"/>
    <line x1="500" y1="65" x2="576" y2="65" marker-end="url(#a)"/>
    <line x1="680" y1="100" x2="680" y2="216" marker-end="url(#a)"/>
    <line x1="580" y1="255" x2="504" y2="255" marker-end="url(#a)"/>
    <line x1="300" y1="255" x2="224" y2="255" marker-end="url(#a)"/>
  </g>
  <g font-size="18" text-anchor="middle" fill="var(--foreground)">
    <text x="120" y="60">Tabel PDDIKTI</text><text x="120" y="82" font-size="12">data Feeder terreplikasi</text>
    <text x="400" y="60">Injeksi anomali</text><text x="400" y="82" font-size="14">10 seed</text>
    <text x="680" y="60">Deteksi</text><text x="680" y="82" font-size="14">berbasis aturan</text>
    <text x="680" y="250">Detektor ML</text><text x="680" y="272" font-size="14">IF, LOF, autoencoder</text>
    <text x="400" y="250" font-size="15">Peringkat persentil</text><text x="400" y="272" font-size="14">+ soft vote</text>
    <text x="120" y="250">Evaluasi</text><text x="120" y="272" font-size="14">AUC, P@k, recall</text>
  </g>
</svg>
```

<!-- Anomali yang disuntikkan ditambahkan ke salinan tabel; aturan dan detektor ML dinilai terhadap label hasil injeksi. Aturan dan ML berjalan paralel dan digabungkan oleh detektor gabungan. Istilah: AUC = peluang anomali mendapat skor lebih tinggi daripada rekaman normal; P@k (Precision@k) = dari k rekaman peringkat teratas, berapa persen yang benar-benar anomali (k = jumlah anomali yang disuntikkan, rumus |top-k ∩ A| / k); recall = persen anomali yang berhasil ditemukan. -->

---

# Tiga detektor tak terawasi

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="20" width="240" height="310" rx="14" fill="var(--cyan)" fill-opacity="0.12" stroke="var(--cyan)" stroke-width="2"/><g stroke="var(--cyan)" stroke-width="2" fill="none"><rect x="60" y="60" width="160" height="110"/><line x1="120" y1="60" x2="120" y2="170"/><line x1="120" y1="110" x2="220" y2="110"/><line x1="170" y1="110" x2="170" y2="170"/></g><circle cx="80" cy="80" r="5" fill="var(--foreground)"/><circle cx="95" cy="140" r="5" fill="var(--foreground)"/><circle cx="145" cy="85" r="5" fill="var(--foreground)"/><circle cx="145" cy="150" r="5" fill="var(--foreground)"/><circle cx="215" cy="130" r="5" fill="var(--foreground)"/><circle cx="200" cy="80" r="6" fill="var(--red)"/><text x="140" y="225" font-size="19" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Isolation Forest</text><text x="140" y="262" font-size="16" text-anchor="middle" fill="var(--foreground)">pemisahan acak</text><rect x="280" y="20" width="240" height="310" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><circle cx="360" cy="100" r="5" fill="var(--foreground)"/><circle cx="380" cy="120" r="5" fill="var(--foreground)"/><circle cx="400" cy="95" r="5" fill="var(--foreground)"/><circle cx="375" cy="140" r="5" fill="var(--foreground)"/><circle cx="410" cy="125" r="5" fill="var(--foreground)"/><circle cx="390" cy="110" r="5" fill="var(--foreground)"/><circle cx="390" cy="115" r="48" fill="none" stroke="var(--magenta)" stroke-width="2" stroke-dasharray="5 4"/><circle cx="480" cy="85" r="6" fill="var(--red)"/><text x="400" y="225" font-size="24" text-anchor="middle" fill="var(--foreground)" font-weight="bold">LOF</text><text x="400" y="262" font-size="18" text-anchor="middle" fill="var(--foreground)">kepadatan lokal</text><rect x="540" y="20" width="240" height="310" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><circle cx="600" cy="75.0" r="9" fill="var(--green)"/><circle cx="600" cy="115.0" r="9" fill="var(--green)"/><circle cx="600" cy="155.0" r="9" fill="var(--green)"/><circle cx="660" cy="95.0" r="9" fill="var(--green)"/><circle cx="660" cy="135.0" r="9" fill="var(--green)"/><circle cx="720" cy="75.0" r="9" fill="var(--green)"/><circle cx="720" cy="115.0" r="9" fill="var(--green)"/><circle cx="720" cy="155.0" r="9" fill="var(--green)"/><g stroke="var(--green)" stroke-width="1.5"><line x1="609" y1="115" x2="651" y2="95"/><line x1="609" y1="115" x2="651" y2="135"/><line x1="669" y1="95" x2="711" y2="115"/><line x1="669" y1="135" x2="711" y2="115"/></g><text x="660" y="225" font-size="20" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Autoencoder</text><text x="660" y="262" font-size="15" text-anchor="middle" fill="var(--foreground)">galat rekonstruksi</text>
</svg>
```

<!-- IF: 200 pohon. LOF: k=20. Autoencoder: MLP dengan tiga lapisan tersembunyi, maksimal 400 iterasi. Fitur distandarisasi per entitas. Skor digabung dengan peringkat persentil dan soft vote; detektor gabungan menempatkan rekaman yang ditandai aturan di peringkat teratas, lalu mengurutkan sisanya berdasarkan rata-rata peringkat persentil ML. -->

---

# Evaluasi dengan anomali suntikan

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="30" width="760" height="50" rx="14" fill="var(--accent)" fill-opacity="0.10" stroke="var(--accent)" stroke-width="2"/><rect x="742" y="30" width="38" height="50" rx="6" fill="var(--yellow)"/><text x="380" y="62" font-size="20" text-anchor="middle" fill="var(--foreground)">100% rekaman</text><path d="M742,86 L520,150 M780,86 L780,150" stroke="var(--yellow)" stroke-width="2" fill="none" stroke-dasharray="5 4"/><text x="761" y="20" font-size="18" text-anchor="middle" fill="var(--yellow)" font-weight="bold">5%</text><rect x="40" y="150" width="330" height="150" rx="14" fill="var(--red)" fill-opacity="0.12" stroke="var(--red)" stroke-width="2"/><text x="205" y="195" font-size="24" text-anchor="middle" fill="var(--red)" font-weight="bold">Berbasis aturan</text><text x="205" y="235" font-size="18" text-anchor="middle" fill="var(--foreground)">sengaja melanggar</text><text x="205" y="262" font-size="18" text-anchor="middle" fill="var(--foreground)">satu aturan</text><rect x="410" y="150" width="350" height="150" rx="14" fill="var(--yellow)" fill-opacity="0.12" stroke="var(--yellow)" stroke-width="2"/><text x="585" y="195" font-size="24" text-anchor="middle" fill="var(--yellow)" font-weight="bold">Halus</text><text x="585" y="235" font-size="18" text-anchor="middle" fill="var(--foreground)">lolos semua aturan,</text><text x="585" y="262" font-size="18" text-anchor="middle" fill="var(--foreground)">menyimpang secara kombinasi</text><text x="400" y="340" font-size="18" text-anchor="middle" fill="var(--dark-foreground)">diulang dengan 10 seed acak</text>
</svg>
```

<!-- Data sudah lolos Feeder, sehingga tidak ada ground truth; anomali disuntikkan ke salinan data. Metrik: presisi, recall, F1 untuk aturan; AUC, Precision@k, dan recall top-k untuk ML dan gabungan. Hasil mengukur kemampuan deteksi pada kondisi terkendali, bukan prevalensi pelanggaran nyata. P@k (Precision@k): jika 100 anomali disuntikkan dan 82 dari 100 rekaman peringkat teratas memang anomali, maka P@k = 0,82. Ukuran ini sesuai karena peninjau memeriksa rekaman paling mencurigakan lebih dulu. -->

---

# Hasil 1: AUC

```svg
<svg viewBox="0 0 800 365">
<line x1="30" y1="300" x2="770" y2="300" stroke="var(--dark-foreground)" stroke-width="2"/><rect x="40" y="150.4" width="34" height="149.6" rx="3" fill="var(--yellow)"/><text x="57" y="144.4" font-size="12" text-anchor="middle" fill="var(--foreground)">0,904</text><rect x="82" y="207.6" width="34" height="92.4" rx="3" fill="var(--cyan)"/><text x="99" y="201.6" font-size="12" text-anchor="middle" fill="var(--foreground)">0,826</text><rect x="124" y="165.1" width="34" height="134.9" rx="3" fill="var(--magenta)"/><text x="141" y="159.1" font-size="12" text-anchor="middle" fill="var(--foreground)">0,884</text><rect x="166" y="162.1" width="34" height="137.9" rx="3" fill="var(--green)"/><text x="183" y="156.1" font-size="12" text-anchor="middle" fill="var(--foreground)">0,888</text><rect x="208" y="93.2" width="34" height="206.8" rx="3" fill="var(--accent)"/><text x="225" y="87.2" font-size="12" text-anchor="middle" fill="var(--foreground)">0,982</text><text x="140" y="325" font-size="18" text-anchor="middle" fill="var(--foreground)">Mahasiswa-semester</text><rect x="290" y="80.0" width="34" height="220.0" rx="3" fill="var(--yellow)"/><text x="307" y="74.0" font-size="12" text-anchor="middle" fill="var(--foreground)">1,000</text><rect x="332" y="92.5" width="34" height="207.5" rx="3" fill="var(--cyan)"/><text x="349" y="86.5" font-size="12" text-anchor="middle" fill="var(--foreground)">0,983</text><rect x="374" y="85.1" width="34" height="214.9" rx="3" fill="var(--magenta)"/><text x="391" y="79.1" font-size="12" text-anchor="middle" fill="var(--foreground)">0,993</text><rect x="416" y="147.5" width="34" height="152.5" rx="3" fill="var(--green)"/><text x="433" y="141.5" font-size="12" text-anchor="middle" fill="var(--foreground)">0,908</text><rect x="458" y="80.0" width="34" height="220.0" rx="3" fill="var(--accent)"/><text x="475" y="74.0" font-size="12" text-anchor="middle" fill="var(--foreground)">1,000</text><text x="390" y="325" font-size="17" text-anchor="middle" fill="var(--foreground)">Mata kuliah</text><rect x="540" y="263.3" width="34" height="36.7" rx="3" fill="var(--yellow)"/><text x="557" y="257.3" font-size="12" text-anchor="middle" fill="var(--foreground)">0,750</text><rect x="582" y="95.4" width="34" height="204.6" rx="3" fill="var(--cyan)"/><text x="599" y="89.4" font-size="12" text-anchor="middle" fill="var(--foreground)">0,979</text><rect x="624" y="179.0" width="34" height="121.0" rx="3" fill="var(--magenta)"/><text x="641" y="173.0" font-size="12" text-anchor="middle" fill="var(--foreground)">0,865</text><rect x="666" y="173.9" width="34" height="126.1" rx="3" fill="var(--green)"/><text x="683" y="167.9" font-size="12" text-anchor="middle" fill="var(--foreground)">0,872</text><rect x="708" y="101.3" width="34" height="198.7" rx="3" fill="var(--accent)"/><text x="725" y="95.3" font-size="12" text-anchor="middle" fill="var(--foreground)">0,971</text><text x="640" y="325" font-size="17" text-anchor="middle" fill="var(--foreground)">Pengajaran</text><rect x="130" y="340" width="14" height="14" fill="var(--yellow)"/><text x="150" y="353" font-size="14" text-anchor="start" fill="var(--foreground)">Aturan</text><rect x="250" y="340" width="14" height="14" fill="var(--cyan)"/><text x="270" y="353" font-size="14" text-anchor="start" fill="var(--foreground)">IF</text><rect x="370" y="340" width="14" height="14" fill="var(--magenta)"/><text x="390" y="353" font-size="14" text-anchor="start" fill="var(--foreground)">LOF</text><rect x="490" y="340" width="14" height="14" fill="var(--green)"/><text x="510" y="353" font-size="14" text-anchor="start" fill="var(--foreground)">AE</text><rect x="610" y="340" width="14" height="14" fill="var(--accent)"/><text x="600" y="353" font-size="14" text-anchor="start" fill="var(--foreground)">Gabungan</text><text x="770" y="20" font-size="12" text-anchor="end" fill="var(--dark-foreground)">sumbu mulai dari 0,7</text>
</svg>
```

<!-- Aturan mencapai 0,904 pada mahasiswa-semester karena empat perlima anomali berbasis aturan diurutkan sempurna dan seperlima anomali halus bernilai seri: 0,8 + 0,2 x 0,5. Mata kuliah: semua anomali suntikan melanggar aturan aritmetika. Pada pengajaran, IF (0,979) mengungguli gabungan (0,971). -->

---

# Hasil 2: anomali halus

```svg
<svg viewBox="0 0 800 360">
<text x="20" y="34" font-size="18" text-anchor="start" fill="var(--foreground)" font-weight="bold">Mahasiswa-semester</text><text x="170" y="69" font-size="17" text-anchor="end" fill="var(--foreground)">Aturan</text><rect x="185" y="50" width="29" height="26" rx="4" fill="var(--yellow)" fill-opacity="0.55"/><text x="224.4" y="70" font-size="16" text-anchor="start" fill="var(--foreground)">0,049</text><text x="170" y="103" font-size="17" text-anchor="end" fill="var(--foreground)">IF</text><rect x="185" y="84" width="9" height="26" rx="4" fill="var(--cyan)" fill-opacity="0.55"/><text x="204.0" y="104" font-size="16" text-anchor="start" fill="var(--foreground)">0,015</text><text x="170" y="137" font-size="17" text-anchor="end" fill="var(--foreground)">LOF</text><rect x="185" y="118" width="185" height="26" rx="4" fill="var(--magenta)" fill-opacity="0.55"/><text x="379.8" y="138" font-size="16" text-anchor="start" fill="var(--foreground)">0,308</text><text x="170" y="171" font-size="17" text-anchor="end" fill="var(--foreground)">AE</text><rect x="185" y="152" width="234" height="26" rx="4" fill="var(--green)" fill-opacity="1"/><text x="429.0" y="172" font-size="16" text-anchor="start" fill="var(--foreground)">0,390</text><text x="20" y="222" font-size="20" text-anchor="start" fill="var(--foreground)" font-weight="bold">Pengajaran</text><text x="170" y="257" font-size="17" text-anchor="end" fill="var(--foreground)">Aturan</text><rect x="185" y="238" width="16" height="26" rx="4" fill="var(--yellow)" fill-opacity="0.55"/><text x="211.2" y="258" font-size="16" text-anchor="start" fill="var(--foreground)">0,027</text><text x="170" y="291" font-size="17" text-anchor="end" fill="var(--foreground)">IF</text><rect x="185" y="272" width="397" height="26" rx="4" fill="var(--cyan)" fill-opacity="1"/><text x="591.6" y="292" font-size="16" text-anchor="start" fill="var(--foreground)">0,661</text><text x="170" y="325" font-size="17" text-anchor="end" fill="var(--foreground)">LOF</text><rect x="185" y="306" width="401" height="26" rx="4" fill="var(--magenta)" fill-opacity="1"/><text x="595.8" y="326" font-size="16" text-anchor="start" fill="var(--foreground)">0,668</text><text x="170" y="359" font-size="17" text-anchor="end" fill="var(--foreground)">AE</text><rect x="185" y="340" width="86" height="26" rx="4" fill="var(--green)" fill-opacity="0.55"/><text x="281.4" y="360" font-size="16" text-anchor="start" fill="var(--foreground)">0,144</text>
</svg>
```

<!-- Recall top-k pada rekaman yang memenuhi semua aturan. Nilai kecil non-nol pada aturan berasal dari penentuan urutan seri secara acak. Isolation Forest hampir tidak mengenali rekaman mahasiswa yang halus: tiap atribut tampak biasa, sehingga pemisahan sejajar sumbu tidak mengisolasinya. Detektor terbaik bergantung pada entitas. -->

---

# Hasil 3: penandaan

```svg
<svg viewBox="0 0 800 360">
<text x="205" y="30" font-size="18" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Mahasiswa-semester</text><text x="20" y="64" font-size="15" text-anchor="start" fill="var(--foreground)">Aturan - presisi</text><rect x="20" y="72" width="300" height="22" rx="4" fill="var(--yellow)" fill-opacity="1"/><text x="328.0" y="89" font-size="15" text-anchor="start" fill="var(--foreground)">1,000</text><text x="20" y="126" font-size="15" text-anchor="start" fill="var(--foreground)">Aturan - recall</text><rect x="20" y="134" width="242" height="22" rx="4" fill="var(--yellow)" fill-opacity="0.6"/><text x="270.4" y="151" font-size="15" text-anchor="start" fill="var(--foreground)">0,808</text><text x="20" y="188" font-size="15" text-anchor="start" fill="var(--foreground)">Gabungan - presisi</text><rect x="20" y="196" width="191" height="22" rx="4" fill="var(--accent)" fill-opacity="1"/><text x="219.4" y="213" font-size="15" text-anchor="start" fill="var(--foreground)">0,638</text><text x="20" y="250" font-size="15" text-anchor="start" fill="var(--foreground)">Gabungan - recall</text><rect x="20" y="258" width="260" height="22" rx="4" fill="var(--accent)" fill-opacity="0.6"/><text x="288.4" y="275" font-size="15" text-anchor="start" fill="var(--foreground)">0,868</text><text x="595" y="30" font-size="22" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Pengajaran</text><text x="410" y="64" font-size="15" text-anchor="start" fill="var(--foreground)">Aturan - presisi</text><rect x="410" y="72" width="300" height="22" rx="4" fill="var(--yellow)" fill-opacity="1"/><text x="718.0" y="89" font-size="15" text-anchor="start" fill="var(--foreground)">1,000</text><text x="410" y="126" font-size="15" text-anchor="start" fill="var(--foreground)">Aturan - recall</text><rect x="410" y="134" width="150" height="22" rx="4" fill="var(--yellow)" fill-opacity="0.6"/><text x="568.0" y="151" font-size="15" text-anchor="start" fill="var(--foreground)">0,500</text><text x="410" y="188" font-size="15" text-anchor="start" fill="var(--foreground)">Gabungan - presisi</text><rect x="410" y="196" width="123" height="22" rx="4" fill="var(--accent)" fill-opacity="1"/><text x="541.0" y="213" font-size="15" text-anchor="start" fill="var(--foreground)">0,410</text><text x="410" y="250" font-size="15" text-anchor="start" fill="var(--foreground)">Gabungan - recall</text><rect x="410" y="258" width="256" height="22" rx="4" fill="var(--accent)" fill-opacity="0.6"/><text x="674.2" y="275" font-size="15" text-anchor="start" fill="var(--foreground)">0,854</text><text x="400" y="335" font-size="13" text-anchor="middle" fill="var(--dark-foreground)">Aturan tidak pernah salah tandai; gabungan menemukan lebih banyak dengan presisi lebih rendah</text>
</svg>
```

<!-- Mata kuliah: keduanya recall 1,000; presisi gabungan 0,811. Presisi aturan 1,0 terjadi secara konstruksi, karena injeksi dibuat dari aturan yang sama. -->

---

# Analisis per entitas

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="30" width="240" height="290" rx="14" fill="var(--accent)" fill-opacity="0.12" stroke="var(--accent)" stroke-width="2"/><text x="140" y="75" font-size="18" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Mahasiswa-semester</text><text x="140" y="160" font-size="58" text-anchor="middle" fill="var(--accent)" font-weight="bold">0,982</text><text x="140" y="200" font-size="18" text-anchor="middle" fill="var(--foreground)">AUC gabungan</text><text x="140" y="262" font-size="14" text-anchor="middle" fill="var(--dark-foreground)">autoencoder ML terbaik</text><rect x="280" y="30" width="240" height="290" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><text x="400" y="75" font-size="21" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Mata kuliah</text><text x="400" y="160" font-size="58" text-anchor="middle" fill="var(--green)" font-weight="bold">1,000</text><text x="400" y="200" font-size="18" text-anchor="middle" fill="var(--foreground)">Aturan sempurna</text><text x="400" y="262" font-size="15" text-anchor="middle" fill="var(--dark-foreground)">ML menambah sedikit</text><rect x="540" y="30" width="240" height="290" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><text x="660" y="75" font-size="21" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Pengajaran</text><text x="660" y="160" font-size="58" text-anchor="middle" fill="var(--magenta)" font-weight="bold">0,979</text><text x="660" y="200" font-size="16" text-anchor="middle" fill="var(--foreground)">AUC Isolation Forest</text><text x="660" y="262" font-size="15" text-anchor="middle" fill="var(--dark-foreground)">aturan hanya 0,750</text>
</svg>
```

<!-- Pengajaran: rasio pertemuan terealisasi/terencana kemungkinan sinyal berdimensi rendah yang kuat (belum diuji). Voting tanpa bobot sedikit di bawah IF, sehingga voting berbobot menjadi perluasan yang wajar. Varians autoencoder pada mata kuliah mencerminkan hanya 348 rekaman. -->

---

# Implikasi praktis

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="40" width="220" height="170" rx="14" fill="var(--yellow)" fill-opacity="0.12" stroke="var(--yellow)" stroke-width="2"/><text x="130" y="95" font-size="26" text-anchor="middle" fill="var(--yellow)" font-weight="bold">1  Aturan</text><text x="130" y="140" font-size="17" text-anchor="middle" fill="var(--foreground)">tepat, murah,</text><text x="130" y="165" font-size="17" text-anchor="middle" fill="var(--foreground)">merujuk kriteria</text><rect x="290" y="40" width="220" height="170" rx="14" fill="var(--cyan)" fill-opacity="0.12" stroke="var(--cyan)" stroke-width="2"/><text x="400" y="95" font-size="26" text-anchor="middle" fill="var(--cyan)" font-weight="bold">2  ML</text><text x="400" y="140" font-size="14" text-anchor="middle" fill="var(--foreground)">mengurutkan yang tidak</text><text x="400" y="165" font-size="14" text-anchor="middle" fill="var(--foreground)">dijelaskan aturan</text><rect x="560" y="40" width="220" height="170" rx="14" fill="var(--green)" fill-opacity="0.12" stroke="var(--green)" stroke-width="2"/><text x="670" y="95" font-size="26" text-anchor="middle" fill="var(--green)" font-weight="bold">3  Peninjau</text><text x="670" y="140" font-size="14" text-anchor="middle" fill="var(--foreground)">memeriksa yang paling</text><text x="670" y="165" font-size="14" text-anchor="middle" fill="var(--foreground)">janggal lebih dulu</text><g stroke="var(--accent)" stroke-width="3" fill="var(--accent)"><line x1="244" y1="125" x2="278" y2="125"/><path d="M278,117 L292,125 L278,133 z"/><line x1="514" y1="125" x2="548" y2="125"/><path d="M548,117 L562,125 L548,133 z"/></g><rect x="20" y="245" width="370" height="70" rx="14" fill="var(--accent)" fill-opacity="0.08" stroke="var(--accent)" stroke-width="2"/><text x="205" y="287" font-size="19" text-anchor="middle" fill="var(--foreground)">Tampilkan skor tiap detektor</text><rect x="410" y="245" width="370" height="70" rx="14" fill="var(--accent)" fill-opacity="0.08" stroke="var(--accent)" stroke-width="2"/><text x="595" y="287" font-size="19" text-anchor="middle" fill="var(--foreground)">Beri skor per semester</text>
</svg>
```

<!-- Tampilkan skor tiap detektor, bukan satu angka. Beri skor per semester, bukan seluruh riwayat, agar rekaman tidak ditandai hanya karena kondisi akademik berubah. -->

---

# Keterbatasan

```svg
<svg viewBox="0 0 800 360">
<rect x="20" y="50" width="240" height="240" rx="14" fill="var(--red)" fill-opacity="0.12" stroke="var(--red)" stroke-width="2"/><path d="M140,80 L180,150 L100,150 z" fill="none" stroke="var(--red)" stroke-width="4" stroke-linejoin="round"/><text x="140" y="138" font-size="34" text-anchor="middle" fill="var(--red)" font-weight="bold">!</text><text x="140" y="205" font-size="24" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Anomali</text><text x="140" y="240" font-size="18" text-anchor="middle" fill="var(--foreground)">sintetis</text><rect x="280" y="50" width="240" height="240" rx="14" fill="var(--yellow)" fill-opacity="0.12" stroke="var(--yellow)" stroke-width="2"/><path d="M400,80 L440,150 L360,150 z" fill="none" stroke="var(--yellow)" stroke-width="4" stroke-linejoin="round"/><text x="400" y="138" font-size="34" text-anchor="middle" fill="var(--yellow)" font-weight="bold">!</text><text x="400" y="205" font-size="24" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Satu institusi</text><text x="400" y="240" font-size="18" text-anchor="middle" fill="var(--foreground)">tiga program studi</text><rect x="540" y="50" width="240" height="240" rx="14" fill="var(--magenta)" fill-opacity="0.12" stroke="var(--magenta)" stroke-width="2"/><path d="M660,80 L700,150 L620,150 z" fill="none" stroke="var(--magenta)" stroke-width="4" stroke-linejoin="round"/><text x="660" y="138" font-size="34" text-anchor="middle" fill="var(--magenta)" font-weight="bold">!</text><text x="660" y="205" font-size="20" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Hiperparameter</text><text x="660" y="240" font-size="14" text-anchor="middle" fill="var(--foreground)">bawaan / sedikit disetel</text>
</svg>
```

<!-- Data pengajaran: 339 dari 1.636 rekaman (20,7%) sudah memiliki nol pertemuan terealisasi, tumpang tindih dengan nilai anomali halus yang disuntikkan; 25 dari 410 injeksi halus tidak mengubah nilai asli. -->

---

# Kesimpulan

```svg
<svg viewBox="0 0 800 360">
<circle cx="270" cy="150" r="130" fill="var(--yellow)" fill-opacity="0.2" stroke="var(--yellow)" stroke-width="3"/><circle cx="530" cy="150" r="130" fill="var(--cyan)" fill-opacity="0.2" stroke="var(--cyan)" stroke-width="3"/>
<text x="195" y="110" font-size="24" text-anchor="middle" fill="var(--yellow)" font-weight="bold">Aturan</text><text x="195" y="150" font-size="13" text-anchor="middle" fill="var(--foreground)">tepat pada</text><text x="195" y="170" font-size="13" text-anchor="middle" fill="var(--foreground)">pelanggaran</text><text x="195" y="190" font-size="13" text-anchor="middle" fill="var(--foreground)">eksplisit</text>
<text x="605" y="110" font-size="24" text-anchor="middle" fill="var(--cyan)" font-weight="bold">ML</text><text x="605" y="150" font-size="13" text-anchor="middle" fill="var(--foreground)">menemukan</text><text x="605" y="170" font-size="13" text-anchor="middle" fill="var(--foreground)">sebagian</text><text x="605" y="190" font-size="13" text-anchor="middle" fill="var(--foreground)">anomali halus</text>
<text x="400" y="140" font-size="15" text-anchor="middle" fill="var(--foreground)" font-weight="bold">saling</text><text x="400" y="162" font-size="15" text-anchor="middle" fill="var(--foreground)" font-weight="bold">melengkapi</text>
<text x="400" y="325" font-size="13" text-anchor="middle" fill="var(--dark-foreground)">Selanjutnya: pelanggaran nyata, lebih banyak institusi, voting berbobot, RAG ke teks regulasi</text>
</svg>
```

<!-- Aturan: tepat pada pelanggaran eksplisit, buta terhadap yang halus. ML: menemukan sebagian anomali halus, bergantung pada entitas. Pekerjaan lanjutan: validasi pada pelanggaran nyata, lebih banyak institusi, voting berbobot, dan menautkan penandaan ke teks regulasi dengan RAG. -->

---

# Terima kasih

```svg
<svg viewBox="0 0 800 280">
<circle cx="390" cy="60" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="420" cy="80" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="450" cy="45" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="480" cy="85" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="510" cy="65" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="400" cy="110" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="460" cy="115" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="500" cy="35" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="540" cy="100" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="435" cy="70" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="560" cy="55" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="370" cy="85" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="485" cy="60" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="520" cy="80" r="7" fill="var(--accent)" fill-opacity="0.8"/><circle cx="620" cy="70" r="9" fill="var(--yellow)"/><circle cx="620" cy="70" r="20" fill="none" stroke="var(--yellow)" stroke-width="2" stroke-dasharray="4 4"/><text x="400" y="240" font-size="34" text-anchor="middle" fill="var(--foreground)" font-weight="bold">Ada pertanyaan?</text>
</svg>
```
