# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti tables `feeder_master.biodata_dosen` and `feeder_master.dosen` to the Academic system tables `person_master.individuals` and `academic_lecturer_master.lecturers`. The task will read data from the local `feeder_master` schema, resolve reference data from `person_reference` and `academic_lecturer_reference`, and populate the `person_master` and `academic_lecturer_master` schemas.

> Supersedes the legacy job [upsert_biodata_dosen_and_dosen_to_individual_lecturer.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_biodata_dosen_and_dosen_to_individual_lecturer.rs). Reuse its mapping logic where it is still correct (see notes below).

## Data Findings (local DB snapshot)

- `feeder_master.biodata_dosen` = 77 rows, `feeder_master.dosen` = 76 rows.
- **Join key**: `biodata_dosen.id_dosen` (String) = `dosen.id_dosen::text` (Uuid). It does **NOT** match `dosen.id` (0 rows), even though the SeaORM relation in `biodata_dosen.rs` says `to = "id"`. Do not use that relation; query manually.
- 1 `biodata_dosen` row has no matching `dosen` (NIK `7371147001980001`). Create the individual and log it, but skip the lecturer.
- NIK is filled and unique for all 77 biodata rows. 76 already exist in `person_master.individuals.code`.
- `academic_lecturer_master.lecturers` has 195,089 rows. 6 `id_dosen` values already have **2 lecturer rows** each, so duplicates exist.
- `person_master.individuals` has 15 duplicate `code` values.
- Neither table has a unique index besides the PK, so SeaORM `on_conflict` cannot be used. Each upsert method finds the record first, then **inserts if it is missing** or **updates if it exists**.
- `dosen.nidn` is empty for 6 rows, `nuptk` for 12, and `nip` for 68.
- `feeder_master.penugasan_dosen` = 114 rows for 77 `id_dosen` (every dosen has at least 1; the most is 5). 34 dosen have **no** `apakah_homebase = true` row and 3 have 2. `mulai_surat_tugas` is a `DD-MM-YYYY` string. `id_tahun_ajaran` is always filled.
  - All rows share one `id_perguruan_tinggi`, which matches exactly 1 `institution_master.institutions.feeder_id`.
  - `id_ikatan_kerja`: `A`(54), `G`(40), `X`(16), `M`(2), empty(2). `A`/`G`/`X` match `academic_lecturer_reference.contracts.alphabet_code`; `M` has no match.
- `feeder_master.riwayat_fungsional_dosen` = 78 rows for 49 `id_dosen` (27 dosen have no rank history; the most for one dosen is 4). `mulai_sk_jabatan` is always filled.
  - `id_jabatan_fungsional` is a different random UUID on every row and `feeder_referensi.jabatan_fungsional` is empty, so match by **name** only. Names in the data: `Asisten Ahli`, `Lektor`, `Lektor Kepala`.
  - `academic_lecturer_reference.ranks` repeats each name under several codes (`Asisten Ahli` = 40/41, `Lektor` = 43/44, `Lektor Kepala` = 46/47/48).
- The `academic_lecturer_transaction` tables (`homebases`, `academic_ranks`, `academic_groups`) are **out of scope**. This task does not read or write them.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_02_biodata_dosen_and_dosen_to_individual_lecturer.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_02_biodata_dosen_and_dosen_to_individual_lecturer.rs)

- Implement a struct `SyncBiodataDosenToAcademicLecturerMasterLecturer` that implements the `crate::tasks::Task` trait. Follow the structure of [upsert_12](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_12_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs).
- **Preload reference tables once** before the loop into `HashMap`s, since they are small. Do not query them for every record:
  - `person_reference.genders`, `religions`, `marital_statuses`, `identification_types`
  - `academic_lecturer_reference.statuses`, `groups`, `contracts`, `ranks`
  - `institution_master.institutions` keyed by `feeder_id`
