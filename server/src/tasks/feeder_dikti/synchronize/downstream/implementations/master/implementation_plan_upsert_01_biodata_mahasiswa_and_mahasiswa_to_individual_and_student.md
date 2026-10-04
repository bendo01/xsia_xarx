# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti tables `feeder_master.biodata_mahasiswa` and `feeder_master.mahasiswa` to the Academic system tables `person_master.individuals` and `academic_student_master.students`. The task reads data from the local `feeder_master` schema, resolves reference data from `person_reference` and `academic_student_reference` (as well as `institution_master` and `academic_general_reference`), and populates the `person_master` and `academic_student_master` schemas.

> Supersedes the legacy job [upsert_biodata_mahasiswa_and_mahasiswa_to_individual_and_student.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_biodata_mahasiswa_and_mahasiswa_to_individual_and_student.rs). Reuse and refine its mapping logic where appropriate.

## Data Findings (local DB snapshot)

- `feeder_master.biodata_mahasiswa` = 708 rows, `feeder_master.mahasiswa` = 683 rows.
- **Join key**: `biodata_mahasiswa.id_mahasiswa` (Uuid) = `mahasiswa.id_mahasiswa` (Uuid). It does **NOT** match `mahasiswa.id` (0 rows), even though the SeaORM relation in [biodata_mahasiswa.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/models/feeder/master/biodata_mahasiswa.rs) states `to = "id"`. Do not use that generated relation; query manually.
- 25 `biodata_mahasiswa` rows have **no** matching `mahasiswa`. Create/update the individual record and log `MAHASISWA_NOT_FOUND`, but skip creating the student.
- NIK is filled for all 708 biodata rows. There are 706 distinct NIKs: 2 NIKs (`7324030112960001` and `7324034906060002`) appear twice in biodata with different `id_mahasiswa`. However, in `feeder_master.mahasiswa`, only 1 `id_mahasiswa` exists for each of those NIKs (the second `id_mahasiswa` is part of the 25 unmatched biodata rows).
- 684 distinct NIKs already exist in `person_master.individuals.code`, and 22 are missing (will be inserted).
- `academic_student_master.students` has 79,267 rows.
- **Data corruption in existing student records**: 2 feeder students (`8a4cf50a-5080-4da7-b914-ad7885c2cc97` and `782e6ab9-4ba2-4227-8679-191b6c9fa2a1`) each match 2 student rows in `academic_student_master.students` due to prior incorrect syncs (e.g. EGHI SETIAWAN and NUR FADILLAH shared `TK2401006` and the same `id_mahasiswa`). Disambiguation by `individual_id = individual.id` correctly identifies the true student record, while processing the second student subsequently heals the mismatched student record.
- Neither table (`individuals` nor `students`) has a unique index besides the PK (`id`), so SeaORM `on_conflict` cannot be used. Each upsert method finds the record first, then **inserts if missing** or **updates if existing**.
- `mahasiswa.nim` is filled and unique for 681 rows; 2 rows (`FARHAN DANI` and `SUMIATI`) have empty `nim`, null/nil `id_prodi`, and nil `id_registrasi_mahasiswa`.
- `feeder_master.riwayat_pendidikan_mahasiswa` = 683 rows (683 distinct `id_registrasi_mahasiswa`). Joining/caching by `id_registrasi_mahasiswa` (with fallback to `id_mahasiswa`) cleanly resolves:
  - `id_pembiayaan` (Mandiri=531, Beasiswa Tidak Penuh=2, Beasiswa Penuh=147, empty=3) -> matches `academic_student_reference.finances.code`.
  - `biaya_masuk` -> `finance_fee` (fallback `0.0`).
  - `id_jenis_daftar` (1=601 [Peserta didik baru], 2=1 [Pindahan], 16=81 [RPL Transfer SKS]) -> matches `academic_student_reference.registrations.alphabet_code`.
  - `id_jenis_keluar` (empty=590, 1=65 [Lulus], 5=28 [Putus Sekolah]) -> matches `academic_student_reference.resign_statuses.alphabet_code` (fallback `Uuid::nil()`).
