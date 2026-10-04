# Deskripsi Capaian

Implement a master sequential orchestrator task `SyncAllMasterData` (`upsert_00_all`) to execute all 22 downstream master synchronization tasks (`upsert_01` to `upsert_22`) in the exact order demanded by database foreign key constraints and relational dependencies.

## Architecture & Relational Execution Order

The execution sequence strictly follows the Directed Acyclic Graph (DAG) tiers:

1. **Tier 1: Master Identity & Core Reference**
   - `01`: `SyncBiodataMahasiswaToAcademicStudentMasterStudent` (`feeder_master.biodata_mahasiswa`, `mahasiswa` -> `person_master.individuals`, `academic_student_master.students`)
   - `02`: `SyncBiodataDosenToAcademicLecturerMasterLecturer` (`feeder_master.biodata_dosen`, `dosen` -> `person_master.individuals`, `academic_lecturer_master.lecturers`)
   - `03`: `SyncPeriodePerkuliahanToAcademicTransactionActivities` (`feeder_master.periode_perkuliahan` -> `academic_campaign_transaction.activities`)
   - `04`: `SyncSkalaNilaiProdiToAcademicTransactionGrades` (`feeder_master.skala_nilai_prodi` -> `academic_campaign_transaction.grades`)
   - `05`: `SyncMatakuliahToAcademicCourseMasterCourse` (`feeder_master.matakuliah` -> `academic_course_master.courses`)

2. **Tier 2: Kurikulum & Perencanaan Matakuliah**
   - `06`: `SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails` (`feeder_master.kurikulum`, `matkul_kurikulum` -> `academic_course_master.curriculums`, `curriculum_details`)
   - `07`: `SyncRencanaEvaluasiToCourseEvaluationPlannings` (`feeder_master.rencana_evaluasi` -> `academic_course_master.course_evaluation_plannings`)
   - `08`: `SyncRencanaPembelajaranToCourseLearnPlannings` (`feeder_master.rencana_pembelajaran` -> `academic_course_master.course_learn_plannings`)

3. **Tier 3: Kode Kelas Perkuliahan**
   - `09`: `SyncKelasKuliahToAcademicCampaignTransactionClassCode` (`feeder_master.kelas_kuliah` -> `academic_campaign_transaction.class_codes`)
   - `10`: `SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode` (`feeder_master.krs` -> `academic_campaign_transaction.class_codes`)

4. **Tier 4: Kelas Perkuliahan (Teaches)**
   - `11`: `SyncKelasKuliahToAcademicTransactionTeaches` (`feeder_master.kelas_kuliah` -> `academic_campaign_transaction.teaches`)
   - `12`: `SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches` (`feeder_master.krs` -> `academic_campaign_transaction.teaches`)
   - `13`: `SyncNilaiPerkuliahanKelasToTransactionTeaches` (`feeder_master.nilai_perkuliahan_kelas` -> `academic_campaign_transaction.teaches` metrics)

5. **Tier 5: Relasi Kelas Perkuliahan**
   - `14`: `SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer` (`feeder_master.aktifitas_mengajar_dosen` -> `academic_campaign_transaction.teach_lecturers`)
   - `15`: `SyncKomponenEvaluasiKelasToTeachEvaluations` (`feeder_master.komponen_evaluasi_kelas` -> `academic_campaign_transaction.teach_evaluations`)

6. **Tier 6: Aktivitas Semester & Konversi**
   - `16`: `SyncPerkuliahanMahasiswaToAcademicStudentActivities` (`feeder_master.perkuliahan_mahasiswa` -> `academic_student_campaign.student_activities`)
   - `17`: `SyncNilaiTransferPendidikanMahasiswaToConvertions` (`feeder_master.nilai_transfer_pendidikan` -> `academic_student_campaign.convertions`)

7. **Tier 7: KRS & Nilai Mahasiswa**
   - `18`: `SyncKartuRencanaStudiMahasiswaToDetailActivities` (`feeder_master.krs` -> `academic_student_campaign.detail_activities`)
   - `19`: `SyncPesertaKelasKuliahToDetailActivities` (`feeder_master.peserta_kelas_kuliah` -> `academic_student_campaign.detail_activities`)
   - `20`: `SyncNilaiPerkuliahanKelasToDetailActivities` (`feeder_master.detail_nilai_perkuliahan_kelas` -> `academic_student_campaign.detail_activities` grades)

8. **Tier 8: Detail Kontak Individu**
   - `21`: `SyncBiodataMahasiswaToContactDetails` (`feeder_master.biodata_mahasiswa` -> `contact_master.phones`, `electronic_mails`, `residences`)
   - `22`: `SyncBiodataDosenToContactDetails` (`feeder_master.biodata_dosen` -> `contact_master.phones`, `electronic_mails`, `residences`)

## CLI Flags & Options

The master task supports several orchestrator options:

- `--fail-fast`: Abort pipeline execution immediately upon the first failure.
- `--start-from <N|task_name>`: Skip preceding tasks and start execution from a specified step (e.g. `--start-from 14` or `--start-from SyncAktifitasMengajar...`).
- `--only <N|task_name>`: Run only a single targeted task (e.g. `--only 21`).
- Sub-task arguments: Any additional flags such as `--no-progress` or `false` are automatically forwarded to each sub-task.

## Verification Plan

### Automated Checks

- `cargo check --bin xsia_xarx` to verify all traits, async bounds, and exports.

### Manual Verification

- Execute `cargo run -- task SyncAllMasterData` or targeted subsets to inspect step-by-step logging and live timing.
