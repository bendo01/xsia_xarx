# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.aktifitas_mengajar_dosen` to the Academic system table `academic_campaign_transaction.teach_lecturers`. The task will read data from the local `feeder_master` schema and populate the `academic_campaign_transaction` schema.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_aktifitas_mengajar_dosen_to_academic_campaign_transaction_teach_lecturers.rs)

- Implement a struct `SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer` that implements the `crate::tasks::Task` trait.
- loop data every 1000 data Fetch all records (or batch fetch) from `crate::models::feeder::master::aktifitas_mengajar_dosen::Entity`.

- search data course from `academic_course_master.course` WHERE `academic_course_master.course.feeder_course_id = feeder_master.aktifitas_mengajar_dosen.id_matkul`
- search data lecturer from `academic_lecturer_master.lecturers` WHERE `academic_lecturer_master.lecturers.id_dosen = feeder_master.aktifitas_mengajar_dosen.id_dosen` OR WHERE `academic_lecturer_master.lecturers.id_registrasi_dosen = feeder_master.aktifitas_mengajar_dosen.id_registrasi_dosen`
- search data academic_year from `academic_general_reference.academic_years` WHERE `academic_general_reference.academic_years.feeder_name = feeder_master.aktifitas_mengajar_dosen.id_periode`
- search data unit from `institution_master.units` WHERE `institution_master.units.feeder_id = feeder_master.aktifitas_mengajar_dosen.id_prodi`
- search data unit_activity from `academic_campaign_transaction.activities` WHERE `academic_campaign_transaction.activities.unit_id` = unit.id AND `academic_campaign_transaction.activities.academic_year_id` = academic_year.id
- search data class_code from `academic_campaign_transaction.class_codes` WHERE `academic_campaign_transaction.class_codes.alphabet_code = feeder_master.aktifitas_mengajar_dosen.nama_kelas_kuliah` AND `academic_campaign_transaction.class_codes.unit_id` = unit.id
- search data teach from `academic_campaign_transaction.teaches` WHERE `academic_campaign_transaction.teaches.feeder_id = feeder_master.aktifitas_mengajar_dosen.id_kelas` if not exists then find data teach from `academic_campaign_transaction.teaches` WHERE `academic_campaign_transaction.teaches.class_code_id` = class_code.id AND `academic_campaign_transaction.teaches.course_id` = course.id AND `academic_campaign_transaction.teaches.activity_id` = unit_activity.id
- upsert data on `academic_campaign_transaction.teach_lecturers`
 - `academic_campaign_transaction.teach_lecturers.lecturer_id` = lecturer.id
 - `academic_campaign_transaction.teach_lecturers.teach_id` = teach.id
 - `academic_campaign_transaction.teach_lecturers.feeder_id` = record.id
 - `academic_campaign_transaction.teach_lecturers.planning` = record.rencana_minggu_pertemuan
 - `academic_campaign_transaction.teach_lecturers.realization` = record.realisasi_minggu_pertemuan
- create file on logs directory and write data record that cannot find teach data so it can be reviewed
- use indicatif crate to show progress bar, where it an be shown on optional parameter

  
#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Export the newly created task module so it can be registered in the worker pool.

## Verification Plan

### Automated Tests

- `cargo check` to ensure the mappings and SeaORM trait bounds are fully satisfied.

### Manual Verification

- We can manually trigger the task or inspect the database query generation via standard out logging to ensure the upsert statement matches our expectations.
