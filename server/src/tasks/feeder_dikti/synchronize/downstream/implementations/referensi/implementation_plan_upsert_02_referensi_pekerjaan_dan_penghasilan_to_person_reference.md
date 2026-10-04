# Deskripsi Capaian

Implement a reference synchronization task that upserts records from Feeder Dikti tables `feeder_referensi.pekerjaan` and `feeder_referensi.penghasilan` to the system reference tables:

- `person_reference.occupations`
- `person_reference.incomes`

The task harmonizes occupation and income bracket dictionaries used across biodata mahasiswa, biodata dosen, and parent background profiles.

> Standardizes multi-entity reference synchronization, dual-key matching, fault-tolerant per-record transactions, and live progress reporting.

## Data Findings (local DB snapshot)

- `feeder_referensi.pekerjaan` = **19 rows** (`id_pekerjaan: i32`, `nama_pekerjaan: String`).
  - Matches 1-to-1 with Kemendikbud standard profession classifications (Tidak bekerja, Nelayan, Petani, Peternak, PNS/TNI/Polri, Karyawan Swasta, Pedagang Kecil, Pedagang Besar, Wiraswasta, Wirausaha, Buruh, Pensiunan, etc.).
- `feeder_referensi.penghasilan` = **7 rows** (`id_penghasilan: i32`, `nama_penghasilan: String`).
  - Range brackets: `< 500.000`, `500.000 - 999.999`, `1.000.000 - 1.999.999`, `2.000.000 - 4.999.999`, `5.000.000 - 20.000.000`, `> 20.000.000`, `Tidak Berpenghasilan`.
- `person_reference.occupations` = **18 rows** currently exist.
- `person_reference.incomes` = **9 rows** currently exist.
- Target keys: Match primarily by `code = id` or lowercase `name`.

## Proposed Changes

### Task Implementation

#### [NEW] [upsert_02_referensi_pekerjaan_dan_penghasilan_to_person_reference.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/upsert_02_referensi_pekerjaan_dan_penghasilan_to_person_reference.rs)

- Implement `SyncReferensiPekerjaanDanPenghasilanToPersonReference` implementing the `crate::tasks::Task` trait.
- Process in 2 sequential stages:
  1. Stage 1: Occupations (`feeder_referensi.pekerjaan`, 19 records).
  2. Stage 2: Incomes (`feeder_referensi.penghasilan`, 7 records).
- Process each record in its own database transaction (`db.begin().await`).

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_occupation(
    txn: &DatabaseTransaction,
    record: &FeederPekerjaan::Model,
) -> Result<(PersonOccupation::Model, UpsertAction), sea_orm::DbErr>;

async fn upsert_income(
    txn: &DatabaseTransaction,
    record: &FeederPenghasilan::Model,
) -> Result<(PersonIncome::Model, UpsertAction), sea_orm::DbErr>;
```

##### `upsert_occupation`

- **Find**: `person_reference.occupations` WHERE `code = record.id_pekerjaan` OR `LOWER(name) = LOWER(record.nama_pekerjaan)`.
- **Synced fields**:
  - `name`: `record.nama_pekerjaan.clone()`
  - `code`: `record.id_pekerjaan`
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `alphabet_code`: `record.id_pekerjaan.to_string()`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** synced fields only.

##### `upsert_income`

- **Find**: `person_reference.incomes` WHERE `code = record.id_penghasilan` OR `LOWER(name) = LOWER(record.nama_penghasilan)`.
- Parse numerical bounds from `record.nama_penghasilan` to populate `minimum` and `maximum` fields.
- **Synced fields**:
  - `name`: `record.nama_penghasilan.clone()`
  - `code`: `record.id_penghasilan`
  - `minimum`: Parsed lower bound integer
  - `maximum`: Parsed upper bound integer
  - `sync_at`: `Some(Local::now().naive_local())`
  - `updated_at`: `Some(Local::now().naive_local())`
- **If record does not exist → insert** with:
  - `id`: `Uuid::new_v4()`
  - `alphabet_code`: `record.id_penghasilan.to_string()`
  - `created_at`: `Some(Local::now().naive_local())`
  - Synced fields
- **Otherwise → update** synced fields only.

#### Logging & Progress

- Create log file `logs/sync_referensi_pekerjaan_penghasilan_{YYYYMMDD_HHMMSS}.log`.
- Progress bar:
  - Total records = 19 + 7 = 26.
  - Live message: `format!("occupations: {occ_synced} | incomes: {inc_synced} | errors: {errors}")`

#### [MODIFY] [referensi/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/mod.rs)

- Export `pub mod upsert_02_referensi_pekerjaan_dan_penghasilan_to_person_reference;`.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task and verify:
  - Total records processed: **26**
  - `errors`: **0**
- Verify generated log file in `logs/sync_referensi_pekerjaan_penghasilan_*.log`.
- Verify database records in `person_reference.occupations` and `person_reference.incomes`.