- `feeder_master.mahasiswa.id_prodi`: 3 distinct prodis (`888d9adc...` [Teknik Keselamatan], `9709ab60...` [Administrasi Rumah Sakit], `ae68acd2...` [Gizi]) match `institution_master.units.feeder_id` 1-to-1.
- `feeder_master.mahasiswa.id_periode`: 7 distinct periods (`20201` to `20251`) match `academic_general_reference.academic_years.feeder_name` 1-to-1.
- `feeder_master.mahasiswa.nama_status_mahasiswa`: maps cleanly to `academic_student_reference.statuses.name` (`Aktif`=591, `Lulus`=65, `Putus Studi`=27).

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_01_biodata_mahasiswa_and_mahasiswa_to_individual_and_student.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_01_biodata_mahasiswa_and_mahasiswa_to_individual_and_student.rs)

- Implement a struct `SyncBiodataMahasiswaToAcademicStudentMasterStudent` implementing the `crate::tasks::Task` trait. Follow the structure of [upsert_12](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_12_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs).
- **Preload reference tables once** before the processing loop into memory (`HashMap`s) to avoid thousands of repetitive queries:
  - `person_reference.genders` (by `alphabet_code`)
  - `person_reference.religions` (by lowercase `name` and code `1..=6`)
  - `person_reference.identification_types` (lookup `alphabet_code = 'A'`)
  - `person_reference.occupations` (lookup `code = 12` / `alphabet_code = '99'`)
  - `academic_student_reference.statuses` (by lowercase `name`)
  - `academic_student_reference.registrations` (by `alphabet_code`)
  - `academic_student_reference.resign_statuses` (by `alphabet_code`)
  - `academic_student_reference.selection_types` (lookup `alphabet_code = 'L'` or `code = 12`)
  - `academic_student_reference.finances` (by `code`)
  - `institution_master.units` (by non-nil `feeder_id`)
  - `academic_general_reference.academic_years` (by non-empty `feeder_name`)
- **Preload Feeder Riwayat Pendidikan once** into `HashMap<Uuid /* id_registrasi_mahasiswa */, FeederRiwayatPendidikan::Model>` and secondary map by `id_mahasiswa`.
- Loop over `crate::models::feeder::master::biodata_mahasiswa::Entity` in batches of 1000 (`order_by_asc(Id)`, `offset`/`limit`).
- Process each record inside its own database transaction (`db.begin().await`).

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_individual(
    txn: &DatabaseTransaction,
    biodata: &FeederBiodataMahasiswa::Model,
    refs: &ReferenceCache,
) -> Result<(PersonIndividual::Model, UpsertAction), DbErr>;

