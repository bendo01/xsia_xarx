# Deskripsi Capaian

Implement a data synchronization task that upserts course evaluation planning records from the Feeder Dikti table `feeder_master.rencana_evaluasi` to the Academic system table `academic_course_master.course_evaluation_plannings`. The task reads course-level evaluation criteria, evaluation weights, and bilingual descriptions from the local `feeder_master` schema, resolves equated courses (`academic_course_master.courses`) and evaluation types (`academic_course_reference.evaluation_types`), and populates `academic_course_master.course_evaluation_plannings`.

> Supersedes the legacy job [upsert_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.rencana_evaluasi` = **651 rows**. Key fields `id_matkul`, `id_jenis_evaluasi`, and `nomor_urut` are 100% present.
- `academic_course_master.courses` = **651 / 651 (100%)** match via `courses.feeder_course_id = r.id_matkul`.
- `academic_course_reference.evaluation_types` = **651 / 651 (100%)** match via `evaluation_types.code = r.id_jenis_evaluasi::int`.
- `academic_course_master.course_evaluation_plannings`:
  - **651 rows** represent new course evaluation plans that will be inserted.
  - On second execution, all 651 rows match via `(course_id = course.id, code = nomor_urut::int)` resulting in 651 updates and 0 inserts (idempotent run).
- **Metric Fields**:
  - `nama_evaluasi` -> maps to `name` (fallback to `evaluation_type.name`).
  - `nomor_urut` -> parsed as `i32` to `code`.
  - `bobot_evaluasi` -> parsed as `f32` to `percentage`.
  - `deskripsi_indonesia` -> maps to `decription_indonesian`.
  - `deskrips_inggris` -> maps to `decription_english`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_19_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_19_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings.rs)

- Implement `SyncRencanaEvaluasiToCourseEvaluationPlannings` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `courses` keyed by `feeder_course_id: Uuid`
  - `evaluation_types` keyed by `code: i32`
- Iterate over `feeder_master.rencana_evaluasi` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    evaluation_types_by_code: HashMap<i32, AcademicEvaluationType::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_evaluation_planning(
    txn: &DatabaseTransaction,
    record: &FeederRencanaEvaluasi::Model,
    course: &AcademicCourse::Model,
    evaluation_type: &AcademicEvaluationType::Model,
) -> Result<(AcademicCourseEvaluationPlanning::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_evaluation_planning`

- **Find**: `academic_course_master.course_evaluation_plannings` WHERE `course_id = course.id AND code = nomor_urut_int`.
- **Construct Name**:
  
  ```rust
  let name = match &record.nama_evaluasi {
      Some(nama) if !nama.trim().is_empty() => nama.clone(),
      _ => evaluation_type.name.clone(),
  };
  ```

- **Synced fields** (set on both insert and update):
  - `course_id`: `course.id`
  - `evaluation_type_id`: `evaluation_type.id`
  - `name`: `name`
  - `percentage`: `record.bobot_evaluasi.as_ref().and_then(|b| b.parse::<f32>().ok())`
  - `code`: `record.nomor_urut.as_ref().and_then(|n| n.parse::<i32>().ok())`
  - `decription_indonesian`: `record.deskripsi_indonesia.clone().unwrap_or_default()`
  - `decription_english`: `record.deskrips_inggris.clone()`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Course | `courses` | Lookup `courses_by_feeder_id.get(&id_matkul)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Evaluation Type | `evaluation_types` | Lookup `evaluation_types_by_code.get(&id_jenis_evaluasi.parse::<i32>())`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Evaluation Planning | `course_evaluation_plannings` | Match `(course_id, code = nomor_urut::int)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_rencana_evaluasi_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_19_rencana_evaluasi_to_academic_course_master_course_evaluation_plannings;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Composite Uniqueness Key**: Unique by `(course_id, code)` where `code` corresponds to `nomor_urut` of the evaluation stage.
2. **Evaluation Name Fallback**: When `nama_evaluasi` is empty or blank, defaults gracefully to the standard evaluation type name.
3. **Reference Preloading**: Preloads all courses and evaluation types into memory upfront.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **651**
  - Expected `inserted`: **651** (first run) / `updated`: **651** (second run)
  - Expected `skipped`: **0**
  - Errors: **0**
  - Verify records in `academic_course_master.course_evaluation_plannings`.
