# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.aktifitas_mengajar_dosen` to the Academic system table `academic_campaign_transaction.teach_lecturers`. The task reads data from the local `feeder_master` schema, resolves relational dependencies across academic schemas (`courses`, `lecturers`, `academic_years`, `units`, `activities`, `class_codes`, `teaches`), and populates `academic_campaign_transaction.teach_lecturers`.

> Supersedes the legacy job [upsert_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs). Preserves its standard naming convention while adding composite fallback resolution, scoped reference caching, and fault-tolerant per-record transactions.

## Data Findings (local DB snapshot)

- `feeder_master.aktifitas_mengajar_dosen` = **1,637 rows**. All key FK fields (`id_matkul`, `id_dosen`, `id_registrasi_dosen`, `id_periode`, `id_prodi`, `id_kelas`, `nama_kelas_kuliah`) are 100% non-null.
- `academic_course_master.courses` = **1,637 / 1,637 (100%)** match via `courses.feeder_course_id = a.id_matkul`.
- `academic_general_reference.academic_years` = **1,637 / 1,637 (100%)** match via `academic_years.feeder_name = a.id_periode`.
- `institution_master.units` = **1,637 / 1,637 (100%)** match via `units.feeder_id = a.id_prodi`. Only 3 units are involved: Teknik Keselamatan, Gizi, Administrasi Rumah Sakit. All 3 belong to institution `092010`.
- `academic_campaign_transaction.activities` = **1,637 / 1,637 (100%)** match via `activities.unit_id = unit.id AND activities.academic_year_id = academic_year.id`. Activities have 0 duplicates per `(unit_id, academic_year_id)`.
- `academic_lecturer_master.lecturers` = **1,637 (100%)** match via `lecturers.id_dosen = a.id_dosen` (0 match by `id_registrasi_dosen`).
  - **Duplicate lecturers**: Exactly **6 `id_dosen` values** have **2 lecturer rows** each in `academic_lecturer_master.lecturers` (accounting for 88 rows in `aktifitas_mengajar_dosen`). Example: NIDN `0901059302`.
  - **SeaORM gotcha**: Using `.one(&txn)` on these 6 lecturers causes SeaORM to throw `DbErr::Query("Expected one result, found 2")`. The task must query deterministically (`order_by_asc(created_at)`) and select the primary row to prevent runtime aborts.
- `academic_campaign_transaction.teaches`:
  - **Direct match**: **1,492 rows** match directly by `teaches.feeder_id = a.id_kelas AND teaches.activity_id = unit_activity.id`.
    - **Duplicate teach feeder_id gotcha**: In `academic_campaign_transaction.teaches`, the value `feeder_id = 'b90db317-61b4-4b9e-a19b-8ca725be8b6f'` appears twice across two distinct activities (`13241` and `13211`). Without filtering by `activity_id = unit_activity.id`, SeaORM `.one(&txn)` throws `Expected one result, found 2`. Scoping by `activity_id` guarantees an exact 1-to-1 match.
  - **Fallback match**: Out of the remaining 145 rows, **81 rows** match via composite resolution: JOIN `teaches` with `class_codes` WHERE `teaches.course_id = course.id AND teaches.activity_id = unit_activity.id AND class_codes.alphabet_code = a.nama_kelas_kuliah`.
    - **Class codes semester mismatch gotcha**: A naive two-step lookup (`class_codes.activity_id = unit_activity.id`) returns 0 rows because `class_codes` records were historically created in semester `20251` and reused across subsequent semesters in `teaches`. Furthermore, querying `class_codes` by `unit_id` crashes SeaORM because 31 alphabet codes repeat up to 7 times per unit. Joining `teaches` directly with `class_codes` by `class_code_id` resolves all 81 rows with 100% precision and zero duplicates.
  - **Missing teaches**: Exactly **64 rows** (all in semester 20251: 45 in Teknik Keselamatan, 12 in Gizi, 7 in ARS) have no corresponding teach record in the database. These rows must be logged with rich contextual details (`TEACH_NOT_FOUND`) and skipped.
- `academic_campaign_transaction.teach_lecturers`:
  - Currently contains 1,709 rows.
  - The combination `(lecturer_id, teach_id)` is 100% unique (1,709 distinct pairs).
  - Out of the 1,573 resolvable rows: **1,564 are existing updates** and **9 are new inserts**. Running a second time yields 1,573 updates and 0 inserts (idempotent).

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_12_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_12_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs)

