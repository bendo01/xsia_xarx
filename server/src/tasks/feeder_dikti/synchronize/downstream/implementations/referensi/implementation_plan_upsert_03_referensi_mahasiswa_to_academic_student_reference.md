# Deskripsi Capaian

Implement a comprehensive reference synchronization task that upserts student-related dictionaries from Feeder Dikti tables to `academic_student_reference` tables:
- `feeder_referensi.jenis_pendaftaran` ➔ `academic_student_reference.registrations`
- `feeder_referensi.jenis_keluar` ➔ `academic_student_reference.resign_statuses`
- `feeder_referensi.status_mahasiswa` ➔ `academic_student_reference.statuses`
- `feeder_referensi.pembiayaan` ➔ `academic_student_reference.finances`

These tables represent the core classification dependencies for student registration, study status, scholarship financing, and graduation/dropout processing.

> Standardizes multi-dictionary reference synchronization, deterministic code matching, fault-tolerant per-record transactions, and live progress reporting.

## Data Findings (local DB snapshot)

- `feeder_referensi.jenis_pendaftaran` = **10 rows** (`id_jenis_daftar: i32`, `nama_jenis_daftar: String`):
  - 1 (Peserta didik baru), 2 (Pindahan), 3 (Naik kelas), 4 (Akselerasi), 5 (Mengulang), 6 (Lanjutan semester), 7 (Alih fungsi), 8 (Lintas jalur), 9 (RPL transfer SKS), 99 (Lainnya).
- `feeder_referensi.jenis_keluar` = **7 rows** (`id_jenis_keluar: String`, `nama_jenis_keluar: String`):
  - 1 (Lulus), 2 (Mutasi), 3 (Dikeluarkan), 4 (Mengundurkan diri), 5 (Putus Sekolah), 6 (Wafat), 7 (Hilang).
- `feeder_referensi.status_mahasiswa` = **5 rows** (`id_status_mahasiswa: String`, `nama_status_mahasiswa: String`):
  - `'A'` (Aktif), `'C'` (Cuti), `'G'` (Sedang Double Degree), `'M'` (Kampus Merdeka), `'N'` (Non-Aktif).
- `feeder_referensi.pembiayaan` = **3 rows** (`id_pembiayaan: String`, `nama_pembiayaan: String`):
  - 1 (Mandiri), 2 (Beasiswa Tidak Penuh), 3 (Beasiswa Penuh).
- `academic_student_reference`:
  - `registrations` has 20 rows.
  - `resign_statuses` has 10 rows.
  - `statuses` has 9 rows.
  - `finances` has 3 rows.
- Target keys: Match primarily by `alphabet_code = id` or `code = id::i32` or lowercase `name`.

## Proposed Changes

### Task Implementation

#### [NEW] [upsert_03_referensi_mahasiswa_to_academic_student_reference.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/upsert_03_referensi_mahasiswa_to_academic_student_reference.rs)

- Implement `SyncReferensiMahasiswaToAcademicStudentReference` implementing the `crate::tasks::Task` trait.
- Process in 4 sequential stages:
  1. Stage 1: Registrations (`feeder_referensi.jenis_pendaftaran`, 10 records).
  2. Stage 2: Resign Statuses (`feeder_referensi.jenis_keluar`, 7 records).
  3. Stage 3: Student Statuses (`feeder_referensi.status_mahasiswa`, 5 records).
  4. Stage 4: Finances (`feeder_referensi.pembiayaan`, 3 records).
- Process each record in its own database transaction (`db.begin().await`).

#### Upsert Methods

```rust
enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_registration(
    txn: &DatabaseTransaction,
    record: &FeederJenisPendaftaran::Model,
) -> Result<UpsertAction, sea_orm::DbErr>;

async fn upsert_resign_status(
    txn: &DatabaseTransaction,
    record: &FeederJenisKeluar::Model,
) -> Result<UpsertAction, sea_orm::DbErr>;

async fn upsert_student_status(
    txn: &DatabaseTransaction,
    record: &FeederStatusMahasiswa::Model,
) -> Result<UpsertAction, sea_orm::DbErr>;

async fn upsert_finance(
    txn: &DatabaseTransaction,
    record: &FeederPembiayaan::Model,
) -> Result<UpsertAction, sea_orm::DbErr>;
```

##### Field Synchronization Rules

1. **`registrations`**:
   - Find: `academic_student_reference.registrations` WHERE `alphabet_code = record.id_jenis_daftar.to_string()` OR `code = record.id_jenis_daftar` OR `LOWER(name) = LOWER(record.nama_jenis_daftar)`.
   - Update `name`, `code`, `alphabet_code`, `sync_at`, `updated_at`.
   - Insert if not found with `Uuid::new_v4()`.
2. **`resign_statuses`**:
   - Find: `academic_student_reference.resign_statuses` WHERE `alphabet_code = record.id_jenis_keluar` OR `LOWER(name) = LOWER(record.nama_jenis_keluar)`.
   - Update `name`, `alphabet_code`, `code = id_jenis_keluar.parse().unwrap_or(0)`, `sync_at`, `updated_at`.
   - Insert if not found with `Uuid::new_v4()`.
3. **`statuses`**:
   - Find: `academic_student_reference.statuses` WHERE `alphabet_code = record.id_status_mahasiswa` OR `LOWER(name) = LOWER(record.nama_status_mahasiswa)`.
   - Update `name`, `alphabet_code`, `sync_at`, `updated_at`.
   - Insert if not found with `Uuid::new_v4()`.
4. **`finances`**:
   - Find: `academic_student_reference.finances` WHERE `code = record.id_pembiayaan.parse().unwrap_or(0)` OR `LOWER(name) = LOWER(record.nama_pembiayaan)`.
   - Update `name`, `code`, `sync_at`, `updated_at`.
   - Insert if not found with `Uuid::new_v4()`.

#### Logging & Progress

- Create log file `logs/sync_referensi_mahasiswa_{YYYYMMDD_HHMMSS}.log`.
- Progress bar:
  - Total records = 10 + 7 + 5 + 3 = 25.
  - Live message: `format!("registrations: {r} | resigns: {x} | statuses: {s} | finances: {f} | errors: {errors}")`

#### [MODIFY] [referensi/mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/referensi/mod.rs)

- Export `pub mod upsert_03_referensi_mahasiswa_to_academic_student_reference;`.

## Verification Plan

### Automated Tests

- `cargo check --bin xsia_xarx` to verify types, relations, and compilation.

### Manual Verification

- Run the task and verify:
  - Total records processed: **25**
  - `errors`: **0**
- Verify generated log file in `logs/sync_referensi_mahasiswa_*.log`.
- Verify database records in `academic_student_reference.registrations`, `resign_statuses`, `statuses`, and `finances`.
