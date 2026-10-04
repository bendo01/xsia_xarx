# Deskripsi Capaian

Implement a reference synchronization task that upserts records from the Feeder Dikti table `feeder_referensi.agama` to the system reference table `person_reference.religions`. The task reads religion definitions from the local `feeder_referensi` schema, harmonizes codes and names, and populates `person_reference.religions`.

> Standardizes master reference synchronization with dual lookup keys (numeric code and religion name), fault-tolerant per-record transactions, and live progress reporting.

## Data Findings (local DB snapshot)

- `feeder_referensi.agama` = **8 rows**:
  - `1`: Islam
  - `2`: Kristen
  - `3`: Katolik
  - `4`: Hindu
  - `5`: Budha
  - `6`: Khonghucu
  - `7`: Penghayat Kepercayaan Terhadap Tuhan YME
  - `99`: Lainnya
- `person_reference.religions` = **8 rows** currently exist:
  - Standard codes: 1 (Islam), 2 (Kristen), 3 (Katolik), 4 (Hindu), 5 (Budha), 6 (Konghucu), 98 (Lainnya), 99 (Khonghucu alt).
- **Target Table Uniqueness**: The primary search key is `code: i32` or lowercase `name: String`.
- All 8 rows are resolvable. Running a second time yields 8 updates and 0 inserts (idempotent run).

## Proposed Changes

### Task Implementation

#### [NEW] [upsert_01_referensi_agama_to_person_reference_religions.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/upsert_01_referensi_agama_to_person_reference_religions.rs)

- Implement `SyncReferensiAgamaToPersonReferenceReligions` implementing the `crate::tasks::Task` trait.
- Loop over `feeder_referensi.agama` ordered by `id_agama`.
- Process each record in its own database transaction (`db.begin().await`).

#### Upsert Method

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_religion(
    txn: &DatabaseTransaction,
    record: &FeederAgama::Model,
) -> Result<(PersonReligion::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_religion`

- **Find**:
  1. Primary lookup: `person_reference.religions` WHERE `code = record.id_agama`.
  2. Fallback lookup: WHERE `LOWER(name) = LOWER(record.nama_agama)`.
- **Synced fields**:
  - `name`: `record.nama_agama.clone()`
  - `code`: `record.id_agama`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `alphabet_code`: Single letter abbreviation (e.g. `'I'` for Islam, `'K'` for Kristen, `'C'` for Katolik, `'H'` for Hindu, `'B'` for Budha, `'L'` for Lainnya)
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** synced fields only.

#### Logging & Progress

- Create log file `logs/sync_referensi_agama_{YYYYMMDD_HHMMSS}.log`.
- Progress bar:
  - Total records = 8.
  - Live message: `format!("inserted: {inserted} | updated: {updated} | errors: {errors}")`

#### [MODIFY] [referensi/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/mod.rs)

- Export `pub mod upsert_01_referensi_agama_to_person_reference_religions;`.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task and verify:
  - Total records processed: **8**
  - `updated`: **8**
  - `errors`: **0**
- Verify generated log file in `logs/sync_referensi_agama_*.log`.
- Verify database records in `person_reference.religions`.
