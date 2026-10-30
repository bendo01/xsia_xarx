use chrono::Local;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    TransactionTrait,
};
use std::collections::HashMap;
use uuid::Uuid;

use crate::models::{
    academic::{
        campaign::transaction::{
            activities as AcademicActivity, teaches as AcademicTeach,
        },
        course::master::courses as AcademicCourse,
        general::reference::academic_years as AcademicYear,
        student::{
            campaign::{
                detail_activities as AcademicDetailActivity,
                student_activities as AcademicStudentActivity,
            },
            master::students as AcademicStudent,
        },
    },
    feeder::master::peserta_kelas_kuliah as FeederPesertaKelasKuliah,
    institution::master::{institutions as Institution, units as InstitutionUnit},
};
use super::sync_log::SyncLog;
use crate::tasks::Task;
use serde_json::json;

pub struct SyncPesertaKelasKuliahToDetailActivities;

struct ReferenceCache {
    units_by_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_id: HashMap<Uuid, AcademicYear::Model>,
    activities_by_id: HashMap<Uuid, AcademicActivity::Model>,
    courses_by_id: HashMap<Uuid, AcademicCourse::Model>,
    teaches_by_feeder_id: HashMap<Uuid, AcademicTeach::Model>,
    students_by_id_registrasi: HashMap<Uuid, AcademicStudent::Model>,
    student_activities_by_student_and_unit_activity:
        HashMap<(Uuid, Uuid), AcademicStudentActivity::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

#[allow(clippy::too_many_arguments)]
async fn upsert_participant_detail_activity(
    txn: &DatabaseTransaction,
    record: &FeederPesertaKelasKuliah::Model,
    student: &AcademicStudent::Model,
    student_activity: &AcademicStudentActivity::Model,
    teach: &AcademicTeach::Model,
    course: &AcademicCourse::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicDetailActivity::Model, UpsertAction), sea_orm::DbErr> {
    // One live row per (activity, course): prefer the same class, but reuse a row left
    // on another class instead of inserting a duplicate.
    let existing_detail = AcademicDetailActivity::Entity::find()
        .filter(AcademicDetailActivity::Column::DeletedAt.is_null())
        .filter(AcademicDetailActivity::Column::ActivityId.eq(student_activity.id))
        .filter(AcademicDetailActivity::Column::CourseId.eq(course.id))
        .order_by_desc(AcademicDetailActivity::Column::TeachId.eq(teach.id))
        .order_by_desc(AcademicDetailActivity::Column::CreatedAt)
        .one(txn)
        .await?;

    let existing_detail = match existing_detail {
        Some(d) => Some(d),
        None => {
            AcademicDetailActivity::Entity::find()
                .filter(AcademicDetailActivity::Column::DeletedAt.is_null())
                .filter(AcademicDetailActivity::Column::FeederId.eq(record.id))
                .one(txn)
                .await?
        }
    };

    let detail_activity_name = format!(
        "DetailAktifitasPerkuliahan {} {} {} {} {}",
        institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
        unit.code.as_deref().unwrap_or(""),
        student.code,
        academic_year.feeder_name,
        course.code
    );
    let now = Local::now().naive_local();

    if let Some(existing) = existing_detail {
        let mut active = existing.into_active_model();
        active.name = Set(Some(detail_activity_name));
        active.teach_id = Set(Some(teach.id));
        active.credit = Set(Some(course.total_credit));
        active.feeder_id = Set(Some(record.id));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let active = AcademicDetailActivity::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(detail_activity_name)),
            feeder_id: Set(Some(record.id)),
            feeder_grade_id: Set(Some(Uuid::nil())),
            grade_id: Set(Some(Uuid::nil())),
            mark: Set(Some(0.0)),
            credit: Set(Some(course.total_credit)),
            curiculum_detail_sequence: Set(Some(0)),
            is_lock: Set(Some(false)),
            activity_id: Set(student_activity.id),
            teach_id: Set(Some(teach.id)),
            course_id: Set(course.id),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = active.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncPesertaKelasKuliahToDetailActivities {
    fn name(&self) -> &str {
        "SyncPesertaKelasKuliahToDetailActivities"
    }

    fn description(&self) -> &str {
        "Synchronize Feeder Dikti peserta_kelas_kuliah to academic_student_campaign detail_activities"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args
            .iter()
            .any(|arg| arg == "--no-progress" || arg == "false");

        let mut sync_log = SyncLog::open("peserta_kelas_kuliah", !show_progress)?;

        sync_log.info("Starting synchronization of peserta_kelas_kuliah to detail_activities...")?;

        // Preload units
        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_id = HashMap::new();
        for u in units {
            units_by_id.insert(u.id, u);
        }

        // Preload institutions
        let institutions = Institution::Entity::find().all(db).await?;
        let mut institutions_by_id = HashMap::new();
        for inst in institutions {
            institutions_by_id.insert(inst.id, inst);
        }

        // Preload academic years
        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_id = HashMap::new();
        for y in years {
            years_by_id.insert(y.id, y);
        }

        // Preload activities
        let activities = AcademicActivity::Entity::find().all(db).await?;
        let mut activities_by_id = HashMap::new();
        for act in activities {
            activities_by_id.insert(act.id, act);
        }

        // Preload courses
        let courses = AcademicCourse::Entity::find().all(db).await?;
        let mut courses_by_id = HashMap::new();
        for c in courses {
            courses_by_id.insert(c.id, c);
        }

        // Preload teaches
        let teaches = AcademicTeach::Entity::find().all(db).await?;
        let mut teaches_by_feeder_id = HashMap::new();
        for t in teaches {
            if let Some(fid) = t.feeder_id.filter(|id| !id.is_nil()) {
                teaches_by_feeder_id.insert(fid, t);
            }
        }

        // Preload students
        let students = AcademicStudent::Entity::find()
            .filter(AcademicStudent::Column::IdRegistrasiMahasiswa.is_not_null())
            .all(db)
            .await?;
        let mut students_by_id_registrasi = HashMap::new();
        for s in students {
            if let Some(reg_id) = s.id_registrasi_mahasiswa.filter(|id| !id.is_nil()) {
                students_by_id_registrasi.insert(reg_id, s);
            }
        }

        // Preload student activities
        let student_activities = AcademicStudentActivity::Entity::find().all(db).await?;
        let mut student_activities_by_student_and_unit_activity = HashMap::new();
        for sa in student_activities {
            student_activities_by_student_and_unit_activity.insert((sa.student_id, sa.unit_activity_id), sa);
        }

        let cache = ReferenceCache {
            units_by_id,
            institutions_by_id,
            years_by_id,
            activities_by_id,
            courses_by_id,
            teaches_by_feeder_id,
            students_by_id_registrasi,
            student_activities_by_student_and_unit_activity,
        };

        let total_records = FeederPesertaKelasKuliah::Entity::find()
            .count(db)
            .await?;

        let pb = if show_progress {
            let pb = ProgressBar::new(total_records);
            pb.set_style(
                ProgressStyle::default_bar()
                    .template("[{elapsed_precise}] [{bar:40.cyan/blue}] {pos}/{len} ({eta}) {msg}")
                    .unwrap()
                    .progress_chars("#>-"),
            );
            Some(pb)
        } else {
            None
        };

        let batch_size: u64 = 1000;
        let mut offset: u64 = 0;
        let mut inserted = 0;
        let mut updated = 0;
        let mut skipped = 0;
        let mut errors = 0;

        loop {
            let batch = FeederPesertaKelasKuliah::Entity::find()
                .order_by_asc(FeederPesertaKelasKuliah::Column::Id)
                .offset(offset)
                .limit(batch_size)
                .all(db)
                .await?;

            if batch.is_empty() {
                break;
            }

            for record in batch {
                let txn = match db.begin().await {
                    Ok(tx) => tx,
                    Err(e) => {
                        sync_log.record_error(
                            &record,
                            &format!("Failed to begin transaction: {}", e),
                        )?;
                        errors += 1;
                        continue;
                    }
                };

                let id_registrasi = match record.id_registrasi_mahasiswa.filter(|id| !id.is_nil()) {
                    Some(id) => id,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "missing_id_registrasi_mahasiswa",
                            json!({}),
                            "Missing or nil id_registrasi_mahasiswa",
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let student = match cache.students_by_id_registrasi.get(&id_registrasi) {
                    Some(s) => s,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "student_not_found",
                            json!({"id_registrasi_mahasiswa": id_registrasi}),
                            &format!("Student not found for id_registrasi_mahasiswa {}", id_registrasi),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let id_kelas_kuliah = match record.id_kelas_kuliah.filter(|id| !id.is_nil()) {
                    Some(id) => id,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "missing_id_kelas_kuliah",
                            json!({}),
                            "Missing or nil id_kelas_kuliah",
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let teach = match cache.teaches_by_feeder_id.get(&id_kelas_kuliah) {
                    Some(t) => t,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "teach_not_found",
                            json!({"id_kelas_kuliah": id_kelas_kuliah}),
                            &format!("Teach not found for feeder_id {}", id_kelas_kuliah),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let activity_id = match teach.activity_id {
                    Some(id) => id,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "teach_missing_activity",
                            json!({"teach_id": teach.id}),
                            &format!("Teach has no activity_id for teach {}", teach.id),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let activity = match cache.activities_by_id.get(&activity_id) {
                    Some(a) => a,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "activity_not_found",
                            json!({"activity_id": activity_id}),
                            &format!("Activity not found for id {}", activity_id),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let student_activity = match cache
                    .student_activities_by_student_and_unit_activity
                    .get(&(student.id, activity.id))
                {
                    Some(sa) => sa,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "student_activity_not_found",
                            json!({"student_id": student.id, "unit_activity_id": activity.id}),
                            &format!("Student activity not found for student_id {} and unit_activity_id {}", student.id, activity.id),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let course = match cache.courses_by_id.get(&teach.course_id) {
                    Some(c) => c,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "course_not_found",
                            json!({"course_id": teach.course_id}),
                            &format!("Course not found for id {}", teach.course_id),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let unit = match cache.units_by_id.get(&student.unit_id) {
                    Some(u) => u,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "unit_not_found",
                            json!({"unit_id": student.unit_id}),
                            &format!("Unit not found for student unit_id {}", student.unit_id),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let institution = cache.institutions_by_id.get(&unit.institution_id);

                let academic_year = match cache.years_by_id.get(&activity.academic_year_id) {
                    Some(ay) => ay,
                    None => {
                        let _ = txn.rollback().await;
                        sync_log.skip(
                            &record,
                            "academic_year_not_found",
                            json!({"academic_year_id": activity.academic_year_id}),
                            &format!("Academic year not found for id {}", activity.academic_year_id),
                        )?;
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                match upsert_participant_detail_activity(
                    &txn,
                    &record,
                    student,
                    student_activity,
                    teach,
                    course,
                    unit,
                    institution,
                    academic_year,
                )
                .await
                {
                    Ok((_, action)) => {
                        if let Err(e) = txn.commit().await {
                            sync_log.record_error(
                                &record,
                                &format!("Failed to commit transaction: {}", e),
                            )?;
                            errors += 1;
                        } else {
                            match action {
                                UpsertAction::Inserted => inserted += 1,
                                UpsertAction::Updated => updated += 1,
                            }
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        sync_log.record_error(
                            &record,
                            &format!("Failed to upsert participant detail activity: {}", e),
                        )?;
                        errors += 1;
                    }
                }

                if let Some(ref p) = pb {
                    p.inc(1);
                    p.set_message(format!(
                        "inserted: {} | updated: {} | skipped: {} | errors: {}",
                        inserted, updated, skipped, errors
                    ));
                }
            }

            offset += batch_size;
        }

        if let Some(ref p) = pb {
            p.finish_with_message(format!(
                "Sync completed - inserted: {} | updated: {} | skipped: {} | errors: {} (see {})",
                inserted, updated, skipped, errors, sync_log.text_path
            ));
        }

        let duplicates_removed = super::dedupe_detail_activities::soft_delete_duplicate_detail_activities(db).await?;
        if duplicates_removed > 0 {
            println!("Soft-deleted {} duplicate detail activities", duplicates_removed);
        }

        sync_log.summary(inserted, updated, skipped, errors)?;

        Ok(())
    }
}
