# Deskripsi Capaian

Implement a data synchronization task that upserts course teaching class records referenced by student study plan cards (`feeder_master.kartu_rencana_studi_mahasiswa`) to the Academic system table `academic_campaign_transaction.teaches`. The task ensures that all teaching classes attended by students exist in the academic system by resolving academic units (`institution_master.units`), institutions (`institution_master.institutions`), academic years (`academic_general_reference.academic_years`), campaign activities (`academic_campaign_transaction.activities`), class codes (`academic_campaign_transaction.class_codes`), courses (`academic_course_master.courses`), teach decrees (`academic_campaign_transaction.teach_decrees`), and scopes (`academic_campaign_reference.scopes`).

> Supersedes the legacy job [upsert_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.kartu_rencana_studi_mahasiswa` = **26,567 rows**.
- Distinct teaching class identifiers `id_kelas` in KRS = **1,423 unique classes**.
- `institution_master.units` = **26,567 / 26,567 (100%)** match via `units.feeder_id = krsm.id_prodi`.
- `academic_general_reference.academic_years` = **26,567 / 26,567 (100%)** match via `academic_years.feeder_name = krsm.id_periode`.
- `academic_course_master.courses` = **26,567 / 26,567 (100%)** match via `courses.feeder_course_id = krsm.id_matkul`.
- `academic_campaign_transaction.activities` = **26,567 / 26,567 (100%)** match via `(unit_id, academic_year_id)`.
- `academic_campaign_transaction.teaches`:
  - **1,221 classes** already match directly by `teaches.feeder_id = krsm.id_kelas`.
  - Remaining classes match via composite key `(course_id, activity_id, class_code_id)` or will be newly created.
- **Naming Convention**:
  `"AktifitasPengajaran {institution_code} {unit_code} {academic_year_feeder_name} {course_code}"`
- **Default Fields**:
  - `max_member`: `40`
  - `start_date`: `academic_year.start_date`
  - `end_date`: `academic_year.end_date`

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_12_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_12_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches.rs)

- Implement `SyncKartuRencanaStudiMahasiswaToAcademicTransactionTeaches` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` keyed by `id: Uuid`
  - `academic_years` keyed by `feeder_name: String`
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
  - `class_codes` keyed by `(activity_id: Uuid, alphabet_code: String)`
  - `courses` keyed by `feeder_course_id: Uuid`
  - `internal_scope_id: Uuid`
  - `teach_decrees` keyed by `activity_id: Uuid`
- Iterate over `feeder_master.kartu_rencana_studi_mahasiswa` in batches of 1,000 (`order_by_asc(Id)`).
- Use an in-memory `HashSet<Uuid>` tracking `id_kelas` to avoid redundant database writes across 26,567 rows.
- **Fault-tolerant per-record transaction**: Wrap each class upsert in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    class_codes_by_activity_and_code: HashMap<(Uuid, String), AcademicClassCode::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    decrees_by_activity_id: HashMap<Uuid, Uuid>,
    internal_scope_id: Uuid,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
    SkippedAlreadyProcessed,
}

async fn upsert_teach(
    txn: &DatabaseTransaction,
    id_kelas: Uuid,
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
  1. Direct match: `academic_campaign_transaction.teaches` WHERE `feeder_id = id_kelas AND activity_id = activity.id`.
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
  - `max_member`: `Some(40)`
  - `start_date`: `academic_year.start_date`
  - `end_date`: `academic_year.end_date`
  - `feeder_id`: `Some(id_kelas)`
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
| 1. Unit & Institution | `units`, `institutions` | Lookup `units_by_feeder_id.get(&id_prodi)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_periode)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Activity | `activities` | Lookup `activities_by_unit_and_year.get(&(unit.id, academic_year.id))`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 4. Class Code | `class_codes` | Lookup `class_codes_by_activity_and_code.get(&(activity.id, nama_kelas_kuliah))`. | If missing, create class code. |
| 5. Course | `courses` | Lookup `courses_by_feeder_id.get(&id_matkul)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 6. Decree & Scope | `teach_decrees`, `scopes` | Preloaded decree for activity (auto-create if missing) and `"Internal"` scope. | |
| 7. Teach | `teaches` | 1) `feeder_id = id_kelas`. 2) Fallback: `(course_id, activity_id, class_code_id)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_krsm_teaches_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_12_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Unique Class Deduplication**: With 26,567 KRS rows sharing 1,423 distinct `id_kelas`, caching seen class IDs avoids repeated processing of identical classes.
2. **Auto-provisioning Dependencies**: Automatically provisions missing default decrees and class codes under the resolved activity if needed.
3. **Reference Preloading**: All static references (units, academic years, courses, scopes) are preloaded to maximize throughput.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **26,567**
  - Unique classes upserted: **1,423**
  - Verify records in `academic_campaign_transaction.teaches`.
