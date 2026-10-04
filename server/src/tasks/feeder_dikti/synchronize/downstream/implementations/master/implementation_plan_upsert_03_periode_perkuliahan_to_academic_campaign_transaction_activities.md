# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.periode_perkuliahan` to the Academic system table `academic_campaign_transaction.activities`. The task reads data from the local `feeder_master` schema, resolves relational dependencies across schemas (`institution_master.units`, `institution_master.institutions`, and `academic_general_reference.academic_years`), and populates `academic_campaign_transaction.activities`.

> Supersedes the legacy job [upsert_periode_perkuliahan_to_academic_campaign_transaction_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_periode_perkuliahan_to_academic_campaign_transaction_activities.rs). Standardizes naming, reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.periode_perkuliahan` = **40 rows**. Key FK fields (`id_prodi`, `id_semester`) are 100% non-null.
- `institution_master.units` = **40 / 40 (100%)** match via `units.feeder_id = p.id_prodi`. Only 3 units are involved: Teknik Keselamatan, Gizi, Administrasi Rumah Sakit. All belong to institution `092010` (`Institut Teknologi dan Kesehatan Tri Tunas Nasional`).
- `academic_general_reference.academic_years` = **40 / 40 (100%)** match via `academic_years.feeder_name = p.id_semester`.
- `academic_campaign_transaction.activities` = **40 / 40 (100%)** already exist in the target table matching `(unit_id, academic_year_id)`.
- **Target Table Uniqueness**: The combination `(unit_id, academic_year_id)` is 100% distinct (0 duplicate activities). All 40 rows will be updated with Feeder metrics; running a second time yields 40 updates and 0 inserts (idempotent run).
- **Date & Metric Fields**:
  - `jumlah_minggu_pertemuan` -> maps to `week_quantity` (integer, fallback 0).
  - `jumlah_target_mahasiswa_baru` -> maps to `student_target` (integer, fallback 0).
  - `jumlah_pendaftar_ikut_seleksi` -> maps to `candidate_number` (integer, fallback 0).
  - `jumlah_pendaftar_lulus_seleksi` -> maps to `candidate_pass` (integer, fallback 0).
  - `jumlah_daftar_ulang` -> maps to `became_student` (integer, fallback 0).
  - `tanggal_awal_perkuliahan` -> maps to `start_date` and `start_transaction`.
  - `tanggal_akhir_perkuliahan` -> maps to `end_date` and `end_transaction`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities.rs)

- Implement `SyncPeriodePerkuliahanToAcademicTransactionActivities` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap` to eliminate repetitive DB queries:
  - `academic_years` keyed by `feeder_name: String`
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` scoped to the institution IDs referenced by `units`
- Iterate over `feeder_master.periode_perkuliahan` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record without terminating the entire synchronization run.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_activity(
    txn: &DatabaseTransaction,
    record: &FeederPeriodePerkuliahan::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicActivity::Model, UpsertAction), sea_orm::DbErr>;
```

Follows the standard repository pattern: **find existing record → if `None`, `insert` new `ActiveModel`; if `Some`, convert with `into_active_model()`, assign synced fields, and `update`**.

##### `upsert_activity`

- **Find**: `academic_campaign_transaction.activities` WHERE `unit_id = unit.id AND academic_year_id = academic_year.id`.
- **Construct Standard Name**:
  Follow legacy format:
  ```rust
  let name = format!(
      "Aktifitas {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      academic_year.feeder_name
  );
  ```
- **Synced fields** (set on both insert and update):
  - `name`: `Set(name)`
  - `feeder_id`: `Set(Some(record.id))`
  - `week_quantity`: `Set(record.jumlah_minggu_pertemuan.or(Some(0)))`
  - `student_target`: `Set(record.jumlah_target_mahasiswa_baru.unwrap_or(0))`
  - `candidate_number`: `Set(record.jumlah_pendaftar_ikut_seleksi.unwrap_or(0))`
  - `candidate_pass`: `Set(record.jumlah_pendaftar_lulus_seleksi.unwrap_or(0))`
  - `became_student`: `Set(record.jumlah_daftar_ulang.unwrap_or(0))`
  - `start_date`: `Set(record.tanggal_awal_perkuliahan)`
  - `end_date`: `Set(record.tanggal_akhir_perkuliahan)`
  - `start_transaction`: `Set(record.tanggal_awal_perkuliahan)`
  - `end_transaction`: `Set(record.tanggal_akhir_perkuliahan)`
  - `sync_at`: `Set(Some(Local::now().naive_local()))`
  - `updated_at`: `Set(Some(Local::now().naive_local()))`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `unit_id`: `unit.id`
  - `academic_year_id`: `academic_year.id`
  - `transfer_student`: `0`
  - `total_class_member`: `Some(40)`
  - `is_active`: `Some(false)`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** the synced fields only. Do **not** overwrite `is_active`, `total_class_member`, or `created_at`.

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit & Year | `units`, `academic_years` | Lookup from preloaded cache: `units_by_feeder_id.get(&id_prodi)` and `years_by_feeder_name.get(&id_semester)`. | If not found, log `REFERENCE_NOT_FOUND` and skip record. |
| 2. Institution | `institutions` | Lookup from preloaded cache: `institutions_by_id.get(&unit.institution_id)`. | Fallback to empty string for code if missing. |
| 3. Activity | `activities` | Query `activities` WHERE `unit_id = unit.id AND academic_year_id = academic_year.id`. | If found: update; if not found: insert. |

#### Per-record Flow (`run`)

1. Begin transaction for the record (`db.begin().await`).
2. Resolve `unit` and `academic_year` from `ReferenceCache`. If missing, log `REFERENCE_NOT_FOUND`, rollback, increment `skipped`, and continue.
3. Call `upsert_activity(&txn, &record, unit, institution, academic_year)`.
4. Commit transaction, increment counter (`inserted` or `updated`), and update progress bar message.
5. If any unhandled `DbErr` occurs during processing of a record, roll back that transaction, write `ERROR` to log, increment `errors`, and continue to the next record.

#### Logging & Progress

- Create log file `logs/sync_periode_perkuliahan_{YYYYMMDD_HHMMSS}.log`.
- Log entries with structured tags:
  - `REFERENCE_NOT_FOUND`: When unit or academic year cannot be resolved from cache.
  - `ERROR`: Any unhandled DB error for a record.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with steady 100ms tick and message `"Counting feeder periode_perkuliahan records..."`.
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`:
  `Box::new(feeder_dikti::synchronize::downstream::master::upsert_03_periode_perkuliahan_to_academic_campaign_transaction_activities::SyncPeriodePerkuliahanToAcademicTransactionActivities)`

## Resolved Decisions

1. **Uniqueness Key**: `(unit_id, academic_year_id)` is the canonical business key for academic activities in XSIA.
2. **Name Construction**: Standardized as `"Aktifitas {inst_code} {unit_code} {semester_feeder_name}"`.
3. **Reference Caching**: Preload units, academic years, and referenced institutions into memory once before looping to avoid 120+ unnecessary DB roundtrips.
4. **Fault Isolation**: Single record errors roll back that record's transaction and do not terminate the synchronization run.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task on the local database and verify counters:
  - Total records processed: **40**
  - `inserted`: **0** (all 40 already exist)
  - `updated`: **40**
  - `errors`: **0**
- Verify generated log file in `logs/sync_periode_perkuliahan_*.log`.
- Verify database fields `week_quantity`, `student_target`, `became_student`, `start_date`, `end_date`, `sync_at` are properly populated in `academic_campaign_transaction.activities`.
