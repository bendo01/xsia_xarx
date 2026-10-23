# Knowledge Base Regulasi Pendidikan Tinggi

Hierarki peraturan, status berlaku/dicabut, dan urutan unggah (ingest) dokumen di `legislation_regulation/`.

Status diverifikasi dari pasal penutup tiap dokumen (pasal "dicabut dan dinyatakan tidak berlaku"). Yang belum bisa diverifikasi dari isi folder ditandai **(verifikasi)**.

## 1. Hierarki

Sumber diagram ada di `diagram/*.puml` (render SVG di folder yang sama). Render ulang: `plantuml -tsvg diagram/*.puml`.

### 1.1 Hierarki peraturan (UUD sampai teknis operasional)

![Hierarki regulasi](diagram/hierarki_regulasi.svg)

<details><summary>Kode PlantUML</summary>

```plantuml
@startuml hierarki_regulasi
skinparam shadowing false
skinparam defaultFontName Arial
skinparam rectangle {
  RoundCorner 8
  BorderColor #555555
}
skinparam package {
  BorderColor #888888
}

rectangle "**UUD NRI 1945**\nPasal 31 (1, 3, 5): Hak Pendidikan & IPTEK\nPasal 17 (3): Kewenangan Kementerian\nPasal 20 & 21: Pembentukan UU" as UUD #E8EAF6

package "Undang-Undang" {
  rectangle "UU 20/2003\nSistem Pendidikan Nasional" as UU2003
  rectangle "UU 14/2005\nGuru dan Dosen" as UU2005
  rectangle "UU 12/2012\nPendidikan Tinggi" as UU2012
  rectangle "UU 39/2008 jo. 61/2024\nKementerian Negara" as UU2008
  rectangle "UU 5/2014\nAparatur Sipil Negara\n//historis//" as UU2014 #FFCDD2
  rectangle "UU 20/2023\nAparatur Sipil Negara" as UU2023
}

package "Peraturan Pemerintah" {
  rectangle "PP 57/2021 jo. 4/2022\nStandar Nasional Pendidikan" as PP2021
  rectangle "PP 37/2009\nDosen" as PP2009
  rectangle "PP 4/2014\nPenyelenggaraan Dikti & PT" as PP2014
  rectangle "PP 11/2017 jo. 17/2020\nManajemen PNS" as PP2017
}

package "Perpres" {
  rectangle "Perpres 8/2012\nKerangka Kualifikasi Nasional (KKNI)" as KKNI
  rectangle "Perpres 189/2024 jo. 7/2026\nKelembagaan Kemendiktisaintek" as PERPRES
}

package "Regulasi ASN" {
  rectangle "PermenPAN-RB 13/2019\nPengusulan & Pembinaan Jabfung\n//historis//" as PAN13 #FFCDD2
  rectangle "PermenPAN-RB 1/2023\nKerangka Jabatan Fungsional" as PAN1
  rectangle "Peraturan BKN 3/2023\nAngka Kredit, Pangkat, Jenjang Jabfung\n(di folder baru buku panduan teknisnya)" as BKN #FFF9C4
}

rectangle "Permendiktisaintek 1/2024\nOrganisasi & Tata Kerja" as ORG

package "Peraturan Menteri (4 pilar, lihat diagram 2)" {
  rectangle "Pilar 1\nSDM & Karier Dosen" as PIL1 #E3F2FD
  rectangle "Pilar 2\nMutu & Akreditasi" as PIL2 #FFF8E1
  rectangle "Pilar 3\nKelembagaan PT" as PIL3 #F3E5F5
  rectangle "Pilar 4\nIjazah, Sertifikat & Gelar" as PIL4 #E0F2F1
}

package "Teknis Operasional & Internal Institusi" {
  rectangle "Juknis BKD & Manual FEEDER PDDikti\nRubrik Kinerja Dosen, Validation Rules" as FEEDER
  rectangle "Peraturan Rektor / Statuta PT / SOP\nBatas IPK/SKS, Cuti, MBKM Kampus" as INTERNAL
}

UUD --> UU2003
UUD --> UU2005
UUD --> UU2012
UUD --> UU2008
UUD --> UU2023
UU2014 -[#red,dashed]-> UU2023 : dicabut\n(Pasal 76)

UU2003 --> PP2021
UU2005 --> PP2009
UU2012 --> PP2014
UU2008 --> PERPRES
UU2023 --> PP2017
UU2023 --> PAN13
PAN13 -[#red,dashed]-> PAN1 : dicabut\n(Pasal 62)
UU2023 --> PAN1
PAN1 --> BKN

KKNI --> PIL2
PERPRES --> ORG
PP2014 --> ORG
ORG --> PIL1
ORG --> PIL2
ORG --> PIL3
ORG --> PIL4
PP2009 --> PIL1
PP2021 --> PIL2
PP2014 --> PIL3
PP2014 --> PIL4

PIL1 --> FEEDER
PIL4 --> FEEDER
PIL2 --> INTERNAL
PIL3 --> INTERNAL
BKN --> FEEDER
@enduml
```

