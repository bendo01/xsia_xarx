# Server Models Tree Menu

> Directory tree mapping for SeaORM entities in `server/src/models` (excluding boilerplate `mod` and `prelude` files).
> Total Model Entities: **241**

```
client/src/routes
├── academic
│   ├── campaign
│   │   ├── reference
│   │   │   ├── attend_types
│   │   │   ├── calendar_categories
│   │   │   ├── encounter_categories
│   │   │   ├── implementations
│   │   │   ├── scopes
│   │   │   └── substances
│   │   └── transaction
│   │       ├── activities
│   │       ├── calendar_details
│   │       ├── calendars
│   │       ├── class_codes
│   │       ├── grades
│   │       ├── schedules
│   │       ├── teach_decrees
│   │       ├── teach_evaluations
│   │       ├── teach_lecturers
│   │       └── teaches
│   ├── candidate
│   │   ├── master
│   │   │   ├── candidate_unit
│   │   │   ├── candidates
│   │   │   └── exam_classes
│   │   ├── reference
│   │   │   ├── document_types
│   │   │   ├── phases
│   │   │   ├── registration_categories
│   │   │   └── registration_types
│   │   └── transaction
│   │       ├── candidate_unit_choices
│   │       ├── documents
│   │       └── exams
│   ├── course
│   │   ├── master
│   │   │   ├── concentrations
│   │   │   ├── course_evaluation_plannings
│   │   │   ├── course_learn_plannings
│   │   │   ├── courses
│   │   │   ├── curriculum_details
│   │   │   └── curriculums
│   │   └── reference
│   │       ├── competences
│   │       ├── course_evaluation_bases
│   │       ├── curriculum_types
│   │       ├── encounter_types
│   │       ├── evaluation_types
│   │       ├── groups
│   │       ├── semesters
│   │       └── varieties
│   ├── general
│   │   └── reference
│   │       ├── academic_year_categories
│   │       └── academic_years
│   ├── lecturer
│   │   ├── master
│   │   │   └── lecturers
│   │   ├── reference
│   │   │   ├── contracts
│   │   │   ├── groups
│   │   │   ├── ranks
│   │   │   └── statuses
│   │   └── transaction
│   │       ├── academic_groups
│   │       ├── academic_ranks
│   │       └── homebases
│   ├── prior_learning_recognition
│   │   ├── reference
│   │   │   ├── evaluator_types
│   │   │   ├── evidence_categories
│   │   │   ├── evidence_types
│   │   │   └── professionalisms
│   │   └── transaction
│   │       ├── decrees
│   │       ├── evaluation_details
│   │       ├── evaluations
│   │       ├── evaluators
│   │       └── recognitions
│   ├── student
│   │   ├── adviser
│   │   │   ├── counsellors
│   │   │   └── decrees
│   │   ├── campaign
│   │   │   ├── convertions
│   │   │   ├── detail_activities
│   │   │   ├── detail_activity_evaluation_components
│   │   │   └── student_activities
│   │   ├── final_assignment
│   │   │   ├── reference
│   │   │   │   ├── adviser_categories
│   │   │   │   ├── approval_types
│   │   │   │   ├── categories
│   │   │   │   ├── requirements
│   │   │   │   ├── stages
│   │   │   │   └── varieties
│   │   │   └── transaction
│   │   │       ├── advisers
│   │   │       ├── evaluation_details
│   │   │       ├── evaluation_summaries
│   │   │       ├── final_assignment_decrees
│   │   │       ├── prerequisites
│   │   │       ├── schedules
│   │   │       └── submissions
│   │   ├── master
│   │   │   ├── images
│   │   │   └── students
│   │   └── reference
│   │       ├── finances
│   │       ├── registrations
│   │       ├── resign_statuses
│   │       ├── selection_types
│   │       └── statuses
│   └── survey
│       ├── master
│       │   ├── answers
│       │   ├── bundle_question
│       │   ├── bundles
│       │   └── questions
│       ├── reference
│       │   ├── bundle_categories
│       │   └── question_varieties
│       └── transaction
│           ├── conducts
│           └── responds
├── auth
│   ├── permission
│   ├── permission_role
│   ├── role
│   ├── user
│   └── verification
├── building
│   ├── master
│   │   ├── buildings
│   │   └── rooms
│   └── reference
│       ├── categories
│       ├── conditions
│       ├── room_types
│       └── varieties
├── burn
├── chart
├── contact
│   ├── master
│   │   ├── electronic_mails
│   │   ├── phones
│   │   ├── residences
│   │   └── websites
│   └── reference
│       ├── electronic_mail_types
│       ├── phone_types
│       ├── residence_types
│       └── website_types
├── document
│   ├── reference
│   │   └── archive_types
│   └── transaction
│       └── archives
├── feeder
│   ├── akumulasi
│   │   ├── estimasi
│   │   └── jumlah_data
│   ├── akun
│   │   └── kredential
│   ├── master
│   │   ├── aktifitas_kuliah_mahasiswa
│   │   ├── aktifitas_mahasiswa
│   │   ├── aktifitas_mengajar_dosen
│   │   ├── anggota_aktifitas_mahasiswa
│   │   ├── bidang_minat_perguruan_tinggi
│   │   ├── bimbing_mahasiswa
│   │   ├── biodata_dosen
│   │   ├── biodata_mahasiswa
│   │   ├── detail_nilai_perkuliahan_kelas
│   │   ├── dosen
│   │   ├── dosen_pembimbing
│   │   ├── dosen_pengajar_kelas_kuliah
│   │   ├── fakultas
│   │   ├── hitung_transkrip_angkatan_mahasiswa
│   │   ├── kartu_rencana_studi_mahasiswa
│   │   ├── kelas_kuliah
│   │   ├── komponen_evaluasi_kelas
│   │   ├── konsistensi_data
│   │   ├── konversi_kampus_merdeka
│   │   ├── kurikulum
│   │   ├── mahasiswa
│   │   ├── mahasiswa_bimbingan_dosen
│   │   ├── mahasiswa_lulusan_dropout
│   │   ├── matakuliah
│   │   ├── matakuliah_kurikulum
│   │   ├── nilai_perkuliahan_kelas
│   │   ├── nilai_transfer_pendidikan_mahasiswa
│   │   ├── penugasan_dosen
│   │   ├── perguruan_tinggi
│   │   ├── periode_aktif
│   │   ├── periode_perkuliahan
│   │   ├── perkuliahan_mahasiswa
│   │   ├── peserta_kelas_kuliah
│   │   ├── prestasi_mahasiswa
│   │   ├── profil_perguruan_tinggi
│   │   ├── program_studi
│   │   ├── rencana_evaluasi
│   │   ├── rencana_pembelajaran
│   │   ├── riwayat_fungsional_dosen
│   │   ├── riwayat_nilai_mahasiswa
│   │   ├── riwayat_pangkat_dosen
│   │   ├── riwayat_pendidikan_dosen
│   │   ├── riwayat_pendidikan_mahasiswa
│   │   ├── riwayat_penelitian_dosen
│   │   ├── riwayat_sertifikasi_dosen
│   │   ├── skala_nilai_program_studi
│   │   ├── substansi_matakuliah
│   │   ├── transkrip_mahasiswa
│   │   └── uji_mahasiswa
│   ├── referensi
│   │   ├── agama
│   │   ├── alat_transportasi
│   │   ├── bentuk_pendidikan
│   │   ├── ikatan_kerja_sumber_daya_manusia
│   │   ├── jabatan_fungsional
│   │   ├── jalur_masuk
│   │   ├── jenis_aktifitas_mahasiswa
│   │   ├── jenis_evaluasi
│   │   ├── jenis_keluar
│   │   ├── jenis_pendaftaran
│   │   ├── jenis_prestasi
│   │   ├── jenis_satuan_manajemen_sumberdaya
│   │   ├── jenis_sertifikasi
│   │   ├── jenis_substansi
│   │   ├── jenis_tinggal
│   │   ├── jenjang_pendidikan
│   │   ├── kategori_kegiatan
│   │   ├── kebutuhan_khusus
│   │   ├── lembaga_pengangkat
│   │   ├── level_wilayah
│   │   ├── negara
│   │   ├── pangkat_golongan
│   │   ├── pekerjaan
│   │   ├── pembiayaan
│   │   ├── penghasilan
│   │   ├── periode_lampau
│   │   ├── semester
│   │   ├── status_keaktifan_pegawai
│   │   ├── status_kepegawaian
│   │   ├── status_mahasiswa
│   │   ├── tahun_ajaran
│   │   ├── tingkat_prestasi
│   │   └── wilayah
│   └── rekapitulasi
│       ├── indeks_prestasi_sementara_mahasiswa
│       ├── jumlah_dosen
│       ├── jumlah_mahasiswa
│       ├── kartu_hasil_studi_mahasiswa
│       ├── kartu_rencana_studi_mahasiswa
│       └── laporan
├── general
│   └── reference
├── institution
│   ├── master
│   │   ├── employees
│   │   ├── institutions
│   │   ├── staffes
│   │   └── units
│   └── reference
│       ├── categories
│       ├── position_type
│       ├── unit_types
│       └── varieties
├── literate
│   ├── categories
│   ├── educations
│   ├── groups
│   ├── levels
│   └── varieties
├── location
│   ├── continents
│   ├── countries
│   ├── provinces
│   ├── regencies
│   ├── regency_types
│   ├── regions
│   ├── sub_districts
│   └── villages
├── payment
└── person
    ├── history
    ├── master
    │   ├── biodata
    │   └── individual
    └── reference
        ├── age_classification
        ├── blood_type
        ├── eye_color
        ├── gender
        ├── hair_color
        ├── hair_type
        ├── identification_type
        ├── income
        ├── marital_status
        ├── occupation
        ├── profession
        ├── relative_type
        └── religion
```
