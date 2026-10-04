use chrono::Local;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    TransactionTrait,
};
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::Write;
use uuid::Uuid;

use crate::models::{
    academic::{
        campaign::transaction::grades as AcademicGrade,
        course::master::courses as AcademicCourse,
        general::reference::academic_years as AcademicYear,
        student::{
            campaign::convertions as AcademicConvertion,
            master::students as AcademicStudent,
        },
    },
    feeder::master::nilai_transfer_pendidikan_mahasiswa as FeederNilaiTransfer,
};
use crate::tasks::Task;

pub struct SyncNilaiTransferPendidikanMahasiswaToConvertions;

struct ReferenceCache {
    students_by_id_registrasi: HashMap<Uuid, AcademicStudent::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    courses_by_code: HashMap<String, AcademicCourse::Model>,
    grades_by_unit_and_name: HashMap<(Uuid, String), AcademicGrade::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_convertion(
    txn: &DatabaseTransaction,
    record: &FeederNilaiTransfer::Model,
    student: &AcademicStudent::Model,
    course: &AcademicCourse::Model,
    academic_year: Option<&AcademicYear::Model>,
    grade_id: Uuid,
) -> Result<(AcademicConvertion::Model, UpsertAction), sea_orm::DbErr> {
    let existing = if let Some(id_transfer) = record.id_transfer {
        AcademicConvertion::Entity::find()
            .filter(AcademicConvertion::Column::FeederId.eq(id_transfer))
            .one(txn)
            .await?
    } else {
        None
    };

    let existing = match existing {
        Some(e) => Some(e),
        None => {
            AcademicConvertion::Entity::find()
                .filter(AcademicConvertion::Column::StudentId.eq(student.id))
                .filter(AcademicConvertion::Column::CourseId.eq(course.id))
                .one(txn)
                .await?
        }
    };

    let name = format!(
        "NilaiTransferPendidikanMahasiswa {} {} {}",
        student.code,
        academic_year.map(|ay| ay.feeder_name.as_str()).unwrap_or(""),
        course.code
    );
    let now = Local::now().naive_local();
    let credit = record.sks_mata_kuliah_asal.unwrap_or(0.0) as f64;
    let transfer_credit = record.sks_mata_kuliah_diakui.unwrap_or(0.0) as f64;

    if let Some(existing) = existing {
        let mut active = existing.into_active_model();
        active.feeder_id = Set(record.id_transfer);
        active.student_id = Set(student.id);
        active.academic_year_id = Set(academic_year.map(|ay| ay.id));
        active.course_id = Set(course.id);
        active.grade_id = Set(grade_id);
        active.name = Set(Some(name));
        active.origin_code = Set(record.kode_mata_kuliah_asal.clone());
        active.origin_name = Set(record.nama_mata_kuliah_asal.clone());
        active.origin_credit = Set(Some(credit));
        active.origin_grade = Set(record.nilai_huruf_asal.clone());
        active.transfer_code = Set(record
            .kode_matkul_diakui
            .clone()
            .unwrap_or_else(|| course.code.clone()));
        active.transfer_name = Set(record
            .nama_mata_kuliah_diakui
            .clone()
            .unwrap_or_else(|| course.name.clone()));
        active.transfer_credit = Set(transfer_credit);
        active.transfer_grade = Set(record.nilai_huruf_diakui.clone().unwrap_or_default());
        active.is_lock = Set(Some(now));
        active.deleted_at = Set(None);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let active = AcademicConvertion::ActiveModel {
            id: Set(Uuid::new_v4()),
            student_id: Set(student.id),
            course_id: Set(course.id),
            grade_id: Set(grade_id),
            transfer_code: Set(record
                .kode_matkul_diakui
                .clone()
                .unwrap_or_else(|| course.code.clone())),
            transfer_name: Set(record
                .nama_mata_kuliah_diakui
                .clone()
                .unwrap_or_else(|| course.name.clone())),
            transfer_credit: Set(transfer_credit),
            transfer_grade: Set(record.nilai_huruf_diakui.clone().unwrap_or_default()),
            is_lock: Set(Some(now)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            deleted_at: Set(None),
            sync_at: Set(Some(now)),
            feeder_id: Set(record.id_transfer),
            name: Set(Some(name)),
            academic_year_id: Set(academic_year.map(|ay| ay.id)),
            origin_code: Set(record.kode_mata_kuliah_asal.clone()),
            origin_name: Set(record.nama_mata_kuliah_asal.clone()),
            origin_credit: Set(Some(credit)),
            origin_grade: Set(record.nilai_huruf_asal.clone()),
            ..Default::default()
        };

        let inserted = active.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncNilaiTransferPendidikanMahasiswaToConvertions {
    fn name(&self) -> &str {
        "SyncNilaiTransferPendidikanMahasiswaToConvertions"
    }

    fn description(&self) -> &str {
        "Synchronize Feeder Dikti nilai_transfer_pendidikan_mahasiswa to academic_student_campaign convertions"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args
            .iter()
            .any(|arg| arg == "--no-progress" || arg == "false");

        let log_dir = "logs";
        std::fs::create_dir_all(log_dir)?;
        let log_file_path = format!(
            "{}/sync_nilai_transfer_{}.log",
            log_dir,
            Local::now().format("%Y%m%d_%H%M%S")
        );
        let mut log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file_path)?;

        macro_rules! log_and_print {
            ($($arg:tt)*) => {
                let msg = format!($($arg)*);
                writeln!(log_file, "[{}] {}", Local::now().format("%Y-%m-%d %H:%M:%S"), msg)?;
                if !show_progress {
                    println!("{}", msg);
                }
            };
        }

        log_and_print!("Starting synchronization of nilai_transfer_pendidikan_mahasiswa to convertions...");

        // Preload students
        let students = AcademicStudent::Entity::find()
            .filter(AcademicStudent::Column::IdRegistrasiMahasiswa.is_not_null())
            .all(db)
            .await?;
        let mut students_by_id_registrasi = HashMap::new();
        for s in students {
            if let Some(reg_id) = s.id_registrasi_mahasiswa {
                students_by_id_registrasi.insert(reg_id, s);
            }
        }

        // Preload academic years
        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_feeder_name = HashMap::new();
        for y in years {
            years_by_feeder_name.insert(y.feeder_name.clone(), y);
        }

        // Preload courses
        let courses = AcademicCourse::Entity::find().all(db).await?;
        let mut courses_by_feeder_id = HashMap::new();
        let mut courses_by_code = HashMap::new();
        for c in courses {
            if let Some(fid) = c.feeder_course_id {
                courses_by_feeder_id.insert(fid, c.clone());
            }
            courses_by_code.insert(c.code.clone(), c);
        }

        // Preload grades
        let grades = AcademicGrade::Entity::find().all(db).await?;
        let mut grades_by_unit_and_name = HashMap::new();
        for g in grades {
            grades_by_unit_and_name.insert((g.unit_id, g.name.clone()), g);
        }

        let cache = ReferenceCache {
            students_by_id_registrasi,
            years_by_feeder_name,
            courses_by_feeder_id,
            courses_by_code,
            grades_by_unit_and_name,
        };

        let total_records = FeederNilaiTransfer::Entity::find()
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
            let batch = FeederNilaiTransfer::Entity::find()
                .order_by_asc(FeederNilaiTransfer::Column::Id)
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
                        log_and_print!("ERROR: Failed to begin transaction: {}", e);
                        errors += 1;
                        continue;
                    }
                };

                let id_registrasi = match record.id_registrasi_mahasiswa {
                    Some(id) => id,
                    None => {
                        let _ = txn.rollback().await;
                        log_and_print!(
                            "SKIPPED: Missing id_registrasi_mahasiswa for record id: {}",
                            record.id
                        );
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
                        log_and_print!(
                            "SKIPPED: Student not found for id_registrasi_mahasiswa {} (record id: {})",
                            id_registrasi,
                            record.id
                        );
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let course = if let Some(id_matkul) = record.id_matkul {
                    cache.courses_by_feeder_id.get(&id_matkul)
                } else if let Some(ref code) = record.kode_matkul_diakui {
                    cache.courses_by_code.get(code)
                } else {
                    None
                };

                let course = match course {
                    Some(c) => c,
                    None => {
                        let _ = txn.rollback().await;
                        log_and_print!(
                            "SKIPPED: Course not found for id_matkul {:?} / kode_matkul_diakui {:?} (record id: {})",
                            record.id_matkul,
                            record.kode_matkul_diakui,
                            record.id
                        );
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let academic_year = record
                    .id_periode_masuk
                    .as_ref()
                    .and_then(|p| cache.years_by_feeder_name.get(p));

                let grade_id = record
                    .nilai_huruf_diakui
                    .as_ref()
                    .and_then(|grade_name| {
                        cache
                            .grades_by_unit_and_name
                            .get(&(student.unit_id, grade_name.clone()))
                    })
                    .map(|g| g.id)
                    .unwrap_or_else(Uuid::nil);

                match upsert_convertion(
                    &txn,
                    &record,
                    student,
                    course,
                    academic_year,
                    grade_id,
                )
                .await
                {
                    Ok((_, action)) => {
                        if let Err(e) = txn.commit().await {
                            log_and_print!(
                                "ERROR: Failed to commit transaction for record {}: {}",
                                record.id,
                                e
                            );
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
                        log_and_print!(
                            "ERROR: Failed to upsert convertion for record {}: {}",
                            record.id,
                            e
                        );
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
                inserted, updated, skipped, errors, log_file_path
            ));
        }

        log_and_print!(
            "Summary: inserted: {}, updated: {}, skipped: {}, errors: {}",
            inserted,
            updated,
            skipped,
            errors
        );

        Ok(())
    }
}