- **Preload the Feeder assignment/rank sources once** into `HashMap<Uuid /* id_dosen */, _>`, keeping only the current row per dosen (see [Reference Lookup Rules](#reference-lookup-rules)):
  - `feeder_master.penugasan_dosen` → current assignment
  - `feeder_master.riwayat_fungsional_dosen` → current rank
- Loop over `crate::models::feeder::master::biodata_dosen::Entity` in batches of 1000 (`order_by_asc(Id)`, `offset`/`limit`). Use one transaction per record.

#### Upsert Methods

Add a small result enum and two private async methods to the struct:

```rust
enum UpsertAction { Inserted, Updated }

async fn upsert_individual(
    txn: &DatabaseTransaction,
    record: &FeederBiodataDosen::Model,
    refs: &ReferenceCache,
) -> Result<(PersonIndividual::Model, UpsertAction), DbErr>;

async fn upsert_lecturer(
    txn: &DatabaseTransaction,
    individual: &PersonIndividual::Model,
    dosen: &FeederDosen::Model,
    biodata: &FeederBiodataDosen::Model,
    refs: &ReferenceCache,
) -> Result<(AcademicLecturer::Model, UpsertAction), DbErr>;
```

Both methods follow this pattern: **find the existing record → if `None`, `insert` a new `ActiveModel`; if `Some`, convert it with `into_active_model()`, set the synced fields, and `update`**.

##### `upsert_individual`

- **Find**: `person_master.individuals` WHERE `code = biodata_dosen.nik`.
  - If more than one row matches, pick the oldest (`order_by_asc(created_at)`) and write `DUPLICATE_INDIVIDUAL` to the log.
- **Synced fields** (set on both insert and update):
  - `code` = `nik`
  - `name` = `nama_dosen` (fallback `"Unknown"`)
  - `birth_date` = `tanggal_lahir` (fallback `1900-01-01`)
  - `birth_place` = `tempat_lahir` (fallback `"-"`)
  - `gender_id`, `religion_id`, `marital_status_id`, `identification_type_id` = resolved references
  - `sync_at` = now, `updated_at` = now
- **If the record does not exist → insert** with:
  - `id` = `Uuid::new_v4()`
  - the synced fields
  - `created_at` = now
  - `occupation_id`, `education_id`, `income_id`, `profession_id`, `age_classification_id` = nil UUID (column default)
  - the `is_*` flags = `false`
- **Otherwise → update** the synced fields only. Do **not** change the other FK fields or flags, so data maintained in XSIA is kept.

##### `upsert_lecturer`

- **Find**: `academic_lecturer_master.lecturers`, trying these in order:
  1. WHERE `id_dosen = dosen.id_dosen`. If more than one row matches, update **all** of them with the synced fields and write `DUPLICATE_LECTURER` to the log.
  2. Otherwise WHERE `individual_id = individual.id`.
  3. Otherwise WHERE `code = dosen.nidn` (only when NIDN is not empty).
- **Synced fields** (set on both insert and update):
  - `code` = first non-empty of `nidn` → `nuptk` → `nip` → `nik`. Never use `"UNKNOWN"`, because that collides across rows.
  - `name` = `dosen.nama_dosen`
  - `individual_id` = `individual.id`
  - `identification_number` = `dosen.nip`
  - `nuptk` = `dosen.nuptk`
  - `id_dosen` = `dosen.id_dosen`
  - `status_id` = resolved status
  - `group_id` = resolved group (`None` if not resolvable)
  - `id_registrasi_dosen` = current assignment `id_registrasi_dosen`
  - `institution_id` = resolved institution
  - `contract_id` = resolved contract
  - `rank_id` = resolved rank
  - `sync_at` = now, `updated_at` = now
- For `id_registrasi_dosen`, `institution_id`, `contract_id` and `rank_id`: when the source is missing (no assignment, no rank history), set `None` on insert. On update, **leave the existing value unchanged** rather than setting it to `NULL`.
- **If the record does not exist → insert** with:
  - `id` = `Uuid::new_v4()`
  - the synced fields
  - `created_at` = now
  - `front_title`, `last_title`, `start_date`, `end_date`, `alternative_code`, `accessor_number` = `None`
- **Otherwise → update** the synced fields only. Do **not** change the fields in the insert list above. They are maintained in XSIA.

#### Per-record Flow (`run`)

1. Begin the transaction.
2. **Resolve references** using the rules in the [Reference Lookup Rules](#reference-lookup-rules) section below.
3. Call `upsert_individual` and count the result as `individual_inserted` or `individual_updated`.
4. **Find dosen** in `feeder_master.dosen` WHERE `id_dosen = Uuid::parse(biodata_dosen.id_dosen)`.
   - If the UUID is invalid or no row is found, write `DOSEN_NOT_FOUND` to the log, count it as `lecturer_skipped`, commit, and continue.
5. Call `upsert_lecturer` and count the result as `lecturer_inserted` or `lecturer_updated`.
6. Commit, update the counters, and advance the progress bar.

#### Reference Lookup Rules

| Target field | Source | Lookup rule | Fallback |
| --- | --- | --- | --- |
| `individuals.gender_id` | `biodata_dosen.jenis_kelamin` (`L`/`P`) | `genders.alphabet_code = value` | `X` (Genderless, code 99) |
| `individuals.religion_id` | `biodata_dosen.nama_agama`, `id_agama` | 1) `LOWER(religions.name) = LOWER(nama_agama)` 2) `religions.code = id_agama::int`, but only for codes 1–6 | code `99` (Tidak Diisi) |
| `individuals.marital_status_id` | `biodata_dosen.status_pernikahan` (`0`/`1`/`2`) | `0` → `B` (Belum Menikah), `1` → `K` (Menikah), `2` → `D` (Duda) if gender is `L`, `J` (Janda) if gender is `P` (**confirmed**). Also accept the letters `B/K/D/J` directly. | `X` (Tidak Diisi) |
| `individuals.identification_type_id` | NIK is always used as the code | `identification_types.alphabet_code = 'A'` (Kartu Tanda Penduduk). Replaces the hardcoded UUID in the legacy job. | — |
| `lecturers.status_id` | `dosen.nama_status_aktif` | `UPPER(statuses.name) = UPPER(TRIM(nama_status_aktif))`. Matches `AKTIF`, `TIDAK AKTIF`, `IJIN BELAJAR`, `TUGAS BELAJAR`. | `LAINNYA` (code 12). Write `STATUS_FALLBACK` to the log. |
| `lecturers.group_id` | `biodata_dosen.id_pangkat_golongan`, `nama_pangkat_golongan` | 1) `groups.code = id_pangkat_golongan::int` (verified: 2/9/10/11 line up with the names) 2) `LOWER(groups.name) = LOWER(nama_pangkat_golongan)` | `None`. 65/77 rows are empty. |
| *current assignment* | `penugasan_dosen` WHERE `id_dosen = dosen.id_dosen` | Pick 1 row: `id_tahun_ajaran` DESC → `apakah_homebase = true` first → `mulai_surat_tugas` (parsed `%d-%m-%Y`) DESC. | No row → the 4 assignment fields use the missing-source rule. Write `ASSIGNMENT_NOT_FOUND` to the log. |
| `lecturers.id_registrasi_dosen` | current assignment `id_registrasi_dosen` | Copy as-is. | `None` |
| `lecturers.institution_id` | current assignment `id_perguruan_tinggi` | `institutions.feeder_id = id_perguruan_tinggi` | `None`. Write `REFERENCE_NOT_FOUND(institution_id)` to the log. |
| `lecturers.contract_id` | current assignment `id_ikatan_kerja` | `contracts.alphabet_code = UPPER(TRIM(id_ikatan_kerja))` | `X` (Lainnya, code 10) for `M` / empty / unknown. Write `CONTRACT_FALLBACK` to the log. |
| `lecturers.rank_id` | `riwayat_fungsional_dosen` WHERE `id_dosen = dosen.id_dosen`, latest `mulai_sk_jabatan` | `LOWER(ranks.name) = LOWER(TRIM(nama_jabatan_fungsional))`. Ignore `id_jabatan_fungsional`. If several codes share the name, take the **lowest** `code` (e.g. Asisten Ahli → 40). | No history (27 dosen) → missing-source rule. Name not found → `None` and write `REFERENCE_NOT_FOUND(rank_id)` to the log. |

