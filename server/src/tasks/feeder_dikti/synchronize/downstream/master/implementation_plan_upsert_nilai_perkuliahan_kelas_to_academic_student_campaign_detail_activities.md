# Deskripsi Capaian

Implement a data synchronization task that upserts records from the Feeder Dikti table `feeder_master.detail_nilai_perkuliahan_kelas` to the Academic system table `academic_student_campaign.detail_activities`. The task will read data from the local `feeder_master` schema and populate the `academic_student_campaign` schema.

## Proposed Changes

### Task Implementation

#### [MODIFY] [upsert_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/upsert_nilai_perkuliahan_kelas_to_academic_student_campaign_detail_activities.rs)

- Implement a struct `SyncNilaiPerkuliahanKelasToDetailActivities` that implements the `crate::tasks::Task` trait.
- loop data every 1000 data Fetch all records (or batch fetch) from `crate::models::feeder::master::nilai_perkuliahan_kelas::Entity`.

- search data course from `academic_course_master.course` where `academic_course_master.course.feeder_course_id = feeder_master.detail_nilai_perkuliahan_kelas.id_matkul`
- search data teach from `academic_teacher_campaign.teaches` where `academic_teacher_campaign.teaches.feeder_id = feeder_master.detail_nilai_perkuliahan_kelas.id_kelas_kuliah`
- search data student from `academic_student_master.students` where `academic_student_master.students.id_mahasiswa = feeder_master.detail_nilai_perkuliahan_kelas.id_mahasiswa` or `academic_student_master.students.id_registrasi_mahasiswa = feeder_master.detail_nilai_perkuliahan_kelas.id_registrasi_mahasiswa`
- search data grade from `academic_campaign_transaction.grades` where `academic_campaign_transaction.grades.name = feeder_master.detail_nilai_perkuliahan_kelas.nilai_huruf` and `academic_campaign_transaction.grades.unit_id` = student.unit_id
- search data student_activity from `academic_student_campaign.student_activities` where `academic_student_campaign.student_activities.unit_activity_id` = teach.activity_id and `academic_student_campaign.student_activities.student_id` = student.id
- search data detail_activities from `academic_student_campaign.detail_activities` where `academic_student_campaign.detail_activities.activity_id` = student_activity.id and `academic_student_campaign.detail_activities.course_id` = course.id and `academic_student_campaign.detail_activities.teach_id` = teach.id
- upsert data
  - detail_activities.feeder_id = feeder_master.detail_nilai_perkuliahan_kelas.id
  - detail_activities.feeder_grade_id = feeder_master.detail_nilai_perkuliahan_kelas.id
  - detail_activities.mark = feeder_master.detail_nilai_perkuliahan_kelas.nilai_angka
  - detail_activities.grade_id = grade.id
  - detail_activities.is_lock = true
  
#### [MODIFY] [mod.rs](file:///home/bendo01/Projects/xsia_xarx/server/src/tasks/feeder_dikti/synchronize/downstream/master/mod.rs)

- Export the newly created task module so it can be registered in the worker pool.

## Verification Plan

### Automated Tests

- `cargo check` to ensure the mappings and SeaORM trait bounds are fully satisfied.

### Manual Verification

- We can manually trigger the task or inspect the database query generation via standard out logging to ensure the upsert statement matches our expectations.
