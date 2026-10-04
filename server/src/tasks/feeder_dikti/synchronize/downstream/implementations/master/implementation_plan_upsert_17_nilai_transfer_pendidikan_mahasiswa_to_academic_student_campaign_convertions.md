# Deskripsi Capaian

Implement a data synchronization task that upserts student transferred course credits from the Feeder Dikti table `feeder_master.nilai_transfer_pendidikan_mahasiswa` to the Academic system table `academic_student_campaign.convertions`. The task reads recognized prior learning / transfer course grades from the local `feeder_master` schema, resolves student records (`academic_student_master.students`), academic entry periods (`academic_general_reference.academic_years`), equated courses (`academic_course_master.courses`), and grade conversions (`academic_campaign_transaction.grades`), and populates `academic_student_campaign.convertions`.

> Supersedes the legacy job [upsert_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.nilai_transfer_pendidikan_mahasiswa` = **2,344 rows**. Key fields `id_transfer`, `id_registrasi_mahasiswa`, `id_matkul`, and `nilai_huruf_diakui` are 100% present.
- `academic_student_master.students` = **2,344 / 2,344 (100%)** match via `students.id_registrasi_mahasiswa = nt.id_registrasi_mahasiswa`.
- `academic_course_master.courses` = **2,344 / 2,344 (100%)** match via `courses.feeder_course_id = nt.id_matkul`.
- `academic_general_reference.academic_years` = **2,344 / 2,344 (100%)** match via `academic_years.feeder_name = nt.id_periode_masuk`.
- `academic_campaign_transaction.grades` = **100%** match via `(unit_id = student.unit_id, name = nt.nilai_huruf_diakui)`.
- `academic_student_campaign.convertions`:
  - **2,240 rows** match directly by `convertions.feeder_id = nt.id_transfer`.
  - Exactly **104 rows** represent new transfer course records to be inserted.
- **Target Table Uniqueness**: Matching by `feeder_id = nt.id_transfer` is 100% unique. Fallback lookup by `(student_id, course_id)` handles native transfer records.
- **Naming Pattern**:
  `"NilaiTransferPendidikanMahasiswa {student_code} {academic_year_feeder_name} {course_code}"`
- **Metric Fields**:
  - `origin_course_code` -> `kode_mata_kuliah_asal`
  - `origin_course_name` -> `nama_mata_kuliah_asal`
  - `origin_credit` -> `sks_mata_kuliah_asal` (double precision, fallback 0.0)
  - `origin_grade_letter` -> `nilai_huruf_asal`
  - `recognized_credit` -> `sks_mata_kuliah_diakui` (double precision, fallback 0.0)
  - `recognized_grade_letter` -> `nilai_huruf_diakui`
  - `recognized_grade_score` -> `nilai_angka_diakui` (double precision, fallback 0.0)

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_17_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_17_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions.rs)

- Implement `SyncNilaiTransferPendidikanMahasiswaToConvertions` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `academic_years` keyed by `feeder_name: String`
  - `courses` keyed by `feeder_course_id: Uuid`
  - `grades` keyed by `(unit_id: Uuid, name: String)`
- Iterate over `feeder_master.nilai_transfer_pendidikan_mahasiswa` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    grades_by_unit_and_name: HashMap<(Uuid, String), AcademicGrade::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_convertion(
    txn: &DatabaseTransaction,
    record: &FeederNilaiTransfer::Model,
    student: &AcademicStudent::Model,
    course: &AcademicCourse::Model,
    academic_year: Option<&AcademicYear::Model>,
    grade_id: Uuid,
) -> Result<(AcademicConvertion::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_convertion`

- **Find**:
  1. Direct match: `academic_student_campaign.convertions` WHERE `feeder_id = record.id_transfer`.
  2. Fallback match: WHERE `student_id = student.id AND course_id = course.id`.
- **Construct Standard Name**:

  ```rust
  let name = format!(
      "NilaiTransferPendidikanMahasiswa {} {} {}",
      student.code,
      academic_year.map(|ay| ay.feeder_name.as_str()).unwrap_or(""),
      course.code
  );
  ```

- **Synced fields** (set on both insert and update):
  - `student_id`: `student.id`
  - `academic_year_id`: `academic_year.map(|ay| ay.id)`
  - `course_id`: `course.id`
  - `grade_id`: `grade_id`
  - `feeder_id`: `record.id_transfer`
  - `origin_course_code`: `record.kode_mata_kuliah_asal.clone()`
  - `origin_course_name`: `record.nama_mata_kuliah_asal.clone()`
  - `origin_credit`: `record.sks_mata_kuliah_asal.map(|v| v as f64)`
  - `origin_grade_letter`: `record.nilai_huruf_asal.clone()`
  - `recognized_credit`: `record.sks_mata_kuliah_diakui.map(|v| v as f64)`
  - `recognized_grade_letter`: `record.nilai_huruf_diakui.clone()`
  - `recognized_grade_score`: `record.nilai_angka_diakui.map(|v| v as f64)`
  - `deleted_at`: `None`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `name`: `Some(name)`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Student | `students` | Query `academic_student_master.students` WHERE `id_registrasi_mahasiswa = record.id_registrasi_mahasiswa`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Course | `courses` | Lookup `courses_by_feeder_id.get(&id_matkul)`. | Fallback: query by `kode_matkul_diakui`. If missing, skip. |
| 3. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_periode_masuk)`. | Fallback to `None`. |
| 4. Grade | `grades` | Lookup `grades_by_unit_and_name.get(&(student.unit_id, nilai_huruf_diakui))`. | Fallback to `Uuid::nil()`. |
| 5. Convertion | `convertions` | 1) `feeder_id = record.id_transfer`. 2) Fallback: `(student_id, course_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_nilai_transfer_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_17_nilai_transfer_pendidikan_mahasiswa_to_academic_student_campaign_convertions;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Dual Lookup Strategy**: Exact matching by `feeder_id = id_transfer`, with composite `(student_id, course_id)` fallback for native credit transfers.
2. **Grade Resolution Scoped to Student's Unit**: Finds the correct grading scale record specifically under the student's study program (`unit_id`).
3. **Reference Preloading**: Preloads academic years, courses, and grading scales in memory for optimal bulk execution.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **2,344**
  - Expected `updated`: **2,240**
  - Expected `inserted`: **104**
  - Expected `skipped`: **0**
  - Errors: **0**
  - Verify records in `academic_student_campaign.convertions`.
