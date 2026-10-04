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
        campaign::transaction::activities as AcademicActivity,
        general::reference::academic_years as AcademicYear,
        student::{
            campaign::student_activities as AcademicStudentActivity,
            master::students as AcademicStudent,
            reference::{finances as AcademicFinance, statuses as AcademicStatus},
        },
    },
    feeder::master::perkuliahan_mahasiswa as FeederPerkuliahanMahasiswa,
};
use crate::tasks::Task;

pub struct SyncPerkuliahanMahasiswaToAcademicStudentActivities;

struct ReferenceCache {
    students_by_id_registrasi: HashMap<Uuid, AcademicStudent::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    statuses_by_code: HashMap<String, AcademicStatus::Model>,
    finances_by_code: HashMap<i32, AcademicFinance::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_student_activity(
    txn: &DatabaseTransaction,
    record: &FeederPerkuliahanMahasiswa::Model,
    student: &AcademicStudent::Model,
    unit_activity: &AcademicActivity::Model,
    academic_year: &AcademicYear::Model,
    status_id: Uuid,
    finance_id: Option<Uuid>,
) -> Result<(AcademicStudentActivity::Model, UpsertAction), sea_orm::DbErr> {
    let existing = AcademicStudentActivity::Entity::find()
        .filter(AcademicStudentActivity::Column::FeederId.eq(record.id))
        .one(txn)
        .await?;

    let existing = match existing {
        Some(e) => Some(e),
        None => {
            AcademicStudentActivity::Entity::find()
                .filter(AcademicStudentActivity::Column::StudentId.eq(student.id))
                .filter(AcademicStudentActivity::Column::UnitActivityId.eq(unit_activity.id))
                .one(txn)
                .await?
        }
    };

    let name = format!("Perkuliahan {} {}", academic_year.feeder_name, student.code);
    let cumulative_index = f64::from(record.ips.unwrap_or(0.0));
    let grand_cumulative_index = f64::from(record.ipk.unwrap_or(0.0));
    let total_credit = f64::from(record.sks_semester.unwrap_or(0.0));
    let grand_total_credit = f64::from(record.sks_total.unwrap_or(0.0));
    let finance_fee = record.biaya_kuliah_smt.unwrap_or(0.0) as f64;
    let now = Local::now().naive_local();

    if let Some(existing) = existing {
        let mut active = existing.into_active_model();
        active.name = Set(Some(name));
        active.cumulative_index = Set(cumulative_index);
        active.grand_cumulative_index = Set(grand_cumulative_index);
        active.total_credit = Set(Some(total_credit));
        active.grand_total_credit = Set(Some(grand_total_credit));
        active.finance_fee = Set(Some(finance_fee));
        active.status_id = Set(status_id);
        active.finance_id = Set(finance_id);
        active.is_lock = Set(Some(true));
        active.feeder_id = Set(Some(record.id));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let active = AcademicStudentActivity::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(name)),
            cumulative_index: Set(cumulative_index),
            grand_cumulative_index: Set(grand_cumulative_index),
            total_credit: Set(Some(total_credit)),
            grand_total_credit: Set(Some(grand_total_credit)),
            student_id: Set(student.id),
            unit_activity_id: Set(unit_activity.id),
            unit_id: Set(Some(student.unit_id)),
            status_id: Set(status_id),
            resign_status_id: Set(Some(Uuid::nil())),
            finance_id: Set(finance_id),
            finance_fee: Set(Some(finance_fee)),
            is_lock: Set(Some(true)),
            feeder_id: Set(Some(record.id)),
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
impl Task for SyncPerkuliahanMahasiswaToAcademicStudentActivities {
    fn name(&self) -> &str {
        "SyncPerkuliahanMahasiswaToAcademicStudentActivities"
    }

    fn description(&self) -> &str {
        "Synchronize Feeder Dikti perkuliahan_mahasiswa to academic_student_campaign student_activities"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args
            .iter()
            .any(|arg| arg == "--no-progress" || arg == "false");

        let log_dir = "logs";
        std::fs::create_dir_all(log_dir)?;
        let log_file_path = format!(
            "{}/sync_perkuliahan_mahasiswa_{}.log",
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

        log_and_print!("Starting synchronization of perkuliahan_mahasiswa to student_activities...");

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

        // Preload unit activities
        let activities = AcademicActivity::Entity::find().all(db).await?;
        let mut activities_by_unit_and_year = HashMap::new();
        for act in activities {
            activities_by_unit_and_year.insert((act.unit_id, act.academic_year_id), act);
        }

        // Preload statuses
        let statuses = AcademicStatus::Entity::find().all(db).await?;
        let mut statuses_by_code = HashMap::new();
        for st in statuses {
            if let Some(ref code) = st.alphabet_code {
                statuses_by_code.insert(code.clone(), st);
            }
        }

        // Preload finances
        let finances = AcademicFinance::Entity::find().all(db).await?;
        let mut finances_by_code = HashMap::new();
        for f in finances {
            finances_by_code.insert(f.code, f);
        }

        let cache = ReferenceCache {
            students_by_id_registrasi,
            years_by_feeder_name,
            activities_by_unit_and_year,
            statuses_by_code,
            finances_by_code,
        };

        let total_records = FeederPerkuliahanMahasiswa::Entity::find()
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
            let batch = FeederPerkuliahanMahasiswa::Entity::find()
                .order_by_asc(FeederPerkuliahanMahasiswa::Column::Id)
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

                let id_semester = match record.id_semester.as_ref() {
                    Some(s) => s,
                    None => {
                        let _ = txn.rollback().await;
                        log_and_print!("SKIPPED: Missing id_semester for record id: {}", record.id);
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let academic_year = match cache.years_by_feeder_name.get(id_semester) {
                    Some(y) => y,
                    None => {
                        let _ = txn.rollback().await;
                        log_and_print!(
                            "SKIPPED: Academic year not found for id_semester {} (record id: {})",
                            id_semester,
                            record.id
                        );
                        skipped += 1;
                        if let Some(ref p) = pb {
                            p.inc(1);
                        }
                        continue;
                    }
                };

                let unit_activity =
                    match cache.activities_by_unit_and_year.get(&(student.unit_id, academic_year.id)) {
                        Some(ua) => ua,
                        None => {
                            let _ = txn.rollback().await;
                            log_and_print!(
                                "SKIPPED: Unit activity not found for unit_id {} and academic_year_id {} (record id: {})",
                                student.unit_id,
                                academic_year.id,
                                record.id
                            );
                            skipped += 1;
                            if let Some(ref p) = pb {
                                p.inc(1);
                            }
                            continue;
                        }
                    };

                let status_id = record
                    .id_status_mahasiswa
                    .as_ref()
                    .and_then(|code| cache.statuses_by_code.get(code))
                    .map(|s| s.id)
                    .unwrap_or_else(Uuid::nil);

                let finance_id = record
                    .id_pembiayaan
                    .as_ref()
                    .and_then(|s| s.parse::<i32>().ok())
                    .and_then(|code| cache.finances_by_code.get(&code))
                    .map(|f| f.id);

                match upsert_student_activity(
                    &txn,
                    &record,
                    student,
                    unit_activity,
                    academic_year,
                    status_id,
                    finance_id,
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
                            "ERROR: Failed to upsert student activity for record {}: {}",
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