- Implement `SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap` to avoid N+1 query explosion (~15,000 DB roundtrips reduced to a handful):
  - `academic_years` keyed by `feeder_name: String`
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` scoped to the institution IDs referenced by `units` (avoiding loading all 18,802 institutions in the database)
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
- Iterate over `feeder_master.aktifitas_mengajar_dosen` in batches of 1,000 (`order_by_asc(Id)`, `offset`/`limit`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record without terminating the entire synchronization run.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_teach_lecturer(
    txn: &DatabaseTransaction,
    record: &FeederAktifitas::Model,
    lecturer: &AcademicLecturer::Model,
    teach: &AcademicTeach::Model,
    course: &AcademicCourse::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicTeachLecturer::Model, UpsertAction), DbErr>;
```

Follows the standard repository pattern: **find existing record → if `None`, `insert` new `ActiveModel`; if `Some`, convert with `into_active_model()`, assign synced fields, and `update`**.

##### `upsert_teach_lecturer`

- **Find**: `academic_campaign_transaction.teach_lecturers` WHERE `lecturer_id = lecturer.id AND teach_id = teach.id`.
- **Construct Standard Name**:
  Follow legacy format:

  ```rust
  let lecturer_code = if !lecturer.code.is_empty() {
      lecturer.code.as_str()
  } else {
      lecturer.nuptk.as_deref().unwrap_or("-")
  };
  let name = format!(
      "DosenAktifitasPengajaran {} {} {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      academic_year.feeder_name,
      course.code,
      lecturer_code
  );
  ```
  
- **Synced fields** (set on both insert and update):
  - `name`: `Some(name)`
  - `planning`: `record.rencana_minggu_pertemuan.unwrap_or(0)`
  - `realization`: `record.realisasi_minggu_pertemuan.unwrap_or(0)`
  - `credit`: `Some(Decimal::ZERO)`
  - `feeder_id`: `Some(record.id)`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `lecturer_id`: `lecturer.id`
  - `teach_id`: `teach.id`
  - `is_lecturer_home_base`: `false`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** the synced fields only. Do **not** overwrite `is_lecturer_home_base` or `created_at`.

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit & Year | `units`, `academic_years` | Lookup from preloaded memory cache: `units_by_feeder_id.get(&id_prodi)` and `years_by_feeder_name.get(&id_periode)`. | If not found, log `REFERENCE_NOT_FOUND` and skip record. |
| 2. Activity | `activities` | Lookup from preloaded cache: `activities_by_unit_and_year.get(&(unit.id, year.id))`. | If not found, log `ACTIVITY_NOT_FOUND` and skip record. |
| 3. Course | `courses` | Query `courses` WHERE `feeder_course_id = a.id_matkul`. | If not found, log `COURSE_NOT_FOUND` and skip record. |
| 4. Lecturer | `lecturers` | Query `lecturers` WHERE `id_dosen = a.id_dosen` (with `order_by_asc(created_at)`). Take the primary row. If none, try `id_registrasi_dosen = a.id_registrasi_dosen`. | If multiple rows match, log `DUPLICATE_LECTURER`. If none found, log `LECTURER_NOT_FOUND` and skip. |
| 5. Teach (Direct) | `teaches` | Query `teaches` WHERE `feeder_id = a.id_kelas AND activity_id = activity.id`. | If found, proceed to upsert. If `None`, proceed to Step 6 (Fallback). |
| 6. Teach (Fallback) | `teaches` & `class_codes` | Query `teaches` joined with `class_codes` ON `teaches.class_code_id = class_codes.id` WHERE `teaches.course_id = course.id AND teaches.activity_id = activity.id AND class_codes.alphabet_code = a.nama_kelas_kuliah`. | If still not found, write `TEACH_NOT_FOUND` with full context (`record_id`, `id_kelas`, `nama_dosen`, `nama_matkul`, `nama_kelas`, `id_periode`) to log file and increment `teach_not_found`. |

#### Per-record Flow (`run`)

1. Begin transaction for the record (`db.begin().await`).
2. Resolve `unit` and `academic_year` from `ReferenceCache`. If missing, log `REFERENCE_NOT_FOUND`, rollback, increment `skipped`, and continue.
3. Resolve `activity` from `ReferenceCache`. If missing, log `ACTIVITY_NOT_FOUND`, rollback, increment `skipped`, and continue.
4. Query `course` from `courses` by `feeder_course_id`. If missing, log `COURSE_NOT_FOUND`, rollback, increment `skipped`, and continue.
5. Query `lecturer` from `lecturers` by `id_dosen` with deterministic ordering (`order_by_asc(created_at)`). Check count: if > 1, log `DUPLICATE_LECTURER`. If missing, try `id_registrasi_dosen`. If still missing, log `LECTURER_NOT_FOUND`, rollback, increment `skipped`, and continue.
6. Resolve `teach`:
   - Try direct lookup by `feeder_id = a.id_kelas AND activity_id = activity.id`.
   - If not found, lookup via composite join: `teaches` JOIN `class_codes` ON `teaches.class_code_id = class_codes.id` WHERE `course_id = course.id AND activity_id = activity.id AND alphabet_code = a.nama_kelas_kuliah`.
   - If still not found, write `TEACH_NOT_FOUND` to log file with full record details, increment `teach_not_found`, rollback, and continue.
