# Deskripsi Capaian

Implement a hierarchical location reference synchronization task that upserts territorial boundaries from the Feeder Dikti table `feeder_referensi.wilayah` to the `location` schema tables:
- `location.provinces` (Level 1, 34 rows)
- `location.regencies` (Level 2, 514 rows)
- `location.sub_districts` (Level 3, 7,270 rows)

The task enforces hierarchical dependency ordering (Provinces ➔ Regencies ➔ Sub-districts), maps parental foreign keys (`province_id`, `regency_id`), and provides a clean foundation for student/lecturer contact residences and institutional location profiling.

> Standardizes multi-level hierarchical reference synchronization, in-memory parent caching, fault-tolerant per-record transactions, and live progress reporting.

## Data Findings (local DB snapshot)

- `feeder_referensi.wilayah` = **8,069 rows**:
  - `id_level_wilayah = 0` (**251 rows**): Countries (e.g. `AE000000`, `ID000000`).
  - `id_level_wilayah = 1` (**34 rows**): Provinces (e.g. `010000` [Aceh], `730000` [Sulawesi Selatan]).
  - `id_level_wilayah = 2` (**514 rows**): Regencies/Cities (e.g. `737100` [Kota Makassar], `091000` [Kab. Siak]).
  - `id_level_wilayah = 3` (**7,270 rows**): Sub-districts (e.g. `737101` [Kec. Mariso], `160908` [Kec. Melak]).
- Existing `location` schema snapshot:
  - `location.provinces` = **34 rows** (100% matched by 2-digit code).
  - `location.regencies` = **514 rows** (100% matched by 4-digit code).
  - `location.sub_districts` = **7,098 rows** currently exist. The task will update existing sub-districts and insert the missing 172 sub-districts.
- **Parental Hierarchy Mapping**:
  - Sub-district code `160908` has parent regency code `1609` (or `160900` in Feeder) and province code `16` (`160000` in Feeder).
  - Regency type: detect `Kota` vs `Kabupaten` based on prefix in `nama_wilayah` to assign `regency_type_id`.

## Proposed Changes

### Task Implementation

#### [NEW] [upsert_04_referensi_wilayah_to_location_provinces_regencies_sub_districts.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/upsert_04_referensi_wilayah_to_location_provinces_regencies_sub_districts.rs)

- Implement `SyncReferensiWilayahToLocation` implementing the `crate::tasks::Task` trait.
- Process strictly in **3 hierarchical phases**:
  1. **Phase 1: Provinces (`id_level_wilayah = 1`)**:
     - Preload existing provinces into `HashMap<code: String, Uuid>`.
     - Upsert each province into `location.provinces`.
     - Update in-memory province cache with active UUIDs.
  2. **Phase 2: Regencies (`id_level_wilayah = 2`)**:
     - Preload existing regencies into `HashMap<code: String, Uuid>`.
     - Resolve `province_id` from Phase 1 cache using the first 2 digits of `id_wilayah`.
     - Detect regency type (`Kota` vs `Kabupaten`).
     - Upsert each regency into `location.regencies`.
     - Update in-memory regency cache with active UUIDs.
  3. **Phase 3: Sub-districts (`id_level_wilayah = 3`)**:
     - Iterate over sub-districts in batches of 1,000.
     - Resolve `regency_id` from Phase 2 cache using the first 4 digits of `id_wilayah`.
     - Upsert each sub-district into `location.sub_districts`.

#### Reference Cache Struct

```rust
struct LocationCache {
    provinces_by_code: HashMap<String, Uuid>,
    regencies_by_code: HashMap<String, Uuid>,
    regency_type_kabupaten_id: Uuid,
    regency_type_kota_id: Uuid,
    country_indonesia_id: Uuid,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_province(
    txn: &DatabaseTransaction,
    record: &FeederWilayah::Model,
    cache: &LocationCache,
) -> Result<(LocationProvince::Model, UpsertAction), sea_orm::DbErr>;

async fn upsert_regency(
    txn: &DatabaseTransaction,
    record: &FeederWilayah::Model,
    cache: &LocationCache,
) -> Result<(LocationRegency::Model, UpsertAction), sea_orm::DbErr>;

async fn upsert_sub_district(
    txn: &DatabaseTransaction,
    record: &FeederWilayah::Model,
    cache: &LocationCache,
) -> Result<(LocationSubDistrict::Model, UpsertAction), sea_orm::DbErr>;
```

##### Field Synchronization Rules

1. **`provinces`**:
   - `code`: 2 digits (`id_wilayah[0..2]`).
   - `name`: Cleaned `nama_wilayah` (e.g. `"Sulawesi Selatan"`).
   - `country_id`: `cache.country_indonesia_id`.
   - Find: `location.provinces` WHERE `code = province_code`.
2. **`regencies`**:
   - `code`: 4 digits (`id_wilayah[0..4]`).
   - `name`: Cleaned `nama_wilayah` without `"Kab. "` or `"Kota "` prefix.
   - `province_id`: Resolved from `cache.provinces_by_code`.
   - `regency_type_id`: `Kota` if name starts with `"Kota"`, else `Kabupaten`.
   - Find: `location.regencies` WHERE `code = regency_code`.
3. **`sub_districts`**:
   - `code`: 6 digits (`id_wilayah[0..6]`).
   - `name`: Cleaned `nama_wilayah` without `"Kec. "` prefix.
   - `regency_id`: Resolved from `cache.regencies_by_code`.
   - Find: `location.sub_districts` WHERE `code = sub_district_code`.

#### Logging & Progress

- Create log file `logs/sync_referensi_wilayah_{YYYYMMDD_HHMMSS}.log`.
- Progress bar:
  - Total records = 34 + 514 + 7,270 = 7,818.
  - Live message: `format!("provinces: {p} | regencies: {r} | sub_districts: {s} | errors: {errors}")`

#### [MODIFY] [referensi/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/mod.rs)

- Export `pub mod upsert_04_referensi_wilayah_to_location_provinces_regencies_sub_districts;`.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task and verify:
  - Total records processed: **7,818**
  - `errors`: **0**
- Verify generated log file in `logs/sync_referensi_wilayah_*.log`.
- Verify database hierarchy:
  - `location.provinces` count = **34**
  - `location.regencies` count = **514**
  - `location.sub_districts` count = **7,270**
