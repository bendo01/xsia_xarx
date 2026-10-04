# Deskripsi Capaian

Implement a data synchronization task that upserts student study plan detail enrollment records from the Feeder Dikti table `feeder_master.kartu_rencana_studi_mahasiswa` to the Academic system table `academic_student_campaign.detail_activities`. The task links each enrolled course to the student's semester activity, resolving units (`institution_master.units`), institutions (`institution_master.institutions`), academic years (`academic_general_reference.academic_years`), students (`academic_student_master.students`), semester campaign activities (`academic_campaign_transaction.activities`), student semester activities (`academic_student_campaign.student_activities`), courses (`academic_course_master.courses`), and teaching classes (`academic_campaign_transaction.teaches`).

> Supersedes the legacy job [upsert_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.kartu_rencana_studi_mahasiswa` = **26,567 rows**.
- `academic_student_master.students` = **26,567 / 26,567 (100%)** match via `students.id_registrasi_mahasiswa = krsm.id_registrasi_mahasiswa`.
- `academic_course_master.courses` = **26,567 / 26,567 (100%)** match via `courses.feeder_course_id = krsm.id_matkul`.
- `academic_campaign_transaction.teaches` = **26,567 / 26,567 (100%)** resolvable via `teaches.feeder_id = krsm.id_kelas`.
- `academic_student_campaign.student_activities` = **26,567 / 26,567 (100%)** resolvable via `(student_id, unit_activity_id)`.
- `academic_student_campaign.detail_activities` = **399,858 existing rows** in target table.
  - Matches via `(activity_id = student_activity.id, course_id = course.id, teach_id = teach.id)`.
- **Target Table Uniqueness**: Student class enrollment is unique per `(activity_id, course_id, teach_id)`. Subsequent runs update existing detail activities without duplicating enrollments (idempotent run).
- **Naming Convention**:
  `"DetailAktifitasPerkuliahan {institution_code} {unit_code} {student_code} {academic_year_feeder_name} {course_code}"`
- **Metric Fields**:
  - `credit` -> maps to `sks_mata_kuliah` (double precision, fallback 0.0).
  - `curiculum_detail_sequence` -> default `0`.
  - `mark` -> initial default `0.0` (graded later by task 14).
  - `grade_id` -> initial default `Some(Uuid::nil())`.
  - `feeder_grade_id` -> initial default `Some(Uuid::nil())`.
  - `is_lock` -> `false`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_13_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_13_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities.rs)

- Implement `SyncKartuRencanaStudiMahasiswaToDetailActivities` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` keyed by `id: Uuid`
  - `academic_years` keyed by `feeder_name: String`
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
  - `courses` keyed by `feeder_course_id: Uuid`
- Iterate over `feeder_master.kartu_rencana_studi_mahasiswa` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_detail_activity(
    txn: &DatabaseTransaction,
    record: &FeederKartuRencanaStudiMahasiswa::Model,
    student: &AcademicStudent::Model,
    student_activity: &AcademicStudentActivity::Model,
    course: &AcademicCourse::Model,
    teach: &AcademicTeach::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicDetailActivity::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_detail_activity`

- **Find**:
  1. Direct match: `academic_student_campaign.detail_activities` WHERE `teach_id = teach.id AND activity_id = student_activity.id AND course_id = course.id`.
  2. Fallback match: WHERE `feeder_id = record.id`.
- **Construct Standard Name**:
  
  ```rust
  let name = format!(
      "DetailAktifitasPerkuliahan {} {} {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      student.code,
      academic_year.feeder_name,
      course.code
  );
  ```

- **Synced fields** (set on both insert and update):
  - `name`: `Some(name)`
  - `credit`: `Some(record.sks_mata_kuliah.map(|v| v as f64).unwrap_or(0.0))`
  - `feeder_id`: `Some(record.id)`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `activity_id`: `student_activity.id`
  - `course_id`: `course.id`
  - `teach_id`: `Some(teach.id)`
  - `curiculum_detail_sequence`: `Some(0)`
  - `mark`: `Some(0.0)`
  - `grade_id`: `Some(Uuid::nil())`
  - `feeder_grade_id`: `Some(Uuid::nil())`
  - `is_lock`: `Some(false)`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** synced fields. Do **not** overwrite `mark`, `grade_id`, or `is_lock` if already graded.

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit & Institution | `units`, `institutions` | Lookup `units_by_feeder_id.get(&id_prodi)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_periode)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Unit Activity | `activities` | Lookup `activities_by_unit_and_year.get(&(unit.id, academic_year.id))`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 4. Student | `students` | Query `academic_student_master.students` WHERE `id_registrasi_mahasiswa = record.id_registrasi_mahasiswa`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 5. Student Activity | `student_activities` | Query `academic_student_campaign.student_activities` WHERE `student_id = student.id AND unit_activity_id = unit_activity.id`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 6. Course | `courses` | Lookup `courses_by_feeder_id.get(&id_matkul)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 7. Teach | `teaches` | Query `academic_campaign_transaction.teaches` WHERE `feeder_id = record.id_kelas`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 8. Detail Activity | `detail_activities` | Match `(teach_id, activity_id, course_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_krsm_detail_activities_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_13_kartu_rencana_studi_mahasiswa_to_academic_student_campaign_detail_activities;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Non-destructive Grade Preservation**: When updating existing `detail_activities`, existing grades (`mark`, `grade_id`, `is_lock`) are preserved if already populated by the grading synchronization step.
2. **Composite Key Resolution**: Resolves target records by composite key `(teach_id, activity_id, course_id)` with fallback to `feeder_id`.
3. **Reference Preloading**: High-frequency lookups (units, academic years, courses) are cached in memory to handle 26k records smoothly.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **26,567**
  - Verify records in `academic_student_campaign.detail_activities`.
