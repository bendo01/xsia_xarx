use salvo::async_trait;
use sea_orm::prelude::Decimal;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, QueryFilter, QueryOrder, QuerySelect, TransactionTrait,
};
use uuid::Uuid;
use std::collections::HashMap;
use std::fs::OpenOptions;
use std::io::Write;
use chrono::Local;

use crate::tasks::Task;

use crate::models::feeder::master::aktifitas_mengajar_dosen as FeederAktifitas;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::academic::lecturer::master::lecturers as AcademicLecturer;
use crate::models::academic::general::reference::academic_years as AcademicYear;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::institution::master::institutions as Institution;
use crate::models::academic::campaign::transaction::activities as AcademicActivity;
use crate::models::academic::campaign::transaction::class_codes as AcademicClassCode;
use crate::models::academic::campaign::transaction::teaches as AcademicTeach;
use crate::models::academic::campaign::transaction::teach_lecturers as AcademicTeachLecturer;

pub struct SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer;

struct ReferenceCache {
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

#[allow(clippy::too_many_arguments)]
async fn upsert_teach_lecturer(
    txn: &DatabaseTransaction,
    record: &FeederAktifitas::Model,
    lecturer: &AcademicLecturer::Model,
    teach: &AcademicTeach::Model,
    course: &AcademicCourse::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
) -> Result<(AcademicTeachLecturer::Model, UpsertAction), sea_orm::DbErr> {
    let existing_teach_lecturer = AcademicTeachLecturer::Entity::find()
        .filter(AcademicTeachLecturer::Column::LecturerId.eq(lecturer.id))
        .filter(AcademicTeachLecturer::Column::TeachId.eq(teach.id))
        .one(txn)
        .await?;

    let lecturer_code = if !lecturer.code.is_empty() {
        lecturer.code.as_str()
    } else {
        lecturer.nuptk.as_deref().unwrap_or("-")
    };

    let name = format!(
        "DosenAktifitasPengajaran {} {} {} {} {}",
        institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
        unit.code.as_deref().unwrap_or(""),
        academic_year.feeder_name,
        course.code,
        lecturer_code
    );

    let planning = record.rencana_minggu_pertemuan.unwrap_or(0);
    let realization = record.realisasi_minggu_pertemuan.unwrap_or(0);
    let now = Local::now().naive_local();

    if let Some(existing) = existing_teach_lecturer {
        let mut active = existing.into_active_model();
        active.name = Set(Some(name));
        active.planning = Set(planning);
        active.realization = Set(realization);
        active.credit = Set(Some(Decimal::ZERO));
        active.feeder_id = Set(Some(record.id));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_model = AcademicTeachLecturer::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(name)),
            planning: Set(planning),
            realization: Set(realization),
            credit: Set(Some(Decimal::ZERO)),
            is_lecturer_home_base: Set(false),
            lecturer_id: Set(lecturer.id),
            teach_id: Set(teach.id),
            feeder_id: Set(Some(record.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_model.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer {
    fn name(&self) -> &str {
        "SyncAktifitasMengajarDosenToAcademicTransactionTeachLecturer"
    }

    fn description(&self) -> &str {
        "Upsert aktifitas_mengajar_dosen to academic_campaign_transaction.teach_lecturers"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        use indicatif::{ProgressBar, ProgressStyle};
        use sea_orm::PaginatorTrait;
        use std::time::Duration;

        // Progress bar is shown by default; pass `false` or `--no-progress` to disable it.
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        let pb = if show_progress {
            let bar = ProgressBar::new_spinner();
            bar.set_style(
                ProgressStyle::default_spinner()
                    .template("{spinner:.green} [{elapsed_precise}] {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_spinner()),
            );
            bar.enable_steady_tick(Duration::from_millis(100));
            bar.set_message("Counting feeder aktifitas_mengajar_dosen records...");

            let total_records = FeederAktifitas::Entity::find().count(db).await?;

            bar.set_length(total_records);
            bar.set_position(0);
            bar.set_style(
                ProgressStyle::default_bar()
                    .template("{spinner:.green} [{elapsed_precise}] [{wide_bar:.cyan/blue}] {pos}/{len} ({percent}%, {per_sec}, eta {eta}) {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_bar())
                    .progress_chars("#>-"),
            );
            bar.set_message("");
            Some(bar)
        } else {
            None
        };

        // Create log file
        let log_dir = "logs";
        std::fs::create_dir_all(log_dir)?;
        let log_file_path = format!("{}/sync_teach_lecturers_{}.log", log_dir, Local::now().format("%Y%m%d_%H%M%S"));
        let mut log_file = OpenOptions::new()
            .create(true)
            .append(true)
            .open(&log_file_path)?;

        // Preload static references once before the processing loop
        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_feeder_name = HashMap::new();
        for year in years {
            years_by_feeder_name.insert(year.feeder_name.clone(), year);
        }

        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_feeder_id = HashMap::new();
        let mut unit_institution_ids = Vec::new();
        for unit in units {
            if let Some(feeder_id) = unit.feeder_id {
                units_by_feeder_id.insert(feeder_id, unit.clone());
            }
            unit_institution_ids.push(unit.institution_id);
        }

        // Preload institutions scoped to referenced units
        let institutions = Institution::Entity::find()
            .filter(Institution::Column::Id.is_in(unit_institution_ids))
            .all(db)
            .await?;
        let mut institutions_by_id = HashMap::new();
        for inst in institutions {
            institutions_by_id.insert(inst.id, inst);
        }

        let activities = AcademicActivity::Entity::find().all(db).await?;
        let mut activities_by_unit_and_year = HashMap::new();
        for act in activities {
            activities_by_unit_and_year.insert((act.unit_id, act.academic_year_id), act);
        }

        let cache = ReferenceCache {
            years_by_feeder_name,
            units_by_feeder_id,
            institutions_by_id,
            activities_by_unit_and_year,
        };

        let mut inserted: u64 = 0;
        let mut updated: u64 = 0;
        let mut skipped: u64 = 0;
        let mut teach_not_found: u64 = 0;
        let mut errors: u64 = 0;

        let mut offset = 0;
        let limit = 1000;

        loop {
            let records = FeederAktifitas::Entity::find()
                .order_by_asc(FeederAktifitas::Column::Id)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;

            if records.is_empty() {
                break;
            }

            for record in records {
                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        writeln!(log_file, "[ERROR] Record {}: failed to begin transaction: {}", record.id, e)?;
                        errors += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                // 1. Resolve unit and academic year from memory cache
                let Some(id_prodi) = record.id_prodi else {
                    writeln!(log_file, "[REFERENCE_NOT_FOUND] Record {}: id_prodi is null", record.id)?;
                    skipped += 1;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };
                let Some(unit) = cache.units_by_feeder_id.get(&id_prodi) else {
                    writeln!(log_file, "[REFERENCE_NOT_FOUND] Record {}: unit not found for id_prodi {}", record.id, id_prodi)?;
                    skipped += 1;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };

                let Some(ref id_periode) = record.id_periode else {
                    writeln!(log_file, "[REFERENCE_NOT_FOUND] Record {}: id_periode is null", record.id)?;
                    skipped += 1;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };
                let Some(academic_year) = cache.years_by_feeder_name.get(id_periode) else {
                    writeln!(log_file, "[REFERENCE_NOT_FOUND] Record {}: academic_year not found for id_periode {}", record.id, id_periode)?;
                    skipped += 1;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };

                // 2. Resolve activity from memory cache
                let Some(activity) = cache.activities_by_unit_and_year.get(&(unit.id, academic_year.id)) else {
                    writeln!(
                        log_file,
                        "[ACTIVITY_NOT_FOUND] Record {}: activity not found for unit {} and year {}",
                        record.id, unit.id, academic_year.feeder_name
                    )?;
                    skipped += 1;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };

                // 3. Resolve course
                let Some(id_matkul) = record.id_matkul else {
                    writeln!(log_file, "[COURSE_NOT_FOUND] Record {}: id_matkul is null", record.id)?;
                    skipped += 1;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                };
                let course = match AcademicCourse::Entity::find()
                    .filter(AcademicCourse::Column::FeederCourseId.eq(id_matkul))
                    .one(&txn)
                    .await
                {
                    Ok(Some(c)) => c,
                    Ok(None) => {
                        writeln!(log_file, "[COURSE_NOT_FOUND] Record {}: course not found for id_matkul {}", record.id, id_matkul)?;
                        skipped += 1;
                        let _ = txn.rollback().await;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                    Err(e) => {
                        writeln!(log_file, "[ERROR] Record {}: error querying course: {}", record.id, e)?;
                        errors += 1;
                        let _ = txn.rollback().await;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                // 4. Resolve lecturer deterministically (handling potential duplicate rows)
                let lecturer_result = if let Some(id_dosen) = record.id_dosen {
                    match AcademicLecturer::Entity::find()
                        .filter(AcademicLecturer::Column::IdDosen.eq(id_dosen))
                        .order_by_asc(AcademicLecturer::Column::CreatedAt)
                        .all(&txn)
                        .await
                    {
                        Ok(mut list) if !list.is_empty() => {
                            if list.len() > 1 {
                                writeln!(
                                    log_file,
                                    "[DUPLICATE_LECTURER] Record {}: id_dosen {} has {} rows, selecting primary lecturer id {}",
                                    record.id, id_dosen, list.len(), list[0].id
                                )?;
                            }
                            Some(list.remove(0))
                        }
                        Ok(_) => None,
                        Err(e) => {
                            writeln!(log_file, "[ERROR] Record {}: error querying lecturer by id_dosen: {}", record.id, e)?;
                            errors += 1;
                            let _ = txn.rollback().await;
                            if let Some(ref pb) = pb {
                                pb.inc(1);
                            }
                            continue;
                        }
                    }
                } else {
                    None
                };

                let lecturer = match lecturer_result {
                    Some(l) => l,
                    None => {
                        if let Some(id_reg) = record.id_registrasi_dosen {
                            match AcademicLecturer::Entity::find()
                                .filter(AcademicLecturer::Column::IdRegistrasiDosen.eq(id_reg))
                                .order_by_asc(AcademicLecturer::Column::CreatedAt)
                                .all(&txn)
                                .await
                            {
                                Ok(mut list) if !list.is_empty() => list.remove(0),
                                Ok(_) => {
                                    writeln!(
                                        log_file,
                                        "[LECTURER_NOT_FOUND] Record {}: lecturer not found for id_dosen {:?} and id_registrasi_dosen {:?}",
                                        record.id, record.id_dosen, record.id_registrasi_dosen
                                    )?;
                                    skipped += 1;
                                    let _ = txn.rollback().await;
                                    if let Some(ref pb) = pb {
                                        pb.inc(1);
                                    }
                                    continue;
                                }
                                Err(e) => {
                                    writeln!(log_file, "[ERROR] Record {}: error querying lecturer by id_reg: {}", record.id, e)?;
                                    errors += 1;
                                    let _ = txn.rollback().await;
                                    if let Some(ref pb) = pb {
                                        pb.inc(1);
                                    }
                                    continue;
                                }
                            }
                        } else {
                            writeln!(log_file, "[LECTURER_NOT_FOUND] Record {}: lecturer id_dosen and id_reg are null", record.id)?;
                            skipped += 1;
                            let _ = txn.rollback().await;
                            if let Some(ref pb) = pb {
                                pb.inc(1);
                            }
                            continue;
                        }
                    }
                };

                // 5. Resolve teach (Direct lookup with activity_id scoping to avoid duplicate feeder_id errors)
                let mut teach_opt = if let Some(id_kelas) = record.id_kelas {
                    match AcademicTeach::Entity::find()
                        .filter(AcademicTeach::Column::FeederId.eq(id_kelas))
                        .filter(AcademicTeach::Column::ActivityId.eq(activity.id))
                        .one(&txn)
                        .await
                    {
                        Ok(t) => t,
                        Err(e) => {
                            writeln!(log_file, "[ERROR] Record {}: error querying direct teach: {}", record.id, e)?;
                            errors += 1;
                            let _ = txn.rollback().await;
                            if let Some(ref pb) = pb {
                                pb.inc(1);
                            }
                            continue;
                        }
                    }
                } else {
                    None
                };

                // 6. Fallback teach lookup via class codes and teach criteria
                if teach_opt.is_none() && let Some(ref nama_kelas) = record.nama_kelas_kuliah {
                    let cc_ids: Vec<Uuid> = match AcademicClassCode::Entity::find()
                        .filter(AcademicClassCode::Column::AlphabetCode.eq(nama_kelas))
                        .filter(AcademicClassCode::Column::UnitId.eq(unit.id))
                        .all(&txn)
                        .await
                    {
                        Ok(list) => list.into_iter().map(|c| c.id).collect(),
                        Err(e) => {
                            writeln!(log_file, "[ERROR] Record {}: error querying class codes: {}", record.id, e)?;
                            errors += 1;
                            let _ = txn.rollback().await;
                            if let Some(ref pb) = pb {
                                pb.inc(1);
                            }
                            continue;
                        }
                    };

                    if !cc_ids.is_empty() {
                        match AcademicTeach::Entity::find()
                            .filter(AcademicTeach::Column::ClassCodeId.is_in(cc_ids))
                            .filter(AcademicTeach::Column::CourseId.eq(course.id))
                            .filter(AcademicTeach::Column::ActivityId.eq(activity.id))
                            .one(&txn)
                            .await
                        {
                            Ok(t) => teach_opt = t,
                            Err(e) => {
                                writeln!(log_file, "[ERROR] Record {}: error querying fallback teach: {}", record.id, e)?;
                                errors += 1;
                                let _ = txn.rollback().await;
                                if let Some(ref pb) = pb {
                                    pb.inc(1);
                                }
                                continue;
                            }
                        }
                    }
                }

                let Some(teach) = teach_opt else {
                    teach_not_found += 1;
                    writeln!(
                        log_file,
                        "[TEACH_NOT_FOUND] id: {}, id_kelas: {:?}, nama_dosen: {:?}, nama_matkul: {:?}, nama_kelas: {:?}, id_periode: {:?}",
                        record.id, record.id_kelas, record.nama_dosen, record.nama_mata_kuliah, record.nama_kelas_kuliah, record.id_periode
                    )?;
                    let _ = txn.rollback().await;
                    if let Some(ref pb) = pb {
                        pb.set_message(format!(
                            "inserted: {inserted} | updated: {updated} | skipped: {skipped} | teach not found: {teach_not_found} | errors: {errors}"
                        ));
                        pb.inc(1);
                    }
                    continue;
                };

                // 7. Upsert teach_lecturer
                let institution = cache.institutions_by_id.get(&unit.institution_id);
                match upsert_teach_lecturer(&txn, &record, &lecturer, &teach, &course, unit, institution, academic_year).await {
                    Ok((_, action)) => {
                        match txn.commit().await {
                            Ok(_) => {
                                match action {
                                    UpsertAction::Inserted => inserted += 1,
                                    UpsertAction::Updated => updated += 1,
                                }
                            }
                            Err(e) => {
                                writeln!(log_file, "[ERROR] Record {}: failed to commit transaction: {}", record.id, e)?;
                                errors += 1;
                            }
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        writeln!(log_file, "[ERROR] Record {}: failed to upsert teach_lecturer: {}", record.id, e)?;
                        errors += 1;
                    }
                }

                if let Some(ref pb) = pb {
                    pb.set_message(format!(
                        "inserted: {inserted} | updated: {updated} | skipped: {skipped} | teach not found: {teach_not_found} | errors: {errors}"
                    ));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let summary = format!(
            "Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | teach not found: {teach_not_found} | errors: {errors} (see {log_file_path})"
        );
        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