</details>

### 1.2 Peraturan Menteri per pilar dan rantai pencabutan

![Pilar regulasi](diagram/pilar_regulasi.svg)

<details><summary>Kode PlantUML</summary>

```plantuml
@startuml pilar_regulasi
skinparam shadowing false
skinparam defaultFontName Arial
skinparam rectangle {
  RoundCorner 8
  BorderColor #555555
}
skinparam package {
  BorderColor #888888
}

package "Pilar 1: SDM & Karier Dosen" #E3F2FD {
  rectangle "Kepmendikbudristek 384/P/2024\nJuknis Layanan Karier Dosen\n//historis//" as K384_24 #FFCDD2
  rectangle "SE Mendiktisaintek 14/2024\nPenundaan Permendikbudristek 44/2024\n//konteks, historis//" as SE14_24 #FFCDD2
  rectangle "Permendikbudristek 44/2024\nProfesi, Karier, Penghasilan Dosen\n//historis (audit < 2025)//" as P44_24 #FFCDD2
  rectangle "Permendiktisaintek 52/2025\nProfesi, Karier, Penghasilan Dosen\n**berlaku**" as P52_25 #C8E6C9
  rectangle "Kepmendiktisaintek 63/M/KEP/2025\nJuknis Layanan Pembinaan & Pengembangan\nProfesi dan Karier Dosen\n**berlaku**" as K63_25 #C8E6C9
}

package "Pilar 2: Mutu & Akreditasi" #FFF8E1 {
  rectangle "Permendikbud 50/2014\nSPM Dikti\n//historis//" as P50_14 #FFCDD2
  rectangle "Permenristekdikti 44/2015\nSN-Dikti\n//historis//" as P44_15 #FFCDD2
  rectangle "Permenristekdikti 62/2016\nSistem Penjaminan Mutu Dikti\n//historis//" as P62_16 #FFCDD2
  rectangle "Permenristekdikti 55/2017\nStandar Pendidikan Guru\n//historis//" as P55_17 #FFCDD2
  rectangle "Permendikbud 3/2020\nSN-Dikti\n//historis//" as P3_20 #FFCDD2
  rectangle "Permendikbud 5/2020\nAkreditasi Prodi & PT\n//historis//" as P5_20 #FFCDD2
  rectangle "Permendikbudristek 56/2022\nStandar Pendidikan Guru\n//historis//" as P56_22 #FFCDD2
  rectangle "Permendikbudristek 53/2023\nPenjaminan Mutu Dikti\n//historis//" as P53_23 #FFCDD2
  rectangle "Permendiktisaintek 39/2025\nPenjaminan Mutu Dikti\n**berlaku**" as P39_25 #C8E6C9
  rectangle "Permendiktisaintek 10/2026\nPerubahan atas 39/2025\n**berlaku**" as P10_26 #C8E6C9
}

package "Pilar 3: Kelembagaan PT" #F3E5F5 {
  rectangle "Permenristekdikti 51/2018\nPendirian PTN/PTS\n//historis//" as P51_18 #FFCDD2
  rectangle "Permenristekdikti 52/2018\nProsedur Pendirian PTS, Prodi, Joint Program\n//verifikasi//" as P52_18 #FFF9C4
  rectangle "Permendikbud 7/2020\nPendirian PTN/PTS\n**berlaku**" as P7_20 #C8E6C9
}

package "Pilar 4: Ijazah, Sertifikat & Gelar" #E0F2F1 {
  rectangle "Permendikbud 81/2014\nIjazah, Sertifikat\n//historis//" as P81_14 #FFCDD2
  rectangle "Permenristekdikti 63/2016\nGelar & Penulisan Gelar\n//historis//" as P63_16 #FFCDD2
  rectangle "Permenristekdikti 59/2018\nIjazah, Sertifikat, Gelar\n//historis//" as P59_18 #FFCDD2
  rectangle "Permendikbudristek 6/2022\nIjazah, Sertifikat, Gelar\n//historis//" as P6_22 #FFCDD2
  rectangle "Permendikbudristek 50/2024\nIjazah, Sertifikat Kompetensi & Profesi\n**berlaku**" as P50_24 #C8E6C9
}

P44_24 -[#red,dashed]-> P52_25 : dicabut\n(Pasal 67)
P52_25 --> K63_25 : juknis
K384_24 -[#red,dashed]-> K63_25 : dicabut\n(Diktum KEDUA)
SE14_24 ..> P44_24 : menunda
P50_14 -[#red,dashed]-> P62_16 : dicabut\n(Pasal 10)
P55_17 -[#red,dashed]-> P56_22 : dicabut\n(Pasal 33)
P5_20 -[#red,dashed]-> P53_23 : dicabut\n(Pasal 106)
P81_14 -[#red,dashed]-> P59_18 : dicabut\n(Pasal 25)
P63_16 -[#red,dashed]-> P59_18 : dicabut\n(Pasal 25)
P44_15 -[#red,dashed]-> P3_20 : dicabut
P3_20 -[#red,dashed]-> P53_23 : dicabut\n(Pasal 106)
P62_16 -[#red,dashed]-> P53_23 : dicabut\n(Pasal 106)
P56_22 -[#red,dashed]-> P53_23 : dicabut\n(Pasal 106)
P53_23 -[#red,dashed]-> P39_25 : dicabut\n(Pasal 117)
P39_25 --> P10_26 : diubah
P51_18 -[#red,dashed]-> P7_20 : dicabut\n(Pasal 93)
P59_18 -[#red,dashed]-> P6_22 : dicabut\n(Pasal 35)
P6_22 -[#red,dashed]-> P50_24 : dicabut\n(Pasal 27)

legend right
  |= Warna |= Arti |
  | <#C8E6C9> | Berlaku |
  | <#FFCDD2> | Historis / dicabut |
  | <#FFF9C4> | Perlu verifikasi |
  Panah merah putus-putus = dicabut oleh
endlegend
@enduml
```

