# Deskripsi Capaian

Implement a data synchronization task that upserts class participant records from the Feeder Dikti table `feeder_master.peserta_kelas_kuliah` to the Academic system table `academic_student_campaign.detail_activities`. The task verifies and synchronizes class roster memberships, ensuring students are linked to their respective enrolled courses and teaching classes across schemas (`academic_student_master.students`, `academic_campaign_transaction.teaches`, `academic_campaign_transaction.activities`, and `academic_student_campaign.student_activities`).

> Supersedes the legacy job [upsert_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.peserta_kelas_kuliah` = **21,633 rows**.
- `academic_student_master.students` = **21,615 / 21,633 (99.9%)** match via `students.id_registrasi_mahasiswa = p.id_registrasi_mahasiswa`. Exactly 18 rows reference missing student IDs and will be skipped.
- `academic_campaign_transaction.teaches` = **21,633 / 21,633 (100%)** match via `teaches.feeder_id = p.id_kelas_kuliah`.
- `academic_campaign_transaction.activities` = **21,633 / 21,633 (100%)** match via `teaches.activity_id`.
- `academic_student_campaign.student_activities` = **21,615 / 21,615 (100%)** match via `(student_id = student.id, unit_activity_id = teach.activity_id)`.
- `academic_student_campaign.detail_activities`:
  - Enrolled participants match existing rows by `(activity_id = student_activity.id, teach_id = teach.id)`.
  - Participant sync confirms student enrollment in class rosters without overriding grades already entered.
- **Naming Pattern**:
  `"DetailAktifitasPerkuliahan {institution_code} {unit_code} {student_code} {academic_year_feeder_name} {course_code}"`

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_15_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_15_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities.rs)

- Implement `SyncPesertaKelasKuliahToDetailActivities` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `id: Uuid`
  - `institutions` keyed by `id: Uuid`
  - `academic_years` keyed by `id: Uuid`
  - `activities` keyed by `id: Uuid`
  - `courses` keyed by `id: Uuid`
  - `teaches` keyed by `feeder_id: Uuid`
- Iterate over `feeder_master.peserta_kelas_kuliah` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_id: HashMap<Uuid, AcademicYear::Model>,
    activities_by_id: HashMap<Uuid, AcademicActivity::Model>,
    courses_by_id: HashMap<Uuid, AcademicCourse::Model>,
    teaches_by_feeder_id: HashMap<Uuid, AcademicTeach::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_participant_detail_activity(
    txn: &DatabaseTransaction,
    record: &FeederPesertaKelasKuliah::Model,
    student: &AcademicStudent::Model,
    student_activity: &AcademicStudentActivity::Model,
    teach: &AcademicTeach::Model,
    course: &AcademicCourse::Model,
    activity: &AcademicActivity::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicDetailActivity::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_participant_detail_activity`

- **Find**:
  1. Direct match: `academic_student_campaign.detail_activities` WHERE `activity_id = student_activity.id AND teach_id = teach.id`.
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
  - `credit`: `Some(course.total_credit)`
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
- **Otherwise → update** synced fields only (preserves `mark`, `grade_id`, and `is_lock`).

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Student | `students` | Query `academic_student_master.students` WHERE `id_registrasi_mahasiswa = record.id_registrasi_mahasiswa`. | If not found, log `REFERENCE_NOT_FOUND` and skip (18 rows). |
| 2. Teach | `teaches` | Lookup `teaches_by_feeder_id.get(&id_kelas_kuliah)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Activity | `activities` | Lookup `activities_by_id.get(&teach.activity_id)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 4. Student Activity | `student_activities` | Query `academic_student_campaign.student_activities` WHERE `student_id = student.id AND unit_activity_id = activity.id`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 5. Course | `courses` | Lookup `courses_by_id.get(&teach.course_id)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 6. Detail Activity | `detail_activities` | Match `(activity_id, teach_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_peserta_kelas_kuliah_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_15_peserta_kelas_kuliah_to_academic_student_campaign_detail_activities;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Roster Verification without Grade Erasure**: Participant sync validates attendance in the class without resetting or clearing grades that have already been imported by task 14.
2. **Missing Student Toleration**: 18 records referencing registrations missing from local DB snapshot are logged and safely bypassed.
3. **Reference Caching**: Teaching classes and activities are pre-cached to handle 21,633 records swiftly.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **21,633**
  - Expected processed: ~21,615
  - Expected skipped: ~18
  - Errors: **0**
  - Verify records in `academic_student_campaign.detail_activities`.
