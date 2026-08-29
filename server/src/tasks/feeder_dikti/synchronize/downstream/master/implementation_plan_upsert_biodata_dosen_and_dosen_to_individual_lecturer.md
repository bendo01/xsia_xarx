# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.biodata_dosen` and `feeder_master.dosen` to the Academic system table `person_master.individuals` and `academic_lecturer_master.lecturers`. The task will read data from the local `feeder_master` schema and populate the `person_master` and `academic_lecturer_master` schema.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities.rs)

- Implement a struct `SyncBiodataDosenToAcademicLecturerMasterLecturer` that implements the `crate::tasks::Task` trait.
- loop data every 1000 data Fetch all records (or batch fetch) from `crate::models::feeder::master::dosen::Entity`.

- search data course from `academic_course_master.course` where `academic_course_master.course.feeder_course_id = feeder_master.detail_nilai_perkuliahan_kelas.id_matkul`

  
#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Export the newly created task module so it can be registered in the worker pool.

## Verification Plan

### Automated Tests

- `cargo check` to ensure the mappings and SeaORM trait bounds are fully satisfied.

### Manual Verification

- We can manually trigger the task or inspect the database query generation via standard out logging to ensure the upsert statement matches our expectations.