async fn upsert_student(
    txn: &DatabaseTransaction,
    individual: &PersonIndividual::Model,
    mahasiswa: &FeederMahasiswa::Model,
    biodata: &FeederBiodataMahasiswa::Model,
    riwayat: Option<&FeederRiwayatPendidikan::Model>,
    refs: &ReferenceCache,
) -> Result<(AcademicStudent::Model, UpsertAction), DbErr>;
```

Both methods follow the standard repository pattern: **find the existing record → if `None`, `insert` a new `ActiveModel`; if `Some`, convert with `into_active_model()`, assign synced fields, and `update`**.

##### `upsert_individual`

- **Find**: `person_master.individuals` WHERE `code = biodata_mahasiswa.nik`.
  - If more than one row matches, select the oldest (`order_by_asc(created_at)`) and write `DUPLICATE_INDIVIDUAL` to the log.
- **Synced fields** (set on both insert and update):
  - `code` = `biodata.nik`
  - `name` = `biodata.nama_mahasiswa` (fallback `"Unknown"`)
  - `birth_date` = `biodata.tanggal_lahir` (fallback `1900-01-01`)
  - `birth_place` = `biodata.tempat_lahir` (fallback `"-"`)
  - `gender_id` = resolved gender reference
  - `religion_id` = resolved religion reference
  - `is_social_protection_card_recipient` = `biodata.penerima_kps.unwrap_or(false)`
  - `sync_at` = now, `updated_at` = now
- **If record does not exist → insert** with:
  - `id` = `Uuid::new_v4()`
  - Synced fields
  - `created_at` = now
  - `identification_type_id` = resolved KTP (`alphabet_code = 'A'`)
  - `occupation_id` = resolved "Lainnya" or nil UUID
  - `marital_status_id`, `education_id`, `income_id`, `profession_id`, `age_classification_id` = nil UUID (`00000000-0000-0000-0000-000000000000`)
  - `is_special_need` = `false`, `is_deceased` = `false`
  - `front_title`, `last_title` = `None`
- **Otherwise → update** the synced fields only. Do **not** overwrite the other FK fields, marital status, or flags maintained in XSIA.

##### `upsert_student`

- **Find**: `academic_student_master.students`, trying these criteria in order:
  1. WHERE `id_mahasiswa = mahasiswa.id_mahasiswa AND individual_id = individual.id` (exact match).
  2. Otherwise WHERE `id_mahasiswa = mahasiswa.id_mahasiswa`. If multiple rows match, pick the one where `individual_id = individual.id` (or oldest `created_at`), update it, and write `DUPLICATE_STUDENT_ID_MAHASISWA` to the log.
  3. Otherwise WHERE `id_registrasi_mahasiswa = mahasiswa.id_registrasi_mahasiswa` (only when `id_registrasi_mahasiswa` is Some and non-nil).
  4. Otherwise WHERE `individual_id = individual.id AND code = mahasiswa.nim` (only when `nim` is non-empty and not `"UNKNOWN"`).
  5. Otherwise WHERE `code = mahasiswa.nim` (only when `nim` is non-empty and not `"UNKNOWN"`).
  6. Otherwise WHERE `individual_id = individual.id` (only if exactly 1 student record exists for this individual).
- **Synced fields** (set on both insert and update):
  - `name` = `mahasiswa.nama_mahasiswa` (fallback to `biodata.nama_mahasiswa`, fallback `"Unknown"`)
  - `individual_id` = `individual.id`
  - `status_id` = resolved status reference
  - `unit_id` = resolved unit (if unresolvable or nil prodi, preserve existing value on update; set fallback on insert)
  - `academic_year_id` = resolved academic year (if unresolvable, preserve existing value on update; set fallback on insert)
  - `id_mahasiswa` = `mahasiswa.id_mahasiswa`
  - `id_registrasi_mahasiswa` = `mahasiswa.id_registrasi_mahasiswa`
  - `nisn` = cleaned `biodata.nisn` (set to `None` if empty, whitespace, or `"0000000000"`)
  - `registration_id` = resolved registration from `riwayat` (preserve existing on update if `riwayat` is absent)
  - `resign_status_id` = resolved resign status from `riwayat` (or `Uuid::nil()`)
  - `finance_id` = resolved finance from `riwayat` (or `Uuid::nil()`)
  - `finance_fee` = `riwayat.biaya_masuk` as `f64` (fallback `0.0`)
  - `sync_at` = now, `updated_at` = now
  - `code`: On update, only update `code` if `mahasiswa.nim` is non-empty. Never overwrite an existing valid code with empty string or `"UNKNOWN"`.
- **If record does not exist → insert** with:
  - `id` = `Uuid::new_v4()`
  - `code` = first non-empty of `mahasiswa.nim` → `biodata.nik` → generated fallback. Never use `"UNKNOWN"` across rows to avoid collisions.
  - Synced fields
  - `registered` = `academic_year.start_date.unwrap_or_else(|| chrono::Utc::now().date_naive())`
  - `selection_type_id` = resolved Seleksi Mandiri (`alphabet_code = 'L'`)
  - `curriculum_id`, `class_code_id`, `concentration_id`, `transfer_unit_id` = nil UUID (`00000000-0000-0000-0000-000000000000`)
  - `transfer_code` = `None`
  - `created_at` = now
  - `deleted_at`, `created_by`, `updated_by` = `None`
- **Otherwise → update** the synced fields only. Do **not** overwrite `curriculum_id`, `class_code_id`, `concentration_id`, `selection_type_id`, `transfer_unit_id`, or `registered`, preserving operational data managed inside XSIA.

#### Per-record Flow (`run`)

1. Begin transaction (`let txn = db.begin().await?`).
2. Call `upsert_individual`. Track as `individual_inserted` or `individual_updated`.
3. Locate `feeder_master.mahasiswa` WHERE `id_mahasiswa = biodata.id_mahasiswa`.
   - If not found or `biodata.id_mahasiswa` is `None`: write `MAHASISWA_NOT_FOUND` to the log, increment `student_skipped`, commit the individual transaction, and continue.
4. Retrieve corresponding `feeder_master.riwayat_pendidikan_mahasiswa` from cache (by `id_registrasi_mahasiswa` or `id_mahasiswa`).
5. Call `upsert_student`. Track as `student_inserted` or `student_updated`.
6. Commit transaction (`txn.commit().await?`).
7. Update progress bar message with live counters.
8. If an error occurs on a record: roll back transaction, log error with student context (NIK, NIM, names), increment `errors`, and continue loop.

#### Reference Lookup Rules

| Target field | Source | Lookup rule | Fallback |
| --- | --- | --- | --- |
| `individuals.gender_id` | `biodata.jenis_kelamin` (`L`/`P`) | `genders.alphabet_code = value` | `X` (Genderless, code 99) |
| `individuals.religion_id` | `biodata.nama_agama`, `id_agama` | 1) `LOWER(religions.name) = LOWER(nama_agama)` 2) `religions.code = id_agama::int`, but only for codes 1–6 | code `99` (Tidak Diisi) |
| `individuals.identification_type_id` | NIK | `identification_types.alphabet_code = 'A'` (Kartu Tanda Penduduk) | Nil UUID |
| `individuals.occupation_id` | Default for student | `occupations.alphabet_code = '99'` or `code = 12` (Lainnya) | Nil UUID |
| `students.status_id` | `mahasiswa.nama_status_mahasiswa` | `LOWER(statuses.name) = LOWER(TRIM(nama_status_mahasiswa))` | `X` (Tidak Diketahui, code 7). Log `STATUS_FALLBACK`. |
| `students.unit_id` | `mahasiswa.id_prodi` | `units.feeder_id = id_prodi` (where `id_prodi != nil`) | On update: preserve existing. On insert: log `PRODI_NOT_FOUND` and fallback to default unit or nil UUID. |
| `students.academic_year_id` | `mahasiswa.id_periode` | `academic_years.feeder_name = id_periode` | On update: preserve existing. On insert: log `ACADEMIC_YEAR_NOT_FOUND` and fallback to default academic year or nil UUID. |
| `students.registration_id` | `riwayat.id_jenis_daftar` | `registrations.alphabet_code = id_jenis_daftar::text` | On update: preserve existing. On insert: `1` (Peserta didik baru). Log `REGISTRATION_FALLBACK`. |
| `students.resign_status_id` | `riwayat.id_jenis_keluar` | `resign_statuses.alphabet_code = id_jenis_keluar::text` | Nil UUID (`00000000-0000-0000-0000-000000000000`) when null/empty. |
| `students.finance_id` | `riwayat.id_pembiayaan` | `finances.code = id_pembiayaan` | Nil UUID. |
| `students.finance_fee` | `riwayat.biaya_masuk` | `biaya_masuk as f64` | `0.0` |
| `students.selection_type_id` | Initial enrollment default | `selection_types.alphabet_code = 'L'` (Seleksi Mandiri, code 12) | Nil UUID. |

> [!WARNING]
> Feeder Religion mapping: Feeder `id_agama = 98` signifies **"Tidak diisi"**, whereas `person_reference.religions.code = 98` is **"Lainnya"** and code `99` is **"Tidak Diisi"**. A naive code match would misassign religious records. The lookup logic matches on `LOWER(name)` first and only falls back to code matching for codes 1–6.

#### Logging & Progress

- Create log file `logs/sync_student_{YYYYmmdd_HHMMSS}.log`.
- Record log entries tagged with:
  - `MAHASISWA_NOT_FOUND`: Biodata record has no corresponding Feeder Mahasiswa row (expected ~25 records).
  - `DUPLICATE_INDIVIDUAL`: Multiple individuals share the same NIK code.
  - `DUPLICATE_STUDENT_ID_MAHASISWA`: Multiple student records match the same `id_mahasiswa`.
  - `STATUS_FALLBACK`: Status name did not match reference tables.
  - `PRODI_NOT_FOUND`: Unit not found for `id_prodi`.
  - `ACADEMIC_YEAR_NOT_FOUND`: Academic year not found for `id_periode`.
  - `REFERENCE_NOT_FOUND(<field>)`: Generic unresolved reference.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with steady 100ms tick and message `"Counting feeder biodata_mahasiswa records..."`.
    - Style: `ProgressStyle::default_spinner().template("{spinner:.green} [{elapsed_precise}] {msg}")`
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | stud_ins: {student_inserted} | stud_upd: {student_updated} | stud_skip: {student_skipped} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | stud_ins: {student_inserted} | stud_upd: {student_updated} | stud_skip: {student_skipped} | errors: {errors} (see {log_file_path})")`

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register `Box::new(feeder_dikti::synchronize::downstream::master::upsert_01_biodata_mahasiswa_and_mahasiswa_to_individual_and_student::SyncBiodataMahasiswaToAcademicStudentMasterStudent)` inside `get_tasks()`.

