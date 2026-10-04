# Deskripsi Capaian

Implement a data synchronization task that upserts teaching class records and metrics from the Feeder Dikti table `feeder_master.nilai_perkuliahan_kelas` to the Academic system table `academic_campaign_transaction.teaches`. The task reads class-level grading metadata (such as enrolled student counts, credit breakdowns, and semester dates) from the local `feeder_master` schema, resolves academic years (`academic_general_reference.academic_years`), study units (`institution_master.units`), institutions (`institution_master.institutions`), courses (`academic_course_master.courses`), campaign activities (`academic_campaign_transaction.activities`), class codes (`academic_campaign_transaction.class_codes`), teach decrees (`academic_campaign_transaction.teach_decrees`), and scopes (`academic_campaign_reference.scopes`), and updates `academic_campaign_transaction.teaches`.

> Supersedes the legacy job [upsert_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.nilai_perkuliahan_kelas` = **1,228 rows**. Key fields `id_kelas_kuliah`, `id_matkul`, `id_sms`, and `id_smt` are 100% present.
- `institution_master.units` = **1,228 / 1,228 (100%)** match via `units.feeder_id = npk.id_sms`.
- `academic_general_reference.academic_years` = **1,228 / 1,228 (100%)** match via `academic_years.feeder_name = npk.id_smt`.
- `academic_course_master.courses` = **1,228 / 1,228 (100%)** match via `courses.feeder_course_id = npk.id_matkul`.
- `academic_campaign_transaction.activities` = **1,228 / 1,228 (100%)** match via `(unit_id, academic_year_id)`.
- `academic_campaign_transaction.teaches` = **1,228 / 1,228 (100%)** match directly via `teaches.feeder_id = npk.id_kelas_kuliah`.
- **Target Table Uniqueness**: Matching by `feeder_id` is 100% unique. All 1,228 rows will be updated with class-level metrics; running a second time yields 1,228 updates and 0 inserts (idempotent run).
- **Naming Pattern**:
  `"AktifitasPengajaran {institution_code} {unit_code} {academic_year_feeder_name} {course_code}"`
- **Class Metrics**:
  - `jumlah_mahasiswa_krs` -> maps to `max_member` (fallback to existing or 40).
  - `tgl_mulai_koas` -> maps to `start_date` (fallback to `academic_year.start_date`).
  - `tgl_selesai_koas` -> maps to `end_date` (fallback to `academic_year.end_date`).

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_13_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_13_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches.rs)

- Implement `SyncNilaiPerkuliahanKelasToTransactionTeaches` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` keyed by `id: Uuid`
  - `academic_years` keyed by `feeder_name: String`
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
  - `courses` keyed by `feeder_course_id: Uuid`
  - `class_codes` keyed by `(activity_id: Uuid, alphabet_code: String)`
  - `decrees` keyed by `activity_id: Uuid`
  - `internal_scope_id: Uuid`
- Iterate over `feeder_master.nilai_perkuliahan_kelas` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    class_codes_by_activity_and_code: HashMap<(Uuid, String), AcademicClassCode::Model>,
    decrees_by_activity_id: HashMap<Uuid, Uuid>,
    internal_scope_id: Uuid,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_teach(
    txn: &DatabaseTransaction,
    record: &FeederNilaiPerkuliahanKelas::Model,
    course: &AcademicCourse::Model,
    activity: &AcademicActivity::Model,
    class_code_id: Uuid,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
    decree_id: Uuid,
    scope_id: Uuid,
) -> Result<(AcademicTeach::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_teach`

- **Find**:
  1. Direct match: `academic_campaign_transaction.teaches` WHERE `feeder_id = record.id_kelas_kuliah AND activity_id = activity.id`.
  2. Fallback match: WHERE `course_id = course.id AND activity_id = activity.id AND class_code_id = class_code_id`.
- **Construct Standard Name**:

  ```rust
  let name = format!(
      "AktifitasPengajaran {} {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      academic_year.feeder_name,
      course.code
  );
  ```

- **Synced fields** (set on both insert and update):
  - `name`: `Some(name)`
  - `max_member`: `record.jumlah_mahasiswa_krs.or(Some(40))`
  - `start_date`: `record.tgl_mulai_koas.or(academic_year.start_date)`
  - `end_date`: `record.tgl_selesai_koas.or(academic_year.end_date)`
  - `feeder_id`: `record.id_kelas_kuliah`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `course_id`: `course.id`
  - `activity_id`: `Some(activity.id)`
  - `class_code_id`: `class_code_id`
  - `teach_decree_id`: `decree_id`
  - `scope_id`: `scope_id`
  - `total_credit`: `course.total_credit`
  - `meeting_quantity`: `Some(16)`
  - `is_active`: `Some(true)`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit & Institution | `units`, `institutions` | Lookup `units_by_feeder_id.get(&id_sms)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_smt)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Activity | `activities` | Lookup `activities_by_unit_and_year.get(&(unit.id, academic_year.id))`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 4. Course | `courses` | Lookup `courses_by_feeder_id.get(&id_matkul)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 5. Class Code | `class_codes` | Lookup `class_codes_by_activity_and_code.get(&(activity.id, nama_kelas_kuliah))`. | If missing, create class code. |
| 6. Decree & Scope | `teach_decrees`, `scopes` | Preloaded decree and `"Internal"` scope. | |
| 7. Teach | `teaches` | 1) `feeder_id = id_kelas_kuliah`. 2) Fallback: `(course_id, activity_id, class_code_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_npk_teaches_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_13_nilai_perkuliahan_kelas_to_academic_campaign_transaction_teaches;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Exact Feeder ID Mapping**: 100% (1,228 / 1,228) of records match existing teaches via `teaches.feeder_id = record.id_kelas_kuliah`.
2. **Class Metrics Enrichment**: Updates member capacity from `jumlah_mahasiswa_krs` and effective dates from `tgl_mulai_koas`/`tgl_selesai_koas`.
3. **Reference Preloading**: Preloads all units, courses, academic years, and activities to ensure linear runtime performance.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **1,228**
  - Expected `updated`: **1,228**
  - Expected `inserted`: **0**
  - Expected `skipped`: **0**
  - Errors: **0**
  - Verify fields in `academic_campaign_transaction.teaches`.
