# Deskripsi Capaian

Implement a unified data synchronization task that upserts contact information (phones, email addresses, and residences) from Feeder Dikti tables `feeder_master.biodata_mahasiswa` and `feeder_master.biodata_dosen` to the Contact system tables:

- `contact_master.phones`
- `contact_master.electronic_mails`
- `contact_master.residences`

All contact records are linked polymorphically to `person_master.individuals` via `phoneable`, `electronic_mailable`, and `residenceable` relations (`residenceable_type = "App\Models\Person\Master\Individual"`). The task resolves reference types from `contact_reference` and geographical hierarchy from `location` (`provinces`, `regencies`, `sub_districts`).

> Standardizes multi-entity polymorphic contact synchronization, in-memory reference and location caching, and fault-tolerant per-record transactions with live progress tracking.

## Data Findings (local DB snapshot)

### Source Data Distribution

- `feeder_master.biodata_mahasiswa` = **708 rows**:
  - Non-empty `telepon` = **5 rows**
  - Non-empty `email` = **561 rows**
  - Non-empty `jalan` = **655 rows**
  - Non-empty `id_wilayah` = **708 rows** (100%)
- `feeder_master.biodata_dosen` = **77 rows**:
  - Non-empty `telepon` = **16 rows**
  - Non-empty `email` = **59 rows**
  - Non-empty `jalan` = **77 rows** (100%)
  - Non-empty `id_wilayah` = **77 rows** (100%)

### Target & Reference Dependencies

- `person_master.individuals`:
  - 686 / 708 `biodata_mahasiswa` match `individuals.code = bm.nik`.
  - 76 / 77 `biodata_dosen` match `individuals.code = bd.nik`.
  - Unmatched individuals are logged as `INDIVIDUAL_NOT_FOUND` and skipped.
- `contact_reference`:
  - `phone_types`: Default to `"Pribadi"` (`alphabet_code = 'B'`, ID `5cf06051-0434-4581-807f-52ee40c7b7bf`).
  - `electronic_mail_types`: Default to `"Pribadi"` (`alphabet_code = 'B'`, ID `3df226c0-3280-48f3-b8b5-168dff719e54`).
  - `residence_types`: Default to `"Bangunan Rumah Tinggal"` (`alphabet_code = 'A'`, ID `a24667c1-6e1f-4b00-982f-b3b297bc4d60`).
- `location` Hierarchy Resolution:
  - `id_wilayah` in Feeder Dikti uses 6-digit BPS/Kemendagri codes (e.g. `160908` -> province `16`, regency `1609`, sub-district `160908`).
  - `location.sub_districts` has 7,098 rows. Lookup by `code = TRIM(id_wilayah)` directly resolves `sub_district.id`, `sub_district.regency_id`, and its parent `province_id`.
  - Fallback: If 6-digit sub-district code is not found, fallback to 4-digit regency code `SUBSTRING(TRIM(id_wilayah), 1, 4)` and 2-digit province code `SUBSTRING(TRIM(id_wilayah), 1, 2)`.

### Polymorphic Target Mapping

In XSIA, polymorphic relations use the Laravel model namespace:

- `phoneable_type` = `"App\Models\Person\Master\Individual"`
- `electronic_mailable_type` = `"App\Models\Person\Master\Individual"`
- `residenceable_type` = `"App\Models\Person\Master\Individual"`

Uniqueness per individual:

- `phones`: Unique by `(phoneable_type, phoneable_id, phone_number)`.
- `electronic_mails`: Unique by `(electronic_mailable_type, electronic_mailable_id, email_address)`.
- `residences`: Unique by `(residenceable_type, residenceable_id)`.

## Proposed Changes

### Task Implementation

#### [NEW] [upsert_biodata_to_contact_details.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/contact/upsert_biodata_to_contact_details.rs)

- Implement `SyncBiodataToContactDetails` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `individuals` keyed by `code: String` (NIK)
  - `sub_districts` keyed by `code: String`
  - `regencies` keyed by `code: String`
  - `provinces` keyed by `code: String`
  - Static type UUIDs for phone, email, and residence.
- Process in 2 sequential stages:
  1. Stage 1: Student contacts from `feeder_master.biodata_mahasiswa` (708 rows).
  2. Stage 2: Lecturer contacts from `feeder_master.biodata_dosen` (77 rows).
- **Fault-tolerant per-record transaction**: Wrap each individual's contact upserts in an isolated transaction (`db.begin().await`).

