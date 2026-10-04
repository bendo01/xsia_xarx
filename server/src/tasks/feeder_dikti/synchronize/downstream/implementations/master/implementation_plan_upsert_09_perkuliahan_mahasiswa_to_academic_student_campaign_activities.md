# Deskripsi Capaian

Implement a data synchronization task that upserts student semester progress records from the Feeder Dikti table `feeder_master.perkuliahan_mahasiswa` to the Academic system table `academic_student_campaign.student_activities`. The task reads student academic semester achievements from the local `feeder_master` schema, resolves student records (`academic_student_master.students`), academic years (`academic_general_reference.academic_years`), campaign activities (`academic_campaign_transaction.activities`), student statuses (`academic_student_reference.statuses`), and financing references (`academic_student_reference.finances`), and populates `academic_student_campaign.student_activities`.

> Supersedes the legacy job [upsert_perkuliahan_mahasiswa_to_academic_student_campaign_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_perkuliahan_mahasiswa_to_academic_student_campaign_activities.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.perkuliahan_mahasiswa` = **3,405 rows**. Key fields `id_registrasi_mahasiswa` and `id_semester` are present.
- `academic_student_master.students` = **3,366 / 3,405 (98.9%)** match via `students.id_registrasi_mahasiswa = pm.id_registrasi_mahasiswa`. 39 rows reference student IDs that do not exist in the local database and will be gracefully skipped.
- `academic_general_reference.academic_years` = **3,405 / 3,405 (100%)** match via `academic_years.feeder_name = pm.id_semester`.
- `academic_campaign_transaction.activities` = **3,366 / 3,366 (100%)** match via `(student.unit_id, academic_year.id)`.
- `academic_student_reference.statuses` = **100%** match for status codes present:
  - `'A'` -> `Aktif` (`695fcd66-27cc-42d4-8c59-d664a7674587`)
  - `'N'` -> `Non-Aktif` (`71579672-37b7-455c-9353-02ea5810cf8b`)
- `academic_student_reference.finances` = **100%** match for financing codes present:
  - `'1'` -> `Mandiri` (`code: 1`)
  - `'3'` -> `Beasiswa Penuh` (`code: 3`)
- `academic_student_campaign.student_activities`:
  - **2,438 rows** match directly by `student_activities.feeder_id = pm.id`.
  - **3,279 rows** match by composite key `(student_id = student.id, unit_activity_id = unit_activity.id)`.
  - Exactly **87 rows** represent new student semester activity records that will be inserted.
- **Metric Fields**:
  - `ips` -> maps to `cumulative_index` (double precision, fallback 0.0).
  - `ipk` -> maps to `grand_cumulative_index` (double precision, fallback 0.0).
  - `sks_semester` -> maps to `total_credit` (double precision, fallback 0.0).
  - `sks_total` -> maps to `grand_total_credit` (double precision, fallback 0.0).
  - `biaya_kuliah_smt` -> maps to `finance_fee` (double precision, fallback 0.0).
  - `is_lock` -> set to `true`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_09_perkuliahan_mahasiswa_to_academic_student_campaign_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_09_perkuliahan_mahasiswa_to_academic_student_campaign_activities.rs)

- Implement `SyncPerkuliahanMahasiswaToAcademicStudentActivities` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `academic_years` keyed by `feeder_name: String`
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
  - `statuses` keyed by `alphabet_code: String`
  - `finances` keyed by `code: i32`
- Iterate over `feeder_master.perkuliahan_mahasiswa` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    statuses_by_code: HashMap<String, AcademicStatus::Model>,
    finances_by_code: HashMap<i32, AcademicFinance::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_student_activity(
    txn: &DatabaseTransaction,
    record: &FeederPerkuliahanMahasiswa::Model,
    student: &AcademicStudent::Model,
    unit_activity: &AcademicActivity::Model,
    academic_year: &AcademicYear::Model,
    status_id: Uuid,
    finance_id: Option<Uuid>,
) -> Result<(AcademicStudentActivity::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_student_activity`

- **Find**:
  1. Direct match: `academic_student_campaign.student_activities` WHERE `feeder_id = record.id`.
  2. Fallback match: WHERE `student_id = student.id AND unit_activity_id = unit_activity.id`.
- **Construct Standard Name**:

  ```rust
  let name = format!("Perkuliahan {} {}", academic_year.feeder_name, student.code);
  ```

- **Synced fields** (set on both insert and update):
  - `name`: `Some(name)`
  - `cumulative_index`: `record.ips.map(|v| v as f64).unwrap_or(0.0)`
  - `grand_cumulative_index`: `record.ipk.map(|v| v as f64).unwrap_or(0.0)`
  - `total_credit`: `Some(record.sks_semester.map(|v| v as f64).unwrap_or(0.0))`
  - `grand_total_credit`: `Some(record.sks_total.map(|v| v as f64).unwrap_or(0.0))`
  - `finance_fee`: `Some(record.biaya_kuliah_smt.map(|v| v as f64).unwrap_or(0.0))`
  - `status_id`: `status_id`
  - `finance_id`: `finance_id`
  - `is_lock`: `Some(true)`
  - `feeder_id`: `Some(record.id)`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `student_id`: `student.id`
  - `unit_activity_id`: `unit_activity.id`
  - `unit_id`: `Some(student.unit_id)`
  - `resign_status_id`: `Some(Uuid::nil())`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Student | `students` | Query `academic_student_master.students` WHERE `id_registrasi_mahasiswa = record.id_registrasi_mahasiswa`. | If not found, log `REFERENCE_NOT_FOUND` and skip (39 rows). |
| 2. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_semester)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Unit Activity | `activities` | Lookup `activities_by_unit_and_year.get(&(student.unit_id, academic_year.id))`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 4. Status | `statuses` | Lookup `statuses_by_code.get(&id_status_mahasiswa)`. | Fallback to `Uuid::nil()`. |
| 5. Finance | `finances` | Lookup `finances_by_code.get(&id_pembiayaan.parse::<i32>())`. | Fallback to `None`. |
| 6. Student Activity | `student_activities` | 1) `feeder_id = record.id`. 2) Fallback: `(student_id, unit_activity_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_perkuliahan_mahasiswa_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_09_perkuliahan_mahasiswa_to_academic_student_campaign_activities;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Dual Matching Mechanism**: Matches by `feeder_id` first, falling back to composite `(student_id, unit_activity_id)` to gracefully update previously synchronized or pre-existing semester records.
2. **Missing Student Handling**: 39 records in feeder referencing unimported student registration IDs are logged as skipped rather than failing the transaction.
3. **Reference Preloading**: Preload academic years, unit activities, statuses, and finances in memory before iterating.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **3,405**
  - Expected `updated`: ~3,279
  - Expected `inserted`: ~87
  - Expected `skipped`: ~39
  - Errors: **0**
  - Verify fields in `academic_student_campaign.student_activities`.
