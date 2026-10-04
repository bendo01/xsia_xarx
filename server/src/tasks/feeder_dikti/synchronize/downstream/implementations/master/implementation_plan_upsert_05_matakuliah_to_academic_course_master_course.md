# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.matakuliah` to the Academic system table `academic_course_master.courses`. The task reads courses from the local `feeder_master` schema, resolves academic units from `institution_master.units`, maps course classifications, and populates `academic_course_master.courses`.

> Supersedes the legacy job [upsert_matakuliah_to_academic_course_master_course.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_matakuliah_to_academic_course_master_course.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.matakuliah` = **348 rows**. Key FK fields (`id_matkul`, `id_prodi`, `kode_mata_kuliah`, `nama_mata_kuliah`) are 100% non-null.
- `institution_master.units` = **348 / 348 (100%)** match via `units.feeder_id = m.id_prodi`.
- `academic_course_master.courses` = **348 / 348 (100%)** match directly via `courses.feeder_course_id = m.id_matkul`.
- **Target Table Uniqueness**: Matching by `feeder_course_id = m.id_matkul` is 100% unique. Fallback lookup by `code = m.kode_mata_kuliah AND unit_id = unit.id` is also available. All 348 rows will be updated; running a second time yields 348 updates and 0 inserts (idempotent run).
- **Credit & Curriculum Flags**:
  - `sks_mata_kuliah` -> maps to `total_credit` (double precision, fallback 0.0).
  - `sks_tatap_muka` -> maps to `lecture_credit` (double precision, fallback 0.0).
  - `sks_praktek` -> maps to `practice_credit` (double precision, fallback 0.0).
  - `sks_praktek_lapangan` -> maps to `field_practice_credit` (double precision, fallback 0.0).
  - `sks_simulasi` -> maps to `simulation_credit` (double precision, fallback 0.0).
  - `ada_sap` -> maps to `has_unit` (boolean).
  - `ada_silabus` -> maps to `has_syllabus` (boolean).
  - `ada_bahan_ajar` -> maps to `has_material` (boolean).
  - `ada_acara_praktek` -> maps to `has_practice` (boolean).
  - `ada_diktat` -> maps to `has_dictation` (boolean).
  - `metode_kuliah` -> maps to `implementation_method` (text).
  - `tanggal_mulai_efektif` -> maps to `start_date` (date).
  - `tanggal_selesai_efektif` -> maps to `end_date` (date).

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_05_matakuliah_to_academic_course_master_course.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_05_matakuliah_to_academic_course_master_course.rs)

- Implement `SyncMatakuliahToAcademicCourseMasterCourse` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
- Iterate over `feeder_master.matakuliah` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record without terminating the entire synchronization run.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_course(
    txn: &DatabaseTransaction,
    record: &FeederMatakuliah::Model,
    unit: &InstitutionUnit::Model,
) -> Result<(AcademicCourse::Model, UpsertAction), sea_orm::DbErr>;
```

Follows the standard repository pattern: **find existing record → if `None`, `insert` new `ActiveModel`; if `Some`, convert with `into_active_model()`, assign synced fields, and `update`**.

##### `upsert_course`

- **Find**:
  1. Try direct match: `academic_course_master.courses` WHERE `feeder_course_id = record.id_matkul`.
  2. If `None` and `kode_mata_kuliah` present: fallback match WHERE `code = record.kode_mata_kuliah AND unit_id = unit.id`.
- **Synced fields** (set on both insert and update):
  - `code`: `record.kode_mata_kuliah.clone().unwrap_or_default()`
  - `name`: `record.nama_mata_kuliah.clone().unwrap_or_default()`
  - `implementation_method`: `record.metode_kuliah.clone()`
  - `total_credit`: `record.sks_mata_kuliah.map(|v| v as f64).unwrap_or(0.0)`
  - `lecture_credit`: `record.sks_tatap_muka.map(|v| v as f64).unwrap_or(0.0)`
  - `practice_credit`: `record.sks_praktek.map(|v| v as f64).unwrap_or(0.0)`
  - `field_practice_credit`: `record.sks_praktek_lapangan.map(|v| v as f64).unwrap_or(0.0)`
  - `simulation_credit`: `record.sks_simulasi.map(|v| v as f64).unwrap_or(0.0)`
  - `has_unit`: `record.ada_sap.unwrap_or(false)`
  - `has_syllabus`: `record.ada_silabus.unwrap_or(false)`
  - `has_material`: `record.ada_bahan_ajar.unwrap_or(false)`
  - `has_practice`: `record.ada_acara_praktek.unwrap_or(false)`
  - `has_dictation`: `record.ada_diktat.unwrap_or(false)`
  - `feeder_course_id`: `record.id_matkul`
  - `unit_id`: `unit.id`
  - `start_date`: `record.tanggal_mulai_efektif.map(|dt| dt.date())`
  - `end_date`: `record.tanggal_selesai_efektif.map(|dt| dt.date())`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `variety_id`: `Uuid::nil()`
  - `group_id`: `Some(Uuid::nil())`
  - `competence_id`: `Some(Uuid::nil())`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** the synced fields only. Do **not** overwrite `variety_id`, `group_id`, or `created_at`.

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit | `units` | Lookup from preloaded memory cache: `units_by_feeder_id.get(&id_prodi)`. | If not found, log `REFERENCE_NOT_FOUND` and skip record. |
| 2. Course | `courses` | 1) Query by `feeder_course_id = record.id_matkul`. 2) Fallback: query by `code = record.kode_mata_kuliah AND unit_id = unit.id`. | If found: update; if not found: insert. |

#### Per-record Flow (`run`)

1. Begin transaction for the record (`db.begin().await`).
2. Resolve `unit` from `ReferenceCache`. If missing, log `REFERENCE_NOT_FOUND`, rollback, increment `skipped`, and continue.
3. Call `upsert_course(&txn, &record, unit)`.
4. Commit transaction, increment counter (`inserted` or `updated`), and update progress bar message.
5. If any unhandled `DbErr` occurs during processing of a record, roll back that transaction, write `ERROR` to log, increment `errors`, and continue to the next record.

#### Logging & Progress

- Create log file `logs/sync_matakuliah_{YYYYMMDD_HHMMSS}.log`.
- Log entries with structured tags:
  - `REFERENCE_NOT_FOUND`: When unit cannot be matched.
  - `ERROR`: Any unhandled DB error for a record.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with message `"Counting feeder matakuliah records..."`.
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_05_matakuliah_to_academic_course_master_course;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`:
  `Box::new(feeder_dikti::synchronize::downstream::master::upsert_05_matakuliah_to_academic_course_master_course::SyncMatakuliahToAcademicCourseMasterCourse)`

## Resolved Decisions

1. **Dual Resolution Strategy**: Matches primarily by `feeder_course_id` (guaranteeing exact Feeder Dikti mapping), with fallback by `(code, unit_id)` to handle existing courses created natively in XSIA.
2. **Type Casting**: Floating-point credit numbers (`real`) in Feeder Dikti are safely cast to `f64` for SeaORM `double precision`.
3. **Reference Caching**: Preload units into memory once before processing to avoid N+1 query overhead.
4. **Fault Isolation**: Single record errors roll back that record's transaction and do not terminate the synchronization run.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task on the local database and verify counters:
  - Total records processed: **348**
  - `inserted`: **0**
  - `updated`: **348**
  - `errors`: **0**
- Verify generated log file in `logs/sync_matakuliah_*.log`.
- Verify database fields `total_credit`, `lecture_credit`, `has_syllabus`, `sync_at` in `academic_course_master.courses`.