#### Reference Cache Struct

```rust
struct ReferenceCache {
    individuals_by_nik: HashMap<String, PersonIndividual::Model>,
    sub_districts_by_code: HashMap<String, LocationSubDistrict::Model>,
    regencies_by_code: HashMap<String, LocationRegency::Model>,
    provinces_by_code: HashMap<String, LocationProvince::Model>,
    default_phone_type_id: Uuid,
    default_email_type_id: Uuid,
    default_residence_type_id: Uuid,
}
```

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_contact_phone(
    txn: &DatabaseTransaction,
    individual_id: Uuid,
    phone_number: &str,
    phone_type_id: Uuid,
) -> Result<UpsertAction, sea_orm::DbErr>;

async fn upsert_contact_email(
    txn: &DatabaseTransaction,
    individual_id: Uuid,
    email: &str,
    email_type_id: Uuid,
) -> Result<UpsertAction, sea_orm::DbErr>;

async fn upsert_contact_residence(
    txn: &DatabaseTransaction,
    individual_id: Uuid,
    street: &str,
    rt: Option<i32>,
    rw: Option<i32>,
    id_wilayah: Option<&str>,
    cache: &ReferenceCache,
) -> Result<UpsertAction, sea_orm::DbErr>;
```

##### Field Synchronization Rules

1. **`phones`**:
   - Clean number: strip whitespace, dashes, leading non-digits. Skip if empty.
   - Find: `contact_master.phones` WHERE `phoneable_type = "App\Models\Person\Master\Individual" AND phoneable_id = individual_id AND phone_number = cleaned_phone`.
   - If not found: insert with `Uuid::new_v4()`, `phone_type_id = default_phone_type_id`, `created_at = now`.
   - If found: update `updated_at`, `sync_at`.
2. **`electronic_mails`**:
   - Clean email: lowercase, strip whitespace. Skip if empty or does not contain `'@'`.
   - Find: `contact_master.electronic_mails` WHERE `electronic_mailable_type = "App\Models\Person\Master\Individual" AND electronic_mailable_id = individual_id AND email_address = cleaned_email`.
   - If not found: insert with `Uuid::new_v4()`, `electronic_mail_type_id = default_email_type_id`.
   - If found: update `updated_at`, `sync_at`.
3. **`residences`**:
   - Find: `contact_master.residences` WHERE `residenceable_type = "App\Models\Person\Master\Individual" AND residenceable_id = individual_id`.
   - Resolve location:
     - Check `sub_districts_by_code.get(id_wilayah)` -> yields `sub_district_id`, `regency_id`, `province_id`.
     - If not found, check `regencies_by_code.get(&id_wilayah[0..4])` -> yields `regency_id`, `province_id`.
     - If not found, check `provinces_by_code.get(&id_wilayah[0..2])` -> yields `province_id`.
   - If not found: insert new residence with `street`, `neighborhood_association` (RT), `citizens_association` (RW), resolved location IDs, `residence_type_id = default_residence_type_id`.
   - If found: update `street`, `rt`, `rw`, location IDs, `updated_at`, `sync_at`.

#### Logging & Progress

- Create log file `logs/sync_contact_details_{YYYYMMDD_HHMMSS}.log`.
- Log entries with structured tags:
  - `INDIVIDUAL_NOT_FOUND`: When biodata NIK cannot be matched to `person_master.individuals`.
  - `LOCATION_NOT_FOUND`: When `id_wilayah` cannot be resolved in `location`.
  - `ERROR`: Any unhandled DB error for a record.
- Progress bar:
  - Total records = 708 (students) + 77 (lecturers) = 785.
  - Live message: `format!("phones: {phones_synced} | emails: {emails_synced} | residences: {residences_synced} | errors: {errors}")`

#### [NEW] [contact/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/contact/mod.rs)

- Export `pub mod upsert_biodata_to_contact_details;`.

#### [MODIFY] [downstream/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/mod.rs)

- Export `pub mod contact;`.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task on the local database and verify counters:
  - Total processed: **785**
  - Emails synced: **~620**
  - Residences synced: **~732**
  - Phones synced: **~21**
  - `errors`: **0**
- Verify generated log file in `logs/sync_contact_details_*.log`.
- Query `contact_master.phones`, `electronic_mails`, and `residences` with `WHERE residenceable_type = 'App\Models\Person\Master\Individual'`.
