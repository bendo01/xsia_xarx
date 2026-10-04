# Deskripsi Capaian

Implement a data synchronization task that upserts class code records referenced by student study plan cards (`feeder_master.kartu_rencana_studi_mahasiswa`) to the Academic system table `academic_campaign_transaction.class_codes`. The task ensures that all class codes encountered during student enrollment records exist in the academic system by resolving academic years (`academic_general_reference.academic_years`), study units (`institution_master.units`), institutions (`institution_master.institutions`), and campaign activities (`academic_campaign_transaction.activities`).

> Supersedes the legacy job [upsert_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.kartu_rencana_studi_mahasiswa` = **26,567 rows**. Key fields `id_prodi`, `id_periode`, and `nama_kelas_kuliah` are present across enrollment lines.
- Distinct class code keys `(id_prodi, id_periode, nama_kelas_kuliah)` = **173 combinations**.
- `institution_master.units` = **26,567 / 26,567 (100%)** match via `units.feeder_id = krsm.id_prodi`.
- `academic_general_reference.academic_years` = **26,567 / 26,567 (100%)** match via `academic_years.feeder_name = krsm.id_periode`.
- `academic_campaign_transaction.activities` = **26,567 / 26,567 (100%)** match via `(unit_id, academic_year_id)`.
- `academic_campaign_transaction.class_codes`:
  - **146 / 173 (84.4%)** already exist in the target table matching `(activity_id, alphabet_code = nama_kelas_kuliah)`.
  - **27 combinations** will be inserted if not already populated by task 07.
- **Target Table Uniqueness**: Class codes are scoped uniquely by `(activity_id, alphabet_code)`. Subsequent runs update existing class codes without creating duplicates (idempotent run).
- **Naming Pattern**:
  `"KelasKuliah {institution_code} {unit_code} {academic_year_feeder_name} {nama_kelas_kuliah}"`
- **Default Fields**:
  - `capacity`: `40`
  - `start_effective_date`: `academic_year.start_date`
  - `end_effective_date`: `academic_year.end_date`

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_10_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_10_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code.rs)

- Implement `SyncKartuRencanaStudiMahasiswaToAcademicCampaignTransactionClassCode` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `units` keyed by `feeder_id: Uuid`
  - `institutions` keyed by `id: Uuid`
  - `academic_years` keyed by `feeder_name: String`
  - `activities` keyed by `(unit_id: Uuid, academic_year_id: Uuid)`
  - `class_codes` keyed by `(activity_id: Uuid, alphabet_code: String)`
- Iterate over `feeder_master.kartu_rencana_studi_mahasiswa` in batches of 1,000 (`order_by_asc(Id)`).
- Use an in-memory `HashSet<(Uuid, String)>` to track processed class codes during the synchronization run, ensuring each distinct `(activity_id, alphabet_code)` is upserted only once across the 26,567 rows.
- **Fault-tolerant per-record transaction**: Wrap each class code upsert in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    class_codes_by_activity_and_code: HashMap<(Uuid, String), AcademicClassCode::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
    SkippedAlreadyProcessed,
}

async fn upsert_class_code(
    txn: &DatabaseTransaction,
    nama_kelas_kuliah: &str,
    activity: &AcademicActivity::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicClassCode::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_class_code`

- **Find**:
  1. Lookup in `class_codes_by_activity_and_code.get(&(activity.id, nama_kelas_kuliah.to_string()))`.
  2. Fallback query `academic_campaign_transaction.class_codes` WHERE `activity_id = activity.id AND alphabet_code = nama_kelas_kuliah`.
- **Construct Standard Name**:

  ```rust
  let class_name = format!(
      "KelasKuliah {} {} {} {}",
      institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
      unit.code.as_deref().unwrap_or(""),
      academic_year.feeder_name,
      nama_kelas_kuliah
  );
  ```

- **Synced fields** (set on both insert and update):
  - `unit_id`: `Some(unit.id)`
  - `name`: `class_name`
  - `capacity`: `Some(40)`
  - `start_effective_date`: `academic_year.start_date`
  - `end_effective_date`: `academic_year.end_date`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `activity_id`: `activity.id`
  - `alphabet_code`: `Some(nama_kelas_kuliah.to_string())`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Unit & Institution | `units`, `institutions` | Lookup `units_by_feeder_id.get(&id_prodi)`. Institution resolved via `institutions_by_id.get(&unit.institution_id)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Academic Year | `academic_years` | Lookup `years_by_feeder_name.get(&id_periode)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 3. Activity | `activities` | Lookup `activities_by_unit_and_year.get(&(unit.id, academic_year.id))`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 4. Class Code | `class_codes` | Match `(activity_id = activity.id, alphabet_code = nama_kelas_kuliah)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_krsm_class_code_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_10_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **In-Memory Key Deduplication**: With 26,567 enrollment rows pointing to 173 unique classes, in-memory deduplication keeps processing fast and avoids redundant database writes.
2. **Deterministic Scoping**: Ensures class codes are bound to their respective academic campaign activity.
3. **Reference Preloading**: Eliminates N+1 queries by caching all relevant units, academic years, and activities upfront.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **26,567**
  - Distinct class codes upserted: **173**
  - Verify records in `academic_campaign_transaction.class_codes`.