## Resolved Decisions

1. **Relation between `biodata_mahasiswa` and `mahasiswa`**: The generated SeaORM relation in `biodata_mahasiswa.rs` matches `to = "id"`, which produces 0 matches. The actual foreign key is `biodata_mahasiswa.id_mahasiswa = mahasiswa.id_mahasiswa`. All queries must explicitly join or filter by `id_mahasiswa`.
2. **25 Unmatched Biodata records**: Biodata records without a matching `mahasiswa` will have their `person_master.individuals` record upserted, while student upsert is skipped and counted as `student_skipped`.
3. **Healing existing duplicate student IDs**: Mismatched students sharing `id_mahasiswa` are disambiguated by matching `individual_id = individual.id`. When the other individual is subsequently synced, its student record is corrected with its proper `id_mahasiswa` and `code`.
4. **Preservation of XSIA operational data**: On update, curricular assignments (`curriculum_id`, `class_code_id`, `concentration_id`), transfer configurations, and XSIA-managed individual fields (marital status, education, profession) are never overwritten.
5. **Code (NIM) collision protection**: On update, if `mahasiswa.nim` is empty, existing `code` is preserved. On insert, fallback to `biodata.nik` prevents collisions.

## Verification Plan

### Automated Verification

- `cargo check`: Ensure trait implementations, SeaORM query filters, and type conversions compile cleanly.
- `cargo clippy`: Verify no new lints or warnings are introduced.

### Manual Verification

- Run the task and verify the terminal summary:
  - Total records processed: ~708
  - `individual_updated`: ~684, `individual_inserted`: ~22
  - `student_skipped`: ~25 (due to `MAHASISWA_NOT_FOUND`)
  - `student_updated` + `student_inserted`: ~683
- Database SQL verification:
  - Check that no nil UUIDs exist in `students.status_id`, `students.individual_id`, or `individuals.gender_id`.
  - Validate prodi unit mapping:

    ```sql
    SELECT s.code, s.name, u.name as unit_name, ay.name as academic_year
    FROM academic_student_master.students s
    JOIN institution_master.units u ON u.id = s.unit_id
    JOIN academic_general_reference.academic_years ay ON ay.id = s.academic_year_id
    WHERE s.id_mahasiswa IS NOT NULL
    LIMIT 10;
    ```
  
  - Verify that dummy students with empty NIM (`FARHAN DANI`, `SUMIATI`) do not corrupt existing codes.
- **Idempotency check**: Run the task a second time immediately. It must result in **0 inserts** (`individual_inserted: 0`, `student_inserted: 0`).
- Review generated log in `logs/sync_student_*.log`.
