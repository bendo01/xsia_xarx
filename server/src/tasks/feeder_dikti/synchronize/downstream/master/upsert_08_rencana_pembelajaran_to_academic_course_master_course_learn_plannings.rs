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

use crate::models::feeder::master::rencana_pembelajaran as FeederRencanaPembelajaran;
use crate::models::academic::course::master::course_learn_plannings as AcademicCourseLearnPlanning;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::institution::master::institutions as Institution;

pub struct SyncRencanaPembelajaranToCourseLearnPlannings;

struct ReferenceCache {
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    units_by_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_learn_planning(
    txn: &DatabaseTransaction,
    record: &FeederRencanaPembelajaran::Model,
    course: &AcademicCourse::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
) -> Result<(AcademicCourseLearnPlanning::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();
    let pertemuan = record.pertemuan.unwrap_or(0);

    let mut existing: Option<AcademicCourseLearnPlanning::Model> = None;

    if let Some(id_ra) = record.id_rencana_ajar {
        existing = AcademicCourseLearnPlanning::Entity::find()
            .filter(AcademicCourseLearnPlanning::Column::FeederIdRencanaAjar.eq(id_ra))
            .one(txn)
            .await?;
    }

    if existing.is_none() {
        existing = AcademicCourseLearnPlanning::Entity::find()
            .filter(AcademicCourseLearnPlanning::Column::CourseId.eq(course.id))
            .filter(AcademicCourseLearnPlanning::Column::Code.eq(pertemuan))
            .one(txn)
            .await?;
    }

    let title = format!(
        "RPS {} {} {} {}",
        institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
        unit.code.as_deref().unwrap_or(""),
        course.code,
        pertemuan
    );

    let decription_indonesian = record.materi_indonesia.clone().unwrap_or_default();
    let decription_english = record.materi_inggris.clone();

    if let Some(p) = existing {
        let mut active = p.into_active_model();
        active.course_id = Set(course.id);
        active.feeder_id_rencana_ajar = Set(record.id_rencana_ajar);
        active.name = Set(title);
        active.code = Set(pertemuan);
        active.decription_indonesian = Set(decription_indonesian);
        active.decription_english = Set(decription_english);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_plan = AcademicCourseLearnPlanning::ActiveModel {
            id: Set(Uuid::new_v4()),
            course_id: Set(course.id),
            feeder_id_rencana_ajar: Set(record.id_rencana_ajar),
            name: Set(title),
            code: Set(pertemuan),
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
impl Task for SyncRencanaPembelajaranToCourseLearnPlannings {
    fn name(&self) -> &str {
        "SyncRencanaPembelajaranToCourseLearnPlannings"
    }

    fn description(&self) -> &str {
        "Upsert rencana_pembelajaran to academic_course_master.course_learn_plannings"
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

        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_id = HashMap::new();
        for u in units {
            units_by_id.insert(u.id, u);
        }

        let institutions = Institution::Entity::find().all(db).await?;
        let mut institutions_by_id = HashMap::new();
        for i in institutions {
            institutions_by_id.insert(i.id, i);
        }

        let cache = ReferenceCache {
            courses_by_feeder_id,
            units_by_id,
            institutions_by_id,
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
            bar.set_message("Counting feeder rencana_pembelajaran records...");

            let total_records = FeederRencanaPembelajaran::Entity::find().count(db).await?;

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
            let records = FeederRencanaPembelajaran::Entity::find()
                .order_by_asc(FeederRencanaPembelajaran::Column::Id)
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

                let unit = match cache.units_by_id.get(&course.unit_id) {
                    Some(u) => u,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let institution = cache.institutions_by_id.get(&unit.institution_id);

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                match upsert_learn_planning(&txn, &record, course, unit, institution).await {
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
                        eprintln!("Error upserting learn planning for course {:?}, pertemuan {:?}: {e}", course.code, record.pertemuan);
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
