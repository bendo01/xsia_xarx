# Deskripsi Capaian

Implement a data synchronization task that upserts lecturer contact information (phone numbers, mobile numbers, email addresses, and residential addresses) from Feeder Dikti table `feeder_master.biodata_dosen` to the Contact system tables:

- `contact_master.phones`
- `contact_master.electronic_mails`
- `contact_master.residences`

All contact records are linked polymorphically to `person_master.individuals` via `phoneable`, `electronic_mailable`, and `residenceable` relations (`residenceable_type = "App\Models\Person\Master\Individual"`). The task resolves default reference types from `contact_reference` and geographical hierarchy from `location` (`provinces`, `regencies`, `sub_districts`) utilizing Dikti wilayah codes (`dikti_code`) as well as Kemendagri codes (`code`).

> Standardizes polymorphic contact synchronization for lecturers, preloads in-memory reference and location caches, and provides fault-tolerant per-record transactions with live progress tracking (`indicatif`).

## Data Findings (local DB snapshot)

### Source Data Distribution

- `feeder_master.biodata_dosen` = **77 rows**:
  - Non-empty `telepon` = **16 rows**
  - Non-empty `handphone` = **60 rows** (all 16 records with `telepon` also have `handphone`)
  - Non-empty `email` = **59 rows**
  - Non-empty `jalan` = **77 rows** (100%)
  - Non-empty `id_wilayah` = **77 rows** (100%)
  - Non-empty `nik` = **77 rows** (100%)
  - `rt` and `rw` are stored as `Option<String>` in `biodata_dosen` and must be parsed safely to integer values.

### Target & Reference Dependencies

- `person_master.individuals`:
  - 76 / 77 `biodata_dosen` match `individuals.code = TRIM(bd.nik)`.
  - 1 unmatched individual (NIK `7371147001980001`) is logged as `INDIVIDUAL_NOT_FOUND` and skipped.
- `contact_reference`:
  - `phone_types`: Default to `"Pribadi"` (`alphabet_code = 'B'`, ID `5cf06051-0434-4581-807f-52ee40c7b7bf`).
  - `electronic_mail_types`: Default to `"Pribadi"` (`alphabet_code = 'B'`, ID `3df226c0-3280-48f3-b8b5-168dff719e54`).
  - `residence_types`: Default to `"Bangunan Rumah Tinggal"` (`alphabet_code = 'A'`, ID `a24667c1-6e1f-4b00-982f-b3b297bc4d60`).
- `location` Hierarchy Resolution:
  - `id_wilayah` in Feeder Dikti uses Dikti wilayah codes (e.g. `196013` for Kec. Rappocini, `196000` for Kota Makassar).
  - 25 rows match `location.sub_districts.dikti_code` (or `code`) directly -> resolves `sub_district_id`, `regency_id`, and parent `province_id`.
  - 51 rows match `location.regencies.dikti_code` (or `code`) directly (e.g. `196000` Kota Makassar) -> resolves `regency_id` and parent `province_id` with `sub_district_id = None`.
  - 1 row has `id_wilayah = '999999'` ("tidak ada" / outside region) -> resolved with `None` for sub_district, regency, and province.

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

#### [NEW] [upsert_22_biodata_dosen_to_contact_details.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_22_biodata_dosen_to_contact_details.rs)

- Implement `SyncBiodataDosenToContactDetails` implementing the `crate::tasks::Task` trait.
- **Preload static references once before the processing loop** into `HashMap`:
  - `individuals` keyed by `code: String` (NIK)
  - `sub_districts` keyed by `dikti_code` and `code`
  - `regencies` keyed by `dikti_code`, `code`, and `id`
  - `provinces` keyed by `dikti_code`, `code`, and `id`
  - Default type UUIDs for phone, email, and residence.
- Process `feeder_master.biodata_dosen` in batches of 1000 (`order_by_asc(Id)`).
- **Fault-tolerant per-record transaction**: Wrap each lecturer's contact upserts in an isolated transaction (`db.begin().await`).

#### Reference Cache Struct

```rust
struct ReferenceCache {
    individuals_by_nik: HashMap<String, PersonIndividual::Model>,
    sub_districts_by_dikti_code: HashMap<String, LocationSubDistrict::Model>,
    sub_districts_by_code: HashMap<String, LocationSubDistrict::Model>,
    regencies_by_id: HashMap<Uuid, LocationRegency::Model>,
    regencies_by_dikti_code: HashMap<String, LocationRegency::Model>,
    regencies_by_code: HashMap<String, LocationRegency::Model>,
    provinces_by_dikti_code: HashMap<String, LocationProvince::Model>,
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
    rt: i32,
    rw: i32,
    id_wilayah: Option<&str>,
    cache: &ReferenceCache,
) -> Result<UpsertAction, sea_orm::DbErr>;
```

