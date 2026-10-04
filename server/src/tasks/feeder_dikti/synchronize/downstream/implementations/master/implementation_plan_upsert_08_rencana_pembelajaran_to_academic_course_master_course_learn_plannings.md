# Deskripsi Capaian

Implement a data synchronization task that upserts weekly lesson learning plan records (RPS) from the Feeder Dikti table `feeder_master.rencana_pembelajaran` to the Academic system table `academic_course_master.course_learn_plannings`. The task reads syllabus meeting schedules and learning materials from the local `feeder_master` schema, resolves courses (`academic_course_master.courses`), study units (`institution_master.units`), and institutions (`institution_master.institutions`), and populates `academic_course_master.course_learn_plannings`.

> Supersedes the legacy job [upsert_rencana_pembelajaran_to_academic_course_master_course_learn_plannings.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_rencana_pembelajaran_to_academic_course_master_course_learn_plannings.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.rencana_pembelajaran` = **296 rows**. Key fields `id_rencana_ajar`, `id_matkul`, and `pertemuan` are 100% present.
- `academic_course_master.courses` = **296 / 296 (100%)** match via `courses.feeder_course_id = r.id_matkul`.
- `institution_master.units` and `institution_master.institutions` = **296 / 296 (100%)** match via `course.unit_id`.
- `academic_course_master.course_learn_plannings` = **296 / 296 (100%)** already match directly via `course_learn_plannings.feeder_id_rencana_ajar = r.id_rencana_ajar`.
- **Target Table Uniqueness**: Matching by `feeder_id_rencana_ajar` is 100% unique. All 296 rows will be updated; running a second time yields 296 updates and 0 inserts (idempotent run).
- **Naming Pattern**:
  `"RPS {institution_code} {unit_code} {course_code} {pertemuan}"`
- **Metric Fields**:
  - `pertemuan` -> maps to `code` (integer, fallback 0).
  - `materi_indonesia` -> maps to `decription_indonesian`.
  - `materi_inggris` -> maps to `decription_english`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_08_rencana_pembelajaran_to_academic_course_master_course_learn_plannings.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_08_rencana_pembelajaran_to_academic_course_master_course_learn_plannings.rs)

- Implement `SyncRencanaPembelajaranToCourseLearnPlannings` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `courses` keyed by `feeder_course_id: Uuid`
  - `units` keyed by `id: Uuid`
  - `institutions` keyed by `id: Uuid`
- Iterate over `feeder_master.rencana_pembelajaran` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    units_by_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_learn_planning(
    txn: &DatabaseTransaction,
    record: &FeederRencanaPembelajaran::Model,
    course: &AcademicCourse::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
) -> Result<(AcademicCourseLearnPlanning::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_learn_planning`

- **Find**:
  1. Direct match: `academic_course_master.course_learn_plannings` WHERE `feeder_id_rencana_ajar = record.id_rencana_ajar`.
  2. Fallback match: WHERE `course_id = course.id AND code = pertemuan`.
- **Construct Standard Name**:
  ```rust
  let pertemuan = record.pertemuan.unwrap_or(0);
  let title = format!(
      "RPS {} {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      course.code,
      pertemuan
  );
  ```
- **Synced fields** (set on both insert and update):
  - `course_id`: `course.id`
  - `feeder_id_rencana_ajar`: `record.id_rencana_ajar`
  - `name`: `title`
  - `code`: `pertemuan`
  - `decription_indonesian`: `record.materi_indonesia.clone().unwrap_or_default()`
  - `decription_english`: `record.materi_inggris.clone()`
  - `deleted_at`: `None`
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
| 2. Unit & Institution | `units`, `institutions` | Lookup `units_by_id.get(&course.unit_id)` and institution via `unit.institution_id`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Learn Planning | `course_learn_plannings` | 1) `feeder_id_rencana_ajar = record.id_rencana_ajar`. 2) Fallback: `(course_id, code)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_rencana_pembelajaran_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_08_rencana_pembelajaran_to_academic_course_master_course_learn_plannings;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Exact Feeder Mapping**: 100% (296 / 296) match directly via `feeder_id_rencana_ajar`.
2. **Deterministic Title Formulation**: Automatically formats RPS title including institution code, study program code, course code, and meeting index.
3. **Reference Preloading**: Course and organizational units are pre-loaded in memory.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **296**
  - Expected `updated`: **296**
  - Expected `inserted`: **0**
  - Expected `skipped`: **0**
  - Errors: **0**
  - Verify records in `academic_course_master.course_learn_plannings`.