</details>

## 2. Peraturan Menteri per Pilar

Rantai pencabutan terbaca dari atas (historis) ke bawah (berlaku).

### Regulasi ASN (L1 sampai L3)

| Peraturan | Tentang | Status |
|---|---|---|
| UU No. 5/2014 | Aparatur Sipil Negara | Historis. Dicabut UU 20/2023 (Pasal 76). Peraturan pelaksanaannya tetap berlaku sepanjang tidak bertentangan (Pasal 75). |
| UU No. 20/2023 | Aparatur Sipil Negara | **Berlaku** |
| PP No. 11/2017 | Manajemen Pegawai Negeri Sipil | Berlaku sepanjang tidak bertentangan dengan UU 20/2023. **(verifikasi)** penggantinya. |
| PP No. 17/2020 | Perubahan atas PP 11/2017 | Berlaku bersama PP 11/2017. |
| PermenPAN-RB No. 13/2019 | Pengusulan, Penetapan, dan Pembinaan Jabatan Fungsional PNS | Historis. Dicabut PermenPAN-RB 1/2023 (Pasal 62 huruf a). |
| PermenPAN-RB No. 1/2023 | Jabatan Fungsional | **Berlaku** |

### Pilar 1: SDM & Karier Dosen

| Peraturan | Tentang | Status |
|---|---|---|
| Kepmendikbudristek No. 384/P/2024 (12 Agustus 2024) | Juknis Pelaksanaan Layanan Pembinaan dan Pengembangan Profesi dan Karier Dosen | Historis. Dicabut Kepmendiktisaintek 63/M/KEP/2025 (Diktum KEDUA). Mencabut Kepmen 209/P/2024 (tidak ada di folder). Dipakai selama penundaan Permendikbudristek 44/2024. |
| SE Mendiktisaintek No. 14/2024 (17 Desember 2024) | Penundaan Implementasi Permendikbudristek 44/2024 | Konteks historis, bukan peraturan. Menunda 44/2024 dan menunjuk Kepmen 384/P/2024 selama reviu. Kehilangan objek setelah 44/2024 dicabut. |
| Permendikbudristek No. 44/2024 | Profesi, Karier, dan Penghasilan Dosen | Historis. Dicabut Permendiktisaintek 52/2025 (Pasal 67). Dipakai untuk audit < 2025. |
| Permendiktisaintek No. 52/2025 | Profesi, Karier, dan Penghasilan Dosen | **Berlaku** |
| Kepmendiktisaintek No. 63/M/KEP/2025 (3 Maret 2025) | Petunjuk Teknis Layanan Pembinaan dan Pengembangan Profesi dan Karier Dosen | **Berlaku**. Keputusan Menteri, bukan Permen. Mencabut Kepmen 384/P/2024 (Diktum KEDUA). Pasal peralihan Permendiktisaintek 52/2025 menjadikannya dasar proses usulan yang masuk sebelum 2025. |