##### Field Synchronization Rules

1. **`phones`**:
   - Synchronize both `telepon` and `handphone` if present.
   - Clean number: strip whitespace, dashes, slashes, parentheses. Skip if empty or fewer than 5 digits.
   - Find: `contact_master.phones` WHERE `phoneable_type = "App\Models\Person\Master\Individual" AND phoneable_id = individual_id AND phone_number = cleaned_phone`.
   - If not found: insert with `Uuid::new_v4()`, `phone_type_id = default_phone_type_id`, `created_at = now`, `updated_at = now`, `sync_at = now`.
   - If found: update `phone_type_id = default_phone_type_id`, `updated_at = now`, `sync_at = now`.
2. **`electronic_mails`**:
   - Clean email: lowercase, strip whitespace. Skip if empty or does not contain `'@'` and `'.'`.
   - Find: `contact_master.electronic_mails` WHERE `electronic_mailable_type = "App\Models\Person\Master\Individual" AND electronic_mailable_id = individual_id AND email_address = cleaned_email`.
   - If not found: insert with `Uuid::new_v4()`, `electronic_mail_type_id = default_email_type_id`, `created_at = now`, `updated_at = now`, `sync_at = now`.
   - If found: update `electronic_mail_type_id = default_email_type_id`, `updated_at = now`, `sync_at = now`.
3. **`residences`**:
   - Find: `contact_master.residences` WHERE `residenceable_type = "App\Models\Person\Master\Individual" AND residenceable_id = individual_id`.
   - Resolve location hierarchy using `id_wilayah`:
     - If matched in `sub_districts_by_dikti_code` or `sub_districts_by_code`: yields `sub_district_id`, `regency_id = sd.regency_id`, `province_id = regency.province_id`.
     - Else if matched in `regencies_by_dikti_code` or `regencies_by_code`: yields `sub_district_id = None`, `regency_id = r.id`, `province_id = r.province_id`.
     - Else if matched in `provinces_by_dikti_code` or `provinces_by_code`: yields `sub_district_id = None`, `regency_id = None`, `province_id = p.id`.
     - Fallback: check 4-digit prefix against regency and 2-digit prefix against province.
   - Parse `rt` and `rw` safely from string to integer (defaulting to 0).
   - Normalize `street` (defaulting to `"-"` if empty).
   - If not found: insert new residence with `street`, `neighborhood_association` (RT), `citizens_association` (RW), resolved location IDs, `residence_type_id = default_residence_type_id`, `residenceable_type = Some("App\Models\Person\Master\Individual")`, `residenceable_id = Some(individual_id)`, `created_at = now`, `updated_at = now`, `sync_at = now`.
   - If found: update `street`, `rt`, `rw`, location IDs, `residence_type_id = default_residence_type_id`, `updated_at = now`, `sync_at = now`.

#### Logging & Progress

- **Progress Bar (`indicatif`)**:
  - Controlled by task arguments: shown by default; disabled if `args.iter().any(|arg| arg == "false" || arg == "--no-progress")`.
  - **Stage 1 (Counting)**: Indeterminate spinner with steady 100ms tick and message `"Counting feeder biodata_dosen records..."`.
    - Style: `ProgressStyle::default_spinner().template("{spinner:.green} [{elapsed_precise}] {msg}")`
  - **Stage 2 (Processing)**: Deterministic bar initialized with `total_records`.
    - Style: `ProgressStyle::default_bar().template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}").progress_chars("#>-")`
  - **Live Progress Updates**: Advance position with `pb.inc(1)` and update message with live counters:
    - `format!("phones: {phones_synced} | emails: {emails_synced} | residences: {residences_synced} | skipped: {skipped}")`
  - **Completion**: Call `pb.finish_with_message(...)` (or `println!` if disabled) with the final summary message:
    - `format!("Sync completed - phones: {phones_synced} | emails: {emails_synced} | residences: {residences_synced} | skipped: {skipped}")`

#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/mod.rs)

- Register `SyncBiodataDosenToContactDetails` in `server/src/tasks/mod.rs` so it is executable via `cargo run --bin xsia_xarx -- task SyncBiodataDosenToContactDetails`.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, SeaORM entity mapping, and compilation correctness.

### Manual Verification

- Run the task against the database:
  `cargo run --bin xsia_xarx -- task SyncBiodataDosenToContactDetails`
- Expected metrics for 77 lecturer records:
  - Total processed: **77**
  - Phones synced: **~76** (16 telepon + 60 handphone)
  - Emails synced: **59**
  - Residences synced: **76**
  - Skipped: **1** (NIK `7371147001980001` individual not found)
- Verify data in tables via query:
  `SELECT count(*) FROM contact_master.phones WHERE phoneable_type = 'App\Models\Person\Master\Individual';`
