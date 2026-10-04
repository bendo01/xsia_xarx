# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.kelas_kuliah` to the Academic system table `academic_campaign_transaction.teaches`. The task reads course classes from the local `feeder_master` schema, resolves relational dependencies across schemas (`units`, `academic_years`, `institutions`, `activities`, `courses`, `class_codes`, `teach_decrees`, `scopes`), creates missing prerequisites, and populates `academic_campaign_transaction.teaches`.

> Supersedes the legacy job [upsert_kelas_kuliah_to_academic_campaign_transaction_teaches.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_kelas_kuliah_to_academic_campaign_transaction_teaches.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.kelas_kuliah` = **1,438 rows**. All key FK fields (`id_kelas_kuliah`, `id_prodi`, `id_semester`, `id_matkul`, `nama_kelas_kuliah`) are 100% non-null.
- `institution_master.units` = **1,438 / 1,438 (100%)** match via `units.feeder_id = k.id_prodi`. Only 3 units: Teknik Keselamatan, Gizi, Administrasi Rumah Sakit. All belong to institution `092010`.
- `academic_general_reference.academic_years` = **1,438 / 1,438 (100%)** match via `academic_years.feeder_name = k.id_semester`.
- `academic_campaign_transaction.activities` = **1,438 / 1,438 (100%)** match via `activities.unit_id = unit.id AND activities.academic_year_id = academic_year.id`.
- `academic_course_master.courses` = **1,438 / 1,438 (100%)** match via `courses.feeder_course_id = k.id_matkul`.
- `academic_campaign_transaction.teaches`:
  - **Direct match**: **1,228 rows** match directly by `teaches.feeder_id = k.id_kelas_kuliah AND teaches.activity_id = activity.id`.
  - **Composite fallback match**: **131 rows** match via composite resolution: `teaches.course_id = course.id AND teaches.activity_id = activity.id AND teaches.class_code_id IN (class_code_ids_for_nama_kelas)`.
  - **New Inserts**: Exactly **79 rows** represent new course classes that do not yet exist in `teaches` and will be inserted.
  - Total resolvable: 1,438 / 1,438 (100%). Running a second time yields 1,438 updates and 0 inserts (idempotent run).
- **Prerequisite Dependencies**:
  - `scopes`: Single static scope `"Internal"`.
  - `teach_decrees`: Required non-null FK `teach_decree_id`. Preload or resolve per `activity.id`; if missing, create default teach decree for that activity.
  - `class_codes`: Required non-null FK `class_code_id`. Resolve by `alphabet_code = k.nama_kelas_kuliah AND unit_id = unit.id`. If missing, auto-create class code record under current activity.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches.rs)

- Implement `SyncKelasKuliahToAcademicTransactionTeaches` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap` to avoid N+1 query explosion:
  - `academic_years` keyed by `feeder_name: String`
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` scoped to institution IDs referenced by units
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
  - `internal_scope`: Cached `scopes::Model`
  - `teach_decrees` keyed by `activity_id: Uuid`
- Iterate over `feeder_master.kelas_kuliah` in batches of 1,000 (`order_by_asc(IdKelasKuliah)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record without terminating the entire synchronization run.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    internal_scope_id: Uuid,
    decrees_by_activity_id: HashMap<Uuid, Uuid>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_teach(
    txn: &DatabaseTransaction,
    record: &FeederKelasKuliah::Model,
    course: &AcademicCourse::Model,
    activity: &AcademicActivity::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
    class_code_id: Uuid,
    teach_decree_id: Uuid,
    scope_id: Uuid,
) -> Result<(AcademicTeach::Model, UpsertAction), sea_orm::DbErr>;
```

Follows the standard repository pattern: **find existing record → if `None`, `insert` new `ActiveModel`; if `Some`, convert with `into_active_model()`, assign synced fields, and `update`**.

##### `upsert_teach`

- **Find**:
  1. Direct match: `academic_campaign_transaction.teaches` WHERE `feeder_id = record.id_kelas_kuliah AND activity_id = activity.id`.
  2. Fallback match: `teaches` WHERE `course_id = course.id AND activity_id = activity.id AND class_code_id = class_code_id`.
- **Construct Standard Name**:
  Follow legacy format:

  ```rust
  let name = format!(
      "AktifitasPengajaran {} {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      academic_year.feeder_name,
      course.code
  );
  ```
  
- **Synced fields** (set on both insert and update):
  - `name`: `Some(name)`
  - `max_member`: `record.kapasitas.or(Some(0))`
  - `start_date`: `record.tanggal_mulai_efektif`
  - `end_date`: `record.tanggal_akhir_efektif`
  - `description`: `record.bahasan.clone()`
  - `feeder_id`: `Some(record.id_kelas_kuliah)`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `class_code_id`: `class_code_id`
  - `course_id`: `course.id`
  - `activity_id`: `Some(activity.id)`
  - `teach_decree_id`: `teach_decree_id`
  - `scope_id`: `Some(scope_id)`
  - `is_lock`: `Some(false)`
  - `is_lecturer_credit_sum_problem`: `Some(false)`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** the synced fields only. Do **not** overwrite `is_lock` or `created_at`.

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit & Year | `units`, `academic_years` | Lookup from preloaded cache: `units_by_feeder_id.get(&id_prodi)` and `years_by_feeder_name.get(&id_semester)`. | If not found, log `REFERENCE_NOT_FOUND` and skip record. |
| 2. Activity | `activities` | Lookup from preloaded cache: `activities_by_unit_and_year.get(&(unit.id, year.id))`. | If not found, log `ACTIVITY_NOT_FOUND` and skip record. |
| 3. Course | `courses` | Query `courses` WHERE `feeder_course_id = record.id_matkul`. | If not found, log `COURSE_NOT_FOUND` and skip record. |
| 4. Class Code | `class_codes` | Query `class_codes` WHERE `alphabet_code = record.nama_kelas_kuliah AND unit_id = unit.id`. | If not found, auto-insert new `class_code` record for unit & activity. |
| 5. Teach Decree | `teach_decrees` | Lookup from cache or query WHERE `activity_id = activity.id`. | If not found, auto-insert default `teach_decree` record. |
| 6. Teach | `teaches` | 1) Direct: `feeder_id = record.id_kelas_kuliah AND activity_id = activity.id`. 2) Fallback: `class_code_id = class_code.id AND course_id = course.id AND activity_id = activity.id`. | If found: update; if not found: insert. |

#### Per-record Flow (`run`)

1. Begin transaction for the record (`db.begin().await`).
2. Resolve `unit` and `academic_year` from `ReferenceCache`. If missing, log `REFERENCE_NOT_FOUND`, rollback, increment `skipped`, and continue.
3. Resolve `activity` from `ReferenceCache`. If missing, log `ACTIVITY_NOT_FOUND`, rollback, increment `skipped`, and continue.
4. Query `course` from `courses` by `feeder_course_id`. If missing, log `COURSE_NOT_FOUND`, rollback, increment `skipped`, and continue.
5. Resolve or auto-create `class_code` for `record.nama_kelas_kuliah`.
6. Resolve or auto-create `teach_decree` for `activity.id`.
7. Call `upsert_teach(&txn, &record, &course, &activity, unit, institution, academic_year, class_code.id, teach_decree_id, scope_id)`.
8. Commit transaction, increment counter (`inserted` or `updated`), and update progress bar message.
9. If any unhandled `DbErr` occurs during processing of a record, roll back that transaction, write `ERROR` to log, increment `errors`, and continue to the next record.

#### Logging & Progress

- Create log file `logs/sync_kelas_kuliah_{YYYYMMDD_HHMMSS}.log`.
- Log entries with structured tags:
  - `REFERENCE_NOT_FOUND`: When unit or year is missing.
  - `ACTIVITY_NOT_FOUND`: When activity is missing.
  - `COURSE_NOT_FOUND`: When course is missing.
  - `ERROR`: Any unhandled DB error for a record.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with message `"Counting feeder kelas_kuliah records..."`.
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`:
  `Box::new(feeder_dikti::synchronize::downstream::master::upsert_11_kelas_kuliah_to_academic_campaign_transaction_teaches::SyncKelasKuliahToAcademicTransactionTeaches)`

## Resolved Decisions

1. **Activity-Scoped Direct Resolution**: Query direct match with both `feeder_id = record.id_kelas_kuliah AND activity_id = activity.id` to prevent `.one()` errors from duplicate feeder IDs in `teaches`.
2. **Auto-provisioning Prerequisites**: If a semester activity lacks an associated `teach_decree` or `class_code`, provision them within the record transaction so that teach insertion never fails due to missing FKs.
3. **Structured Name Generation**: Maintain the legacy format `"AktifitasPengajaran {inst_code} {unit_code} {feeder_year} {course_code}"`.
4. **Reference Caching**: Preload units, years, referenced institutions, activities, scope, and decrees into memory once before processing batches.
5. **Fault Isolation**: Single record errors roll back that record's transaction and do not terminate the synchronization run.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task on the local database and verify counters:
  - Total records processed: **1,438**
  - `inserted`: **~79** (first run)
  - `updated`: **~1,359** (first run)
  - `errors`: **0**
- Verify generated log file in `logs/sync_kelas_kuliah_*.log`.
- Verify database fields `name`, `max_member`, `start_date`, `end_date`, `feeder_id`, `sync_at` in `academic_campaign_transaction.teaches`.