### Pilar 2: Mutu & Akreditasi Dikti

| Peraturan | Tentang | Status |
|---|---|---|
| Permendikbud No. 50/2014 | Sistem Penjaminan Mutu Pendidikan Tinggi | Historis. Dicabut Permenristekdikti 62/2016 (Pasal 10). |
| Permenristekdikti No. 44/2015 | SN-Dikti | Historis. Dicabut Permendikbud 3/2020 (bersama No. 50/2018). |
| Permenristekdikti No. 62/2016 | Sistem Penjaminan Mutu Pendidikan Tinggi | Historis. Dicabut Permendikbudristek 53/2023 (Pasal 106 huruf a). Mencabut Permendikbud 50/2014. |
| Permenristekdikti No. 55/2017 | Standar Pendidikan Guru | Historis. Dicabut Permendikbudristek 56/2022 (Pasal 33). |
| Permendikbud No. 3/2020 | SN-Dikti | Historis. Dicabut Permendikbudristek 53/2023 (Pasal 106 huruf b). |
| Permendikbud No. 5/2020 | Akreditasi Program Studi dan Perguruan Tinggi | Historis. Dicabut Permendikbudristek 53/2023 (Pasal 106 huruf c). |
| Permendikbudristek No. 56/2022 | Standar Pendidikan Guru | Historis. Dicabut Permendikbudristek 53/2023 (Pasal 106 huruf d). Mencabut Permenristekdikti 55/2017. |
| Permendikbudristek No. 53/2023 | Penjaminan Mutu Pendidikan Tinggi | Historis. Dicabut Permendiktisaintek 39/2025 (Pasal 117). |
| Permendiktisaintek No. 39/2025 | Penjaminan Mutu Pendidikan Tinggi | **Berlaku** |
| Permendiktisaintek No. 10/2026 | Perubahan atas No. 39/2025 | **Berlaku** |

### Pilar 3: Kelembagaan Perguruan Tinggi

| Peraturan | Tentang | Status |
|---|---|---|
| Permenristekdikti No. 51/2018 | Pendirian, Perubahan, Pembubaran PTN; Pendirian, Perubahan, Pencabutan Izin PTS | Historis. Dicabut Permendikbud 7/2020 (Pasal 93). |
| Permenristekdikti No. 52/2018 | Prosedur Pendirian PTS, Pembukaan Prodi, Joint Program PTS | Ditetapkan 17 Oktober 2018 (BN 2018/No. 1498), 10 pasal, mengatur prosedur izin lewat OSS. Teksnya tidak memuat pasal pencabutan. Tidak termasuk daftar pencabutan Permendikbud 7/2020 (BPK hanya mencatat 51/2018). Dianggap **berlaku** menurut folder. **(verifikasi)** pencabutan oleh peraturan lain: belum bisa dipastikan dari peraturan.bpk.go.id (pencarian tidak menemukan halaman detailnya). |
| Permendikbud No. 7/2020 | Pendirian, Perubahan, Pembubaran PTN; Pendirian, Perubahan, Pencabutan Izin PTS | **Berlaku**. Per pengecekan peraturan.bpk.go.id (BN 2020/No. 51; ditetapkan 24 Januari 2020, diundangkan 28 Januari 2020) belum ada perubahan maupun peraturan pengganti. Mencabut Permenristekdikti 51/2018. |

### Pilar 4: Ijazah, Sertifikat & Gelar