> [!WARNING]
> Religion: Feeder `id_agama = 98` means **"Tidak diisi"**, but `person_reference.religions.code = 98` is **"Lainnya"**. A plain code match maps it to the wrong religion. That is why the plan matches on the name first and only accepts code matches for 1–6.

#### Logging & Progress

- Create `logs/sync_dosen_{YYYYmmdd_HHMMSS}.log`. Write one line per issue, tagged `DOSEN_NOT_FOUND`, `DUPLICATE_INDIVIDUAL`, `DUPLICATE_LECTURER`, `STATUS_FALLBACK`, `CONTRACT_FALLBACK`, `ASSIGNMENT_NOT_FOUND`, or `REFERENCE_NOT_FOUND(<field>)`, with the biodata `id`, `nik`, and `id_dosen`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with steady 100ms tick and message `"Counting feeder biodata_dosen records..."`.
    - Style: `ProgressStyle::default_spinner().template("{spinner:.green} [{elapsed_precise}] {msg}")`
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | lect_ins: {lecturer_inserted} | lect_upd: {lecturer_updated} | lect_skip: {lecturer_skipped} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - indiv_ins: {individual_inserted} | indiv_upd: {individual_updated} | lect_ins: {lecturer_inserted} | lect_upd: {lecturer_updated} | lect_skip: {lecturer_skipped} | errors: {errors} (see {log_file_path})")`
- If one record fails, roll back its transaction, write the error to the log, increment `errors`, and **continue**. Do not abort the whole run.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Module `upsert_02_biodata_dosen_and_dosen_to_individual_lecturer` is already exported. Only verify it.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register `Box::new(feeder_dikti::synchronize::downstream::master::upsert_02_biodata_dosen_and_dosen_to_individual_lecturer::SyncBiodataDosenToAcademicLecturerMasterLecturer)` in the task list, next to task 12.

