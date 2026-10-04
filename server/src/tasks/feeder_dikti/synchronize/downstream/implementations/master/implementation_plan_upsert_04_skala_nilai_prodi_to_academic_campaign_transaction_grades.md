# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.skala_nilai_program_studi` to the Academic system table `academic_campaign_transaction.grades`. The task reads grading scales from the local `feeder_master` schema, resolves academic units from `institution_master.units`, and populates `academic_campaign_transaction.grades`.

> Supersedes the legacy job [upsert_skala_nilai_prodi_to_academic_campaign_transaction_grades.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_skala_nilai_prodi_to_academic_campaign_transaction_grades.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.skala_nilai_program_studi` = **18 rows**. Key FK field `id_prodi` and `nilai_huruf` are 100% non-null.
- `institution_master.units` = **18 / 18 (100%)** match via `units.feeder_id = s.id_prodi`. Across 3 study programs: Teknik Keselamatan (6 grades), Administrasi Rumah Sakit (6 grades), Gizi (6 grades).
- `academic_campaign_transaction.grades` = **18 / 18 (100%)** already exist in the target table matching `(unit_id, alphabet_code)`.
- **Target Table Uniqueness**: The combination `(unit_id, alphabet_code)` is 100% distinct across the target table. All 18 rows will be updated; running a second time yields 18 updates and 0 inserts (idempotent run).
- **Grading Scale Metrics**:
  - `nilai_huruf` -> maps to `alphabet_code` and `name` (e.g., `'A'`, `'B'`, `'C'`, `'D'`, `'E'`).
  - `nilai_indeks` -> maps to `grade` (double precision, e.g., 4.0, 3.0, 2.0, 1.0, 0.0).
  - `bobot_minimum` -> maps to `minimum` (double precision, e.g., 85.0).
  - `bobot_maksimum` -> maps to `maximum` (double precision, e.g., 100.0).
  - `tanggal_mulai_efektif` -> maps to `start_date`.
  - `tanggal_akhir_efektif` -> maps to `end_date`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades.rs)

- Implement `SyncSkalaNilaiProdiToAcademicTransactionGrades` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
- Iterate over `feeder_master.skala_nilai_program_studi` in batches of 1,000 (`order_by_asc(Id)`).
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

async fn upsert_grade(
    txn: &DatabaseTransaction,
    record: &FeederSkalaNilai::Model,
    unit: &InstitutionUnit::Model,
) -> Result<(AcademicGrade::Model, UpsertAction), sea_orm::DbErr>;
```

Follows the standard repository pattern: **find existing record → if `None`, `insert` new `ActiveModel`; if `Some`, convert with `into_active_model()`, assign synced fields, and `update`**.

##### `upsert_grade`

- **Find**: `academic_campaign_transaction.grades` WHERE `unit_id = unit.id AND alphabet_code = record.nilai_huruf`.
- **Synced fields** (set on both insert and update):
  - `alphabet_code`: `record.nilai_huruf.clone()`
  - `name`: `record.nilai_huruf.clone().unwrap_or_else(|| "-".to_string())`
  - `grade`: `record.nilai_indeks.map(|v| v as f64).unwrap_or(0.0)`
  - `minimum`: `record.bobot_minimum.map(|v| v as f64).unwrap_or(0.0)`
  - `maximum`: `record.bobot_maksimum.map(|v| v as f64).unwrap_or(0.0)`
  - `start_date`: `record.tanggal_mulai_efektif`
  - `end_date`: `record.tanggal_akhir_efektif`
  - `feeder_id`: `Some(record.id)`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `unit_id`: `unit.id`
  - `code`: `Some(0)`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** the synced fields only. Do **not** overwrite `created_at` or `code`.

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit | `units` | Lookup from preloaded memory cache: `units_by_feeder_id.get(&id_prodi)`. | If not found, log `REFERENCE_NOT_FOUND` and skip record. |
| 2. Grade | `grades` | Query `grades` WHERE `unit_id = unit.id AND alphabet_code = record.nilai_huruf`. | If found: update; if not found: insert. |

#### Per-record Flow (`run`)

1. Begin transaction for the record (`db.begin().await`).
2. Resolve `unit` from `ReferenceCache`. If missing, log `REFERENCE_NOT_FOUND`, rollback, increment `skipped`, and continue.
3. Call `upsert_grade(&txn, &record, unit)`.
4. Commit transaction, increment counter (`inserted` or `updated`), and update progress bar message.
5. If any unhandled `DbErr` occurs during processing of a record, roll back that transaction, write `ERROR` to log, increment `errors`, and continue to the next record.

#### Logging & Progress

- Create log file `logs/sync_skala_nilai_{YYYYMMDD_HHMMSS}.log`.
- Log entries with structured tags:
  - `REFERENCE_NOT_FOUND`: When unit cannot be matched.
  - `ERROR`: Any unhandled DB error for a record.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with message `"Counting feeder skala_nilai_program_studi records..."`.
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`:
  `Box::new(feeder_dikti::synchronize::downstream::master::upsert_04_skala_nilai_prodi_to_academic_campaign_transaction_grades::SyncSkalaNilaiProdiToAcademicTransactionGrades)`

## Resolved Decisions

1. **Uniqueness Key**: `(unit_id, alphabet_code)` uniquely identifies each letter grade within a study program.
2. **Type Casting**: Feeder Dikti real/float values for `nilai_indeks`, `bobot_minimum`, and `bobot_maksimum` are cast safely to `f64` for SeaORM `double precision`.
3. **Reference Caching**: Preload units into memory once before processing to avoid N+1 query overhead.
4. **Fault Isolation**: Single record errors roll back that record's transaction and do not terminate the synchronization run.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task on the local database and verify counters:
  - Total records processed: **18**
  - `inserted`: **0**
  - `updated`: **18**
  - `errors`: **0**
- Verify generated log file in `logs/sync_skala_nilai_*.log`.
- Verify database fields `grade`, `minimum`, `maximum`, `start_date`, `end_date`, `sync_at` in `academic_campaign_transaction.grades`.