| Peraturan | Tentang | Status |
|---|---|---|
| Permendikbud No. 81/2014 | Ijazah, Sertifikat Kompetensi, dan Sertifikat Profesi Pendidikan Tinggi | Historis. Dicabut Permenristekdikti 59/2018 (Pasal 25). |
| Permenristekdikti No. 63/2016 | Gelar dan Tata Cara Penulisan Gelar di PT | Historis. Dicabut Permenristekdikti 59/2018 (Pasal 25). |
| Permenristekdikti No. 59/2018 | Ijazah, Sertifikat Kompetensi, Sertifikat Profesi, Gelar, dan Tata Cara Penulisan Gelar di PT | Historis. Dicabut Permendikbudristek 6/2022 (Pasal 35). Mencabut Permendikbud 81/2014 dan Permenristekdikti 63/2016. |
| Permendikbudristek No. 6/2022 | Ijazah, Sertifikat Kompetensi, Sertifikat Profesi, Gelar, Kesetaraan Ijazah PT Negara Lain | Historis. Dicabut Permendikbudristek 50/2024 (Pasal 27). |
| Permendikbudristek No. 50/2024 | Ijazah, Sertifikat Kompetensi, dan Sertifikat Profesi Jenjang Pendidikan Tinggi | **Berlaku** menurut folder. **(verifikasi)** perubahan/penggantinya. |

Catatan: Permendikbudristek 50/2024 **bukan** tentang akreditasi, berbeda dengan versi diagram sebelumnya. Akreditasi diatur dalam Permendikbudristek 53/2023 dan Permendiktisaintek 39/2025 (menggantikan Permendikbud 5/2020 yang tidak ada di folder).

## 3. Urutan Unggah (Ingest)

Prinsip: induk dahulu, turunan kemudian; dalam satu pilar urutkan historis ke berlaku. Hierarki di RAG ditentukan oleh metadata (nomor, tahun, status), bukan urutan masuk.

| # | Level | File |
|---|---|---|
| 1 | L0 UUD | `UUD_1945.pdf` |
| 2 | L1 UU | `UU_Tahun_2003_No_20.pdf` |
| 3 | L1 UU | `UU_Tahun_2005_No_14.pdf` |
| 4 | L1 UU | `UU_Tahun_2008_No_39.pdf` |
| 5 | L1 UU | `UU_Tahun_2024_No_61.pdf` |
| 6 | L1 UU | `UU_Tahun_2012_No_12.pdf` |
| 7 | L1 UU | `UU_Tahun_2014_No_05.pdf` |
| 8 | L1 UU | `UU_Tahun_2023_No_20.pdf` |
| 9 | L2 PP | `PP_Tahun_2009_No_37.pdf` |
| 10 | L2 PP | `PP_Tahun_2014_No_04.pdf` |
| 11 | L2 PP | `PP_Tahun_2017_No_11.pdf` |
| 12 | L2 PP | `PP_Tahun_2020_No_17.pdf` |
| 13 | L2 PP | `PP_Tahun_2021_No_57.pdf` |
| 14 | L2 PP | `PP_Tahun_2022_No_04.pdf` |
| 15 | L3 Perpres | `Perpres_Tahun_2012_No_008.pdf` |
| 16 | L3 Perpres | `Perpres_Tahun_2024_No_189.pdf` |
| 17 | L3 Perpres | `Perpres_Tahun_2026_No_007.pdf` |
| 18 | L3 ASN | `PermenPANRB_Tahun_2019_No_13.pdf` |
| 19 | L3 ASN | `PermenPANRB_Tahun_2023_No_01.pdf` |
| 20 | L3 Organisasi | `Permendiktisaintek_Tahun_2024_No_01.pdf` |
| 21 | L4 Pilar 3 | `Permenristekdikti_No_51_Tahun_2018.pdf` |
| 22 | L4 Pilar 3 | `Permenristekdikti_Tahun_2018_No_52.pdf` |
| 23 | L4 Pilar 3 | `Permendikbud_Tahun_2020_No_07.pdf` |
| 24 | L4 Pilar 2 | `Permendikbud_Tahun_2014_No_50.pdf` |
| 25 | L4 Pilar 2 | `Permenristekdikti_No_44_Tahun_2015.pdf` |
| 26 | L4 Pilar 2 | `Permenristekdikti_No_62_Tahun_2016.pdf` |
| 27 | L4 Pilar 2 | `Permenristekdikti_Tahun_2017_No_55.pdf` |
| 28 | L4 Pilar 2 | `Permendikbud_Tahun_2020_No_03.pdf` |
| 29 | L4 Pilar 2 | `Permendikbud_Tahun_2020_No_05.pdf` |
| 30 | L4 Pilar 2 | `Permenristekbudristek_Tahun_2022_No_56.pdf` |
| 31 | L4 Pilar 2 | `Permendikbudristek_Tahun_2023_No_53.pdf` |
| 32 | L4 Pilar 2 | `Permendiktisaintek_Tahun_2025_No_39.pdf` |
| 33 | L4 Pilar 2 | `Permendiktisaintek_Tahun_2026_No_10.pdf` |
| 34 | L4 Pilar 1 | `Permendikbudristek_Tahun_2024_No_44.pdf` |
| 35 | L4 Pilar 1 | `Permendiktisaintek_Tahun_2025_No_52.pdf` |
| 36 | L5 Pilar 1 | `SE_Permendikbud_Tahun_2024_No_14.pdf` |
| 37 | L5 Pilar 1 | `Kepmendikbudristek_Tahun_2024_No_384_P.pdf` |
| 38 | L5 Pilar 1 | `Kepmendiktisaintek_Tahun_2025_No_63.pdf` |
| 39 | L4 Pilar 4 | `Permendikbud_2014_No_81.pdf` |
| 40 | L4 Pilar 4 | `Permenristekdikti_Tahun_2016_No_63.pdf` |
| 41 | L4 Pilar 4 | `Permenristekdikti_No_59_Tahun_2018.pdf` |
| 42 | L4 Pilar 4 | `Permen_Tahun_2022_No_06.pdf` |
| 43 | L4 Pilar 4 | `Permendikbudristek_Tahun_2024_No_50.pdf` |
| 44 | L5 Teknis | `Buku-Panduan-Teknis-PerBKN_Tahun_2023_No_03.pdf` |
| 45 | L5 Teknis | `User-Guide-WS-2-Feeder-PDDIKTI-07-12-2020.pdf` |
| 46 | L5 Teknis | `guides/UG-UI-UX-FEEDER-PDDIKTI-VERSI-4.0-07-12-2020.pdf` |