## Resolved Decisions

1. **`status_pernikahan` encoding**: Confirmed `0` = Belum Menikah, `1` = Menikah, `2` = Duda (`L`) / Janda (`P`).
2. **Lecturer assignment/rank fields**: This task also reads `penugasan_dosen` and `riwayat_fungsional_dosen`, but **only** to fill `lecturers.id_registrasi_dosen`, `institution_id`, `contract_id` and `rank_id`. The `academic_lecturer_transaction` tables (`homebases`, `academic_ranks`, `academic_groups`) are not touched.
3. **Duplicate lecturers** (6 `id_dosen` with 2 rows each): Update every matching row and write `DUPLICATE_LECTURER` to the log.

## Verification Plan

### Automated Tests

- `cargo check` to ensure the mappings and SeaORM trait bounds are fully satisfied.
- `cargo clippy` with no new warnings.

### Manual Verification

- Run the task and check the summary against the expected counts: about 77 individuals (76 updated + 1 inserted), 76 lecturers upserted, and 1 `DOSEN_NOT_FOUND`.
- Spot-check with SQL:
  - `SELECT l.code, l.status_id, l.group_id, i.gender_id, i.religion_id FROM academic_lecturer_master.lecturers l JOIN person_master.individuals i ON i.id = l.individual_id JOIN feeder_master.dosen d ON d.id_dosen = l.id_dosen;` (no nil UUIDs for gender/religion, and every status is set)
  - The 2 dosen with `id_agama = 98` resolve to religion **Tidak Diisi** (code 99), not Lainnya.
  - All 76 lecturers have `institution_id`, `contract_id` and `id_registrasi_dosen` set, and the dosen with `id_ikatan_kerja = M` or empty get contract `X` (Lainnya).
  - The 49 dosen with rank history have `rank_id` set to the lowest-code match of their latest `nama_jabatan_fungsional`.
  - `SELECT count(*) FROM academic_lecturer_transaction.homebases` (and `academic_ranks`, `academic_groups`) is the same before and after the run.
- Run the task a second time. It must give **0 inserts** (idempotent).
- Review `logs/sync_dosen_*.log`.
