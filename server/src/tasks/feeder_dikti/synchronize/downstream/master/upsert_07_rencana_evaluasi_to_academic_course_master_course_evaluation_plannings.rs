use std::collections::HashMap;
use std::time::Duration;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder, QuerySelect,
    TransactionTrait,
};
use uuid::Uuid;

use crate::tasks::Task;

use crate::models::feeder::master::rencana_evaluasi as FeederRencanaEvaluasi;
use crate::models::academic::course::master::course_evaluation_plannings as AcademicCourseEvaluationPlanning;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::academic::course::reference::evaluation_types as AcademicEvaluationType;

pub struct SyncRencanaEvaluasiToCourseEvaluationPlannings;

struct ReferenceCache {
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    evaluation_types_by_code: HashMap<i32, AcademicEvaluationType::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_evaluation_planning(
    txn: &DatabaseTransaction,
    record: &FeederRencanaEvaluasi::Model,
    course: &AcademicCourse::Model,
    evaluation_type: &AcademicEvaluationType::Model,
) -> Result<(AcademicCourseEvaluationPlanning::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let nomor_urut_int = record.nomor_urut.as_ref().and_then(|n| n.parse::<i32>().ok());

    let mut query = AcademicCourseEvaluationPlanning::Entity::find()
        .filter(AcademicCourseEvaluationPlanning::Column::CourseId.eq(course.id));

    if let Some(code) = nomor_urut_int {
        query = query.filter(AcademicCourseEvaluationPlanning::Column::Code.eq(code));
    } else {
        query = query.filter(AcademicCourseEvaluationPlanning::Column::EvaluationTypeId.eq(evaluation_type.id));
    }

    let existing = query.one(txn).await?;

    let name = match &record.nama_evaluasi {
        Some(nama) if !nama.trim().is_empty() => nama.clone(),
        _ => evaluation_type.name.clone(),
    };

    let percentage = record.bobot_evaluasi.as_ref().and_then(|b| b.parse::<f32>().ok());
    let decription_indonesian = record.deskripsi_indonesia.clone().unwrap_or_default();
    let decription_english = record.deskrips_inggris.clone();

    if let Some(p) = existing {
        let mut active = p.into_active_model();
        active.name = Set(name);
        active.percentage = Set(percentage);
        active.code = Set(nomor_urut_int);
        active.decription_indonesian = Set(decription_indonesian);
        active.decription_english = Set(decription_english);
        active.evaluation_type_id = Set(evaluation_type.id);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_plan = AcademicCourseEvaluationPlanning::ActiveModel {
            id: Set(Uuid::new_v4()),
            course_id: Set(course.id),
            evaluation_type_id: Set(evaluation_type.id),
            name: Set(name),
            percentage: Set(percentage),
            code: Set(nomor_urut_int),
            decription_indonesian: Set(decription_indonesian),
            decription_english: Set(decription_english),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_plan.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncRencanaEvaluasiToCourseEvaluationPlannings {
    fn name(&self) -> &str {
        "SyncRencanaEvaluasiToCourseEvaluationPlannings"
    }

    fn description(&self) -> &str {
        "Upsert rencana_evaluasi to academic_course_master.course_evaluation_plannings"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload reference cache
        let courses = AcademicCourse::Entity::find().all(db).await?;
        let mut courses_by_feeder_id = HashMap::new();
        for c in courses {
            if let Some(fid) = c.feeder_course_id {
                courses_by_feeder_id.insert(fid, c);
            }
        }

        let eval_types = AcademicEvaluationType::Entity::find().all(db).await?;
        let mut evaluation_types_by_code = HashMap::new();
        for et in eval_types {
            evaluation_types_by_code.insert(et.code, et);
        }

        let cache = ReferenceCache {
            courses_by_feeder_id,
            evaluation_types_by_code,
        };

        // 2. Setup Progress Bar
        let pb = if show_progress {
            let bar = ProgressBar::new_spinner();
            bar.set_style(
                ProgressStyle::default_spinner()
                    .template("{spinner:.green} [{elapsed_precise}] {msg}")
                    .unwrap_or_else(|_| ProgressStyle::default_spinner()),
            );
            bar.enable_steady_tick(Duration::from_millis(100));
            bar.set_message("Counting feeder rencana_evaluasi records...");

            let total_records = FeederRencanaEvaluasi::Entity::find().count(db).await?;

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

        let mut inserted: u64 = 0;
        let mut updated: u64 = 0;
        let mut skipped: u64 = 0;
        let mut errors: u64 = 0;

        let mut offset = 0;
        let limit = 1000;

        loop {
            let records = FeederRencanaEvaluasi::Entity::find()
                .order_by_asc(FeederRencanaEvaluasi::Column::Id)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;

            if records.is_empty() {
                break;
            }

            for record in records {
                let course = match record.id_matkul.and_then(|id_m| cache.courses_by_feeder_id.get(&id_m)) {
                    Some(c) => c,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let eval_type = match record
                    .id_jenis_evaluasi
                    .as_deref()
                    .and_then(|s| s.parse::<i32>().ok())
                    .and_then(|c| cache.evaluation_types_by_code.get(&c))
                {
                    Some(et) => et,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                match upsert_evaluation_planning(&txn, &record, course, eval_type).await {
                    Ok((_p, action)) => {
                        match action {
                            UpsertAction::Inserted => inserted += 1,
                            UpsertAction::Updated => updated += 1,
                        }
                        if let Err(e) = txn.commit().await {
                            eprintln!("Failed to commit transaction: {e}");
                            errors += 1;
                        }
                    }
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error upserting evaluation planning for course {:?}: {e}", course.code);
                        errors += 1;
                    }
                }

                if let Some(ref pb) = pb {
                    pb.set_message(format!("inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}"));
                    pb.inc(1);
                }
            }

            offset += limit;
        }

        let summary = format!("Sync completed - inserted: {inserted} | updated: {updated} | skipped: {skipped} | errors: {errors}");
        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