## 4. Catatan

- Belum ada di folder: teks Peraturan BKN 3/2023 itu sendiri (di folder baru buku panduan teknisnya, `L5 Teknis`), instrumen akreditasi BAN-PT/LAM, PP penilaian kinerja dan disiplin PNS, dan regulasi PDDikti.
- Nama file di `legislation_regulation/` memakai pola `Jenis_Tahun_YYYY_No_NN.pdf`. Pengecualian: `Permenristekdikti_No_NN_Tahun_YYYY` dan `Permendikbud_2014_No_81`. Tabel bagian 3 cocok dengan isi folder (46 file).
- Permendiktisaintek No. 1/2024 (Organisasi dan Tata Kerja Kementerian, ditetapkan 30 Desember 2024): Pasal 233 mencabut Permendikbudristek 28/2021 jo. 16/2024.
- Kepmendiktisaintek 63/M/KEP/2025 berupa PDF pindaian tanpa lapisan teks; pastikan docling melakukan OCR (bawaan CLI) dan periksa jumlah chunk-nya. Hal yang sama berlaku untuk `SE_Permendikbud_Tahun_2024_No_14.pdf`.
- Rantai juknis karier dosen: Kepmen 209/P/2024 (tidak ada di folder), lalu Kepmen 384/P/2024 (12 Agustus 2024), lalu Kepmen 63/M/KEP/2025 (3 Maret 2025). Masing-masing mencabut pendahulunya.
- Permendikbudristek 53/2023 Pasal 106 mencabut empat peraturan sekaligus: Permenristekdikti 62/2016, Permendikbud 3/2020, Permendikbud 5/2020, dan Permendikbudristek 56/2022.
- Perpres 7/2026 adalah perubahan atas Perpres 189/2024. Perpres 8/2012 (KKNI) tidak memuat pasal pencabutan; **(verifikasi)** perubahannya.
- PermenPAN-RB 13/2019 (jabatan fungsional PNS) sudah dicabut PermenPAN-RB 1/2023 (Pasal 62 huruf a). Hanya untuk audit riwayat.
- Permenristekdikti 51 dan 52/2018 mengatur kelembagaan/pendirian PT, bukan SN-Dikti atau SPMI.
- Isi metadata `status` (berlaku/dicabut) dan `dicabut_oleh` di tiap chunk sesuai tabel bagian 2.

