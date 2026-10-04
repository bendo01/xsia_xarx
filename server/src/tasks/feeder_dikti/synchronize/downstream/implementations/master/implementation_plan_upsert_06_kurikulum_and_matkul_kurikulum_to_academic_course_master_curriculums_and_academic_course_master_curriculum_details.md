# Deskripsi Capaian

Implement a data synchronization task that upserts records from Feeder Dikti tables `feeder_master.kurikulum` and `feeder_master.matakuliah_kurikulum` to Academic system tables `academic_course_master.curriculums` and `academic_course_master.curriculum_details`. The task reads curriculum headers and subject details from the local `feeder_master` schema, resolves relational dependencies (`institution_master.units`, `academic_general_reference.academic_years`, `academic_course_reference.curriculum_types`, `academic_course_master.courses`, and `academic_course_reference.semesters`), and populates `academic_course_master.curriculums` and `academic_course_master.curriculum_details`.

> Supersedes the legacy job [upsert_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.kurikulum` = **7 rows**. Key FK fields (`id_kurikulum`, `id_prodi`, `id_semester`, `nama_kurikulum`) are 100% non-null.
- `feeder_master.matakuliah_kurikulum` = **361 rows**. All records reference valid `id_kurikulum` and `id_matkul`.
- `institution_master.units` = **7 / 7 (100%)** match via `units.feeder_id = k.id_prodi`.
- `academic_general_reference.academic_years` = **7 / 7 (100%)** match via `academic_years.feeder_name = k.id_semester`.
- `academic_course_master.courses` = **361 / 361 (100%)** match via `courses.feeder_course_id = mk.id_matkul`.
- `academic_course_master.curriculums` = **6 / 7 (85.7%)** already exist matching `curriculums.feeder_id = k.id_kurikulum`; 1 row (`KURIKULUM TK THN 2023`) will be inserted.
- `academic_course_master.curriculum_details` = **361 / 361 (100%)** match via `curriculum_details.feeder_id = mk.id`.
- **Target Table Uniqueness**: Matching by `feeder_id` is 100% unique. Fallback lookup for curriculums by `(unit_id, academic_year_id, name)` is also supported.
- **Metric & Credit Fields**:
  - `jumlah_sks_lulus` -> maps to `total_credit` (double precision, fallback 0.0).
  - `jumlah_sks_wajib` -> maps to `mandatory_course_credit` (double precision, fallback 0.0).
  - `jumlah_sks_pilihan` -> maps to `optional_course_credit` (double precision, fallback 0.0).
  - `sks_mata_kuliah` (details) -> maps to `credit` (double precision, fallback 0.0).
  - `semester` (details) -> maps to `semester_id` via `academic_course_reference.semesters.code`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_06_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_06_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details.rs)

- Implement `SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
  - `academic_years` keyed by `feeder_name: String`
  - `curriculum_types` (first or default record)
  - `semesters` keyed by `code: i32`
  - `courses` keyed by `feeder_course_id: Uuid`
- Iterate over `feeder_master.kurikulum` ordered by `nama_kurikulum ASC`.
- For each curriculum header:
  1. Upsert curriculum record in `academic_course_master.curriculums`.
  2. Query `feeder_master.matakuliah_kurikulum` WHERE `id_kurikulum = record.id_kurikulum`.
  3. Upsert each curriculum detail record in `academic_course_master.curriculum_details`.
- **Fault-tolerant per-record transaction**: Wrap each curriculum and its child details in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next curriculum.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    default_curriculum_type_id: Uuid,
    semesters_by_code: HashMap<i32, AcademicSemester::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_curriculum(
    txn: &DatabaseTransaction,
    record: &FeederKurikulum::Model,
    unit: &InstitutionUnit::Model,
    academic_year: &AcademicYear::Model,
    curriculum_type_id: Uuid,
) -> Result<(AcademicCurriculum::Model, UpsertAction), sea_orm::DbErr>;

async fn upsert_curriculum_detail(
    txn: &DatabaseTransaction,
    curriculum_id: Uuid,
    detail: &FeederMatakuliahKurikulum::Model,
    course_id: Uuid,
    semester_id: Uuid,
) -> Result<UpsertAction, sea_orm::DbErr>;
```

##### `upsert_curriculum`

- **Find**:
  1. Query `academic_course_master.curriculums` WHERE `feeder_id = record.id_kurikulum`.
  2. Fallback: WHERE `unit_id = unit.id AND academic_year_id = academic_year.id AND name = record.nama_kurikulum`.
- **Synced fields**:
  - `name`: `record.nama_kurikulum.clone().unwrap_or_default()`
  - `unit_id`: `unit.id`
  - `academic_year_id`: `academic_year.id`
  - `curriculum_type_id`: `curriculum_type_id`
  - `total_credit`: `record.jumlah_sks_lulus.map(|v| v as f64)`
  - `mandatory_course_credit`: `record.jumlah_sks_wajib.map(|v| v as f64)`
  - `optional_course_credit`: `record.jumlah_sks_pilihan.map(|v| v as f64)`
  - `feeder_id`: `record.id_kurikulum`
  - `is_active`: `true`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`

##### `upsert_curriculum_detail`

- **Find**:
  1. Query `academic_course_master.curriculum_details` WHERE `feeder_id = detail.id`.
  2. Fallback: WHERE `curriculum_id = curriculum_id AND course_id = course_id`.
- **Synced fields**:
  - `curriculum_id`: `curriculum_id`
  - `course_id`: `course_id`
  - `semester_id`: `semester_id`
  - `concentration_id`: `Some(Uuid::nil())`
  - `code`: `Some(0)`
  - `credit`: `detail.sks_mata_kuliah.map(|v| v as f64)`
  - `name`: `detail.nama_mata_kuliah.clone()`
  - `is_convertable_to_mbkm`: `Some(false)`
  - `is_convertable_to_prior_learning_recognition`: `Some(false)`
  - `feeder_id`: `Some(detail.id)`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit | `units` | Lookup `units_by_feeder_id.get(&id_prodi)`. | If not found, log `REFERENCE_NOT_FOUND` and skip curriculum. |
| 2. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_semester)`. | Fallback to `Uuid::nil()`. |
| 3. Curriculum Type | `curriculum_types` | Preloaded default/first curriculum type ID. | Fallback to `Uuid::nil()`. |
| 4. Curriculum | `curriculums` | 1) `feeder_id = record.id_kurikulum`. 2) Fallback `(unit_id, academic_year_id, name)`. | If found: update; if not found: insert. |
| 5. Course (Detail) | `courses` | Lookup `courses_by_feeder_id.get(&id_matkul)`. | Fallback: query `courses` by `(code, unit_id)`. If missing, skip detail. |
| 6. Semester (Detail) | `semesters` | Lookup `semesters_by_code.get(&detail.semester)`. | Fallback to `Uuid::nil()`. |
| 7. Curriculum Detail | `curriculum_details` | 1) `feeder_id = detail.id`. 2) Fallback `(curriculum_id, course_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_kurikulum_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Progress bar for 7 curriculums + tracking child details upserted.
  - Completion summary: `format!("Sync completed - curriculums: (ins: {c_ins}, upd: {c_upd}) | details: (ins: {d_ins}, upd: {d_upd}, skip: {d_skip}) | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_06_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Composite Parent-Child Transaction**: Processing the curriculum and all its child course details in the same transaction guarantees referential integrity between header and details.
2. **Preloaded Lookup Caches**: Preload units, academic years, semesters, and courses in memory to eliminate N+1 queries.
3. **Dual Identification**: Match curriculums and curriculum details by `feeder_id`, falling back to composite business keys (`(unit_id, academic_year_id, name)` and `(curriculum_id, course_id)`).

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Curriculums processed: **7** (1 insert, 6 updates).
  - Curriculum details processed: **361** (0 inserts, 361 updates on re-run).
  - Check database records in `academic_course_master.curriculums` and `academic_course_master.curriculum_details`.