7. Call `upsert_teach_lecturer(&txn, &record, &lecturer, &teach, &course, &unit, institution, &academic_year)`.
8. Commit transaction, increment counter (`inserted` or `updated`), and update progress bar message.
9. If any unhandled `DbErr` occurs during processing of a record, roll back that transaction, write `ERROR` to log, increment `errors`, and continue to the next record.

#### Logging & Progress

- Create log file `logs/sync_teach_lecturers_{YYYYMMDD_HHMMSS}.log`.
- Log entries with structured tags:
  - `TEACH_NOT_FOUND`: When teach cannot be resolved directly or through fallback. Includes `id`, `id_kelas`, `nama_dosen`, `nama_mata_kuliah`, `nama_kelas_kuliah`, `id_periode`.
  - `LECTURER_NOT_FOUND`: When lecturer cannot be matched.
  - `COURSE_NOT_FOUND`: When course cannot be matched.
  - `DUPLICATE_LECTURER`: When more than one lecturer matches `id_dosen`.
  - `ERROR`: Any unhandled DB error for a record.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with steady 100ms tick and message `"Counting feeder aktifitas_mengajar_dosen records..."`.
    - Style: `ProgressStyle::default_spinner().template("{spinner:.green} [{elapsed_precise}] {msg}")`
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | teach_not_found: {teach_not_found} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | teach not found: {teach_not_found} | errors: {errors} (see {log_file_path})")`

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_12_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Task registered in `get_tasks()`:
  `Box::new(feeder_dikti::synchronize::downstream::master::upsert_12_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers::SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer)`

## Resolved Decisions

1. **Duplicate Lecturers (6 `id_dosen` with 2 rows)**:
   Sort by `order_by_asc(AcademicLecturer::Column::CreatedAt)` and take the first row with `.all()` / `.first()`. Write a `DUPLICATE_LECTURER` warning to the log file so operator can inspect the duplicate.
2. **Teach Direct Match Scoping**:
   Must filter by `activity_id = unit_activity.id` in addition to `feeder_id = a.id_kelas` to prevent SeaORM `.one()` errors caused by duplicate feeder IDs in `teaches`.
3. **Teach Fallback Join Resolution**:
   Join `teaches` with `class_codes` directly on `teaches.class_code_id = class_codes.id` WHERE `teaches.course_id = course.id AND teaches.activity_id = unit_activity.id AND class_codes.alphabet_code = a.nama_kelas_kuliah`. This avoids the historical semester mismatch in `class_codes.activity_id` and the multi-unit duplication in `class_codes.alphabet_code`.
4. **Structured Name Generation**:
   Adopt the legacy job pattern `"DosenAktifitasPengajaran {inst_code} {unit_code} {year_feeder_name} {course_code} {lecturer_code}"` to maintain data uniformity across the system.
5. **Reference Caching**:
   Preload static reference tables (`units`, `academic_years`, `institutions` scoped by unit, `activities`) into in-memory `HashMap` structures before processing batches.
6. **Fault Isolation**:
   Do not abort the entire batch on individual record errors. Roll back the single-record transaction, log the error, and continue.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to ensure all SeaORM queries, traits, and types compile without error.
- Verify module exports in `mod.rs` and registration in `tasks/mod.rs`.

### Manual Verification

- Run the task on the local database and verify counters:
  - Total records processed: **1,637**
  - Matched teaches: **1,573** (1,492 direct + 81 fallback)
  - `teach_not_found`: **64**
  - `inserted`: **9** (first run)
  - `updated`: **1,564** (first run)
  - `errors`: **0**
- Verify generated log file in `logs/sync_teach_lecturers_*.log`:
  - Contains precisely 64 `TEACH_NOT_FOUND` entries with full metadata.
  - Contains duplicate lecturer notices for the 6 known affected lecturers.
- SQL verification:
  - Check non-null `name`, `sync_at`, `updated_at`, `planning`, `realization`, `credit` in `academic_campaign_transaction.teach_lecturers`.
  - Verify that running the task a second time yields **0 inserts** and **1,573 updates** (idempotent run).