## 5. Rancangan ER-Diagram Basis Pengetahuan RAG

Sumber diagram: `diagram/er_knowledge_base.puml`. Migrasi ada di `server/migration/src/regulation/` dan `server/migration/src/ai/` (prefiks `m20261022_`).

![ER basis pengetahuan](diagram/er_knowledge_base.svg)

<details><summary>Kode PlantUML</summary>

```plantuml
@startuml er_knowledge_base
skinparam shadowing false
skinparam defaultFontName Arial
hide circle
skinparam linetype ortho
skinparam nodesep 40
skinparam ranksep 50

package "regulation (registri relasional)" {
  entity "regulation_types" as RT {
    * id : uuid <<PK>>
    --
    * code : varchar
    * name : varchar
    * level : smallint
    * rank_order : smallint
  }
  entity "pillars" as PIL {
    * id : uuid <<PK>>
    --
    * code : varchar
    * name : varchar
    description : text
  }
  entity "regulations" as REG {
    * id : uuid <<PK>>
    --
    * type_id : uuid <<FK>>
    pillar_id : uuid <<FK>>
    * number : varchar
    * year : smallint
    * title : text
    issuer : varchar
    enacted_on, effective_on, revoked_on : date
    * status : berlaku | dicabut | diubah | verifikasi
    * is_historical : bool
    audit_valid_from, audit_valid_until : date
    source_file, file_sha256
    ingest_order : smallint
    verification_note : text
  }
  entity "regulation_relations" as REL {
    * id : uuid <<PK>>
    --
    * source_id : uuid <<FK>>
    * target_id : uuid <<FK>>
    * relation : mencabut | mengubah | melaksanakan | ...
    article_ref : varchar
    effective_on : date
    note : text
  }
  entity "regulation_nodes" as NODE {
    * id : uuid <<PK>>
    --
    * regulation_id : uuid <<FK>>
    parent_id : uuid <<FK self>>
    * node_type : bab | pasal | ayat | ...
    number, heading
    * path : text
    * seq : int
    body : text
    is_revoked : bool
  }
}

package "ai" {
  entity "chunks (sudah ada)" as CH {
    * id : uuid <<PK>>
    --
    * chunkable_type : varchar
    * chunkable_id : uuid
    * content : text
    heading_context, title_hierarchy
    metadata : jsonb
    embedding : vector(384)
  }
  entity "conversations (sudah ada)" as CONV {
    * id : uuid <<PK>>
  }
  entity "messages (sudah ada)" as MSG {
    * id : uuid <<PK>>
    --
    * conversation_id : uuid
    * role, content
  }
  entity "message_citations" as CIT {
    * id : uuid <<PK>>
    --
    * message_id : uuid <<FK>>
    * chunk_id : uuid <<FK>>
    * regulation_id : uuid <<FK>>
    node_id : uuid <<FK>>
    rank : smallint
    score : real
    quote : text
  }
  entity "ingest_runs" as RUN {
    * id : uuid <<PK>>
    --
    * regulation_id : uuid <<FK>>
    * status : running | ok | failed
    chunk_count : int
    embedding_model, chunker_version
    error : text
  }
}

RT ||-down-o{ REG
PIL |o-down-o{ REG
REG ||-down-o{ NODE
REG ||-left-o{ REL : source
REG ||-left-o{ REL : target
REG ||-right-o{ RUN
NODE ||.down.o{ CH : "chunkable\n(polimorfik)"
CH ||-down-o{ CIT
CONV ||-right-o{ MSG
MSG ||-down-o{ CIT
CIT }o-up-|| REG
CIT }o-up-o| NODE

RT -[hidden]right- PIL
CONV -[hidden]down- CH
@enduml
```

</details>

### 5.1 Prinsip

