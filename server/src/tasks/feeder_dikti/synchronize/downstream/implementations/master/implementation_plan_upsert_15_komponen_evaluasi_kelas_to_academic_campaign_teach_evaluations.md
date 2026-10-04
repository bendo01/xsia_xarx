# Deskripsi Capaian

Implement a data synchronization task that upserts class evaluation grading components from the Feeder Dikti table `feeder_master.komponen_evaluasi_kelas` to the Academic system table `academic_campaign_transaction.teach_evaluations`. The task reads class evaluation weights and component descriptions from the local `feeder_master` schema, resolves evaluation types (`academic_course_reference.evaluation_types`) and teaching classes (`academic_campaign_transaction.teaches`), and populates `academic_campaign_transaction.teach_evaluations`.

> Supersedes the legacy job [upsert_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/jobs/feeder_dikti/synchronize/downstream/master/upsert_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations.rs). Standardizes naming, in-memory reference caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

- `feeder_master.komponen_evaluasi_kelas` = **1,806 rows**. Key fields `id`, `id_kelas_kuliah`, and `id_jenis_evaluasi` are present.
- `academic_course_reference.evaluation_types` = **1,806 / 1,806 (100%)** match via `evaluation_types.code = k.id_jenis_evaluasi`.
- `academic_campaign_transaction.teaches` = **1,764 / 1,806 (97.7%)** match via `teaches.feeder_id = k.id_kelas_kuliah`. 42 rows reference classes not in the local database and will be gracefully skipped.
- `academic_campaign_transaction.teach_evaluations`:
  - **1,756 rows** match directly by `teach_evaluations.feeder_id = k.id`.
  - Exactly **8 rows** represent new evaluation components to be inserted.
- **Target Table Uniqueness**: Matching by `feeder_id = k.id` is 100% unique. Fallback lookup by `(teach_id, evaluation_type_id, thread)` is also supported.
- **Metric Fields**:
  - `nama` -> maps to `name`.
  - `nama_inggris` -> maps to `english_name`.
  - `nomor_urut` -> maps to `thread` (integer).
  - `bobot_evaluasi` -> parsed as `f32` to `evaluation_weight`.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_15_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_15_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations.rs)

- Implement `SyncKomponenEvaluasiKelasToTeachEvaluations` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `evaluation_types` keyed by `code: i32`
  - `teaches` keyed by `feeder_id: Uuid`
- Iterate over `feeder_master.komponen_evaluasi_kelas` in batches of 1,000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each record in an isolated transaction (`db.begin().await`). If an error occurs, roll back that transaction, write the error to the log, increment `errors`, and continue to the next record.

#### Reference Cache Struct

```rust
struct ReferenceCache {
    evaluation_types_by_code: HashMap<i32, AcademicEvaluationType::Model>,
    teaches_by_feeder_id: HashMap<Uuid, AcademicTeach::Model>,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_teach_evaluation(
    txn: &DatabaseTransaction,
    record: &FeederKomponenEvaluasiKelas::Model,
    teach: &AcademicTeach::Model,
    evaluation_type: &AcademicEvaluationType::Model,
) -> Result<(AcademicTeachEvaluation::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_teach_evaluation`

- **Find**:
  1. Direct match: `academic_campaign_transaction.teach_evaluations` WHERE `feeder_id = record.id`.
  2. Fallback match: WHERE `teach_id = teach.id AND evaluation_type_id = evaluation_type.id AND thread = record.nomor_urut`.
- **Synced fields** (set on both insert and update):
  - `name`: `record.nama.clone()`
  - `english_name`: `record.nama_inggris.clone()`
  - `thread`: `record.nomor_urut`
  - `evaluation_weight`: `record.bobot_evaluasi.as_ref().and_then(|s| s.parse::<f32>().ok())`
  - `teach_id`: `Some(teach.id)`
  - `evaluation_type_id`: `Some(evaluation_type.id)`
  - `feeder_id`: `Some(record.id)`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields

#### Resolution Rules

| Step | Target Entity | Resolution Query & Rule | Fallback & Handling |
| :--- | :--- | :--- | :--- |
| 1. Evaluation Type | `evaluation_types` | Lookup `evaluation_types_by_code.get(&id_jenis_evaluasi)`. | If not found, log `REFERENCE_NOT_FOUND` and skip. |
| 2. Teach | `teaches` | Lookup `teaches_by_feeder_id.get(&id_kelas_kuliah)`. | If not found, log `REFERENCE_NOT_FOUND` and skip (42 rows). |
| 3. Teach Evaluation | `teach_evaluations` | 1) `feeder_id = record.id`. 2) Fallback `(teach_id, evaluation_type_id, thread)`. | If found: update; if not found: insert. |

#### Logging & Progress

- Create log file `logs/sync_komponen_evaluasi_{YYYYMMDD_HHMMSS}.log`.
- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - Stage 1: Spinner counting records.
  - Stage 2: Deterministic bar initialized with `total_records`.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}")`.
  - Completion summary: `format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors} (see {log_file_path})")`.

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Ensure `pub mod upsert_15_komponen_evaluasi_kelas_to_academic_campaign_teach_evaluations;` is exported.

#### [MODIFY] [tasks/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register task in `get_tasks()`.

## Resolved Decisions

1. **Exact Feeder Mapping**: Matches by `feeder_id` primary key, guaranteeing idempotent updates across multiple sync runs.
2. **Missing Teach Class Toleration**: 42 components referencing teaching classes that do not exist locally are logged and skipped without halting synchronization.
3. **Weight Parsing**: Safely parses `bobot_evaluasi` strings to `f32` numbers.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run task and verify counters:
  - Total records evaluated: **1,806**
  - Expected `updated`: **1,756**
  - Expected `inserted`: **8**
  - Expected `skipped`: **42**
  - Errors: **0**
  - Verify records in `academic_campaign_transaction.teach_evaluations`.