1. Hierarki, status, dan pencabutan disimpan sebagai data relasional (`regulation.*`), bukan hanya `metadata` di chunk. Perubahan status cukup di satu baris `regulations`.
2. `ai.chunks` tidak diubah. Chunk menunjuk ke `regulation_nodes` lewat `chunkable_type`/`chunkable_id` (polimorfik). `metadata` menyimpan salinan ringan (`level`, `status`, `pilar`) untuk pre-filter.
3. Struktur pasal (BAB, Bagian, Pasal, Ayat) disimpan sebagai pohon `regulation_nodes` agar sitasi tepat ("Pasal 67 ayat 2"). Unit chunk setingkat pasal; ayat panjang dipecah lagi.
4. Relasi antar-regulasi (mencabut, mengubah, melaksanakan, dst.) ada di `regulation_relations`. Bisa disinkronkan ke graf AGE `ai_graph` bila perlu traversal.

### 5.2 Tabel

| Skema | Tabel | Fungsi |
|---|---|---|
| `regulation` | `regulation_types` | Jenis dan level (L0 sampai L5) |
| `regulation` | `pillars` | Pilar 1 sampai 4 dan ASN |
| `regulation` | `regulations` | Registri dokumen: nomor, tahun, status, masa berlaku audit, file sumber |
| `regulation` | `regulation_relations` | Edge antar-regulasi beserta rujukan pasal |
| `regulation` | `regulation_nodes` | Pohon struktur pasal |
| `ai` | `chunks` (sudah ada) | Teks, embedding `vector(384)`, metadata |
| `ai` | `message_citations` | Sitasi jawaban ke chunk, regulasi, dan pasal |
| `ai` | `ingest_runs` | Riwayat ingest: model embedding, versi chunker, galat |

### 5.3 Pemetaan dari dokumen ini

- Level L0 sampai L5 (bagian 3) ke `regulation_types.level`; Pilar 1 sampai 4 ke `pillars`.
- Tabel rantai pencabutan (bagian 2) ke `regulation_relations`, misalnya Permendikbudristek 44/2024 `mencabut`-ke Permendiktisaintek 52/2025 (Pasal 67).
- Penanda **(verifikasi)** ke `status = 'verifikasi'` dan `verification_note`.
- Dokumen yang belum ada di folder (bagian 4) tetap dibuat sebagai baris `regulations` tanpa `source_file`, supaya relasinya tidak putus.
- Urutan unggah (bagian 3) ke `regulations.ingest_order`.

### 5.4 Isi `ai.chunks.metadata`

```json
{
  "regulation_id": "...", "type": "PERMEN", "level": 4,
  "number": "52", "year": 2025, "pillar": "SDM",
  "status": "berlaku", "is_historical": false,
  "dicabut_oleh": null, "pasal": "67", "ayat": "2"
}
```

### 5.5 Alur retrieval

1. Filter kandidat `status = 'berlaku'`, atau pakai `audit_valid_from`/`audit_valid_until` untuk audit periode lampau (mis. Permendikbudristek 44/2024 untuk audit < 2025).
2. Cari top-k dengan pgvector (cosine, indeks HNSW).
3. Naik hierarki lewat `regulation_relations` (`melaksanakan`) untuk menarik pasal induk (UU/PP) sebagai konteks.
4. Cek `mencabut`/`mengubah` untuk menyisipkan peringatan, mis. "diubah oleh Permendiktisaintek 10/2026".
5. Simpan hasil ke `message_citations`.

### 5.6 Catatan

- Perbaikan font SVG: teks hasil `plantuml` tampil sebagai huruf Yunani di sebagian viewer. Ubah teks jadi path setelah render:
  ```sh
  plantuml -tsvg diagram/er_knowledge_base.puml
  rsvg-convert -f svg -o tmp.svg diagram/er_knowledge_base.svg && mv tmp.svg diagram/er_knowledge_base.svg
  ```
- Status implementasi: task `compliance:ingest-regulations` masih menulis ke `compliance.regulation_documents` dengan `chunkable_type = 'Regulation'`, belum ke tabel `regulation.*` di atas. Daftar `REVOKED` di task itu sudah memuat 9 regulasi historis bagian 2 (44/2015, 62/2016, 51/2018, 59/2018, 3/2020, 6/2022, 56/2022, 53/2023, 44/2024).
- `ai.chunks.chunkable_id` tidak punya FK; integritas ke `regulation_nodes` dijaga di kode ingest.
- Dimensi vektor saat ini 384. Mengganti model embedding berarti embed ulang semua chunk; `ingest_runs.embedding_model` mencatat model yang dipakai.
- Migrator CLI rusak di dev DB (nama migrasi lama), jadi migrasi diterapkan satu per satu.
