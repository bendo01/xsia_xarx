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

use crate::models::feeder::master::nilai_perkuliahan_kelas as FeederNilaiPerkuliahanKelas;
use crate::models::academic::campaign::transaction::teaches as AcademicTeach;
use crate::models::academic::campaign::transaction::teach_decrees as AcademicTeachDecree;
use crate::models::academic::campaign::transaction::class_codes as AcademicClassCode;
use crate::models::academic::campaign::transaction::activities as AcademicActivity;
use crate::models::academic::campaign::reference::scopes as AcademicScope;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::institution::master::institutions as Institution;
use crate::models::academic::general::reference::academic_years as AcademicYear;

pub struct SyncNilaiPerkuliahanKelasToTransactionTeaches;

struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    institutions_by_id: HashMap<Uuid, Institution::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    activities_by_unit_and_year: HashMap<(Uuid, Uuid), AcademicActivity::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
    internal_scope_id: Uuid,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn get_or_create_teach_decree(
    txn: &DatabaseTransaction,
    activity_id: Uuid,
    academic_year: &AcademicYear::Model,
) -> Result<Uuid, sea_orm::DbErr> {
    let existing = AcademicTeachDecree::Entity::find()
        .filter(AcademicTeachDecree::Column::ActivityId.eq(activity_id))
        .one(txn)
        .await?;

    if let Some(d) = existing {
        Ok(d.id)
    } else {
        let now = chrono::Local::now().naive_local();
        let new_id = Uuid::new_v4();
        let decree_date = academic_year.start_date.unwrap_or_else(|| chrono::Utc::now().date_naive());
        let new_decree = AcademicTeachDecree::ActiveModel {
            id: Set(new_id),
            activity_id: Set(activity_id),
            decree_date: Set(decree_date),
            decree_number: Set("-".to_string()),
            staff_id: Set(Some(Uuid::nil())),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };
        new_decree.insert(txn).await?;
        Ok(new_id)
    }
}

async fn get_or_create_class_code(
    txn: &DatabaseTransaction,
    activity: &AcademicActivity::Model,
    unit: &InstitutionUnit::Model,
    academic_year: &AcademicYear::Model,
    nama_kelas: &str,
    institution: Option<&Institution::Model>,
) -> Result<Uuid, sea_orm::DbErr> {
    let existing = AcademicClassCode::Entity::find()
        .filter(AcademicClassCode::Column::ActivityId.eq(activity.id))
        .filter(AcademicClassCode::Column::AlphabetCode.eq(nama_kelas))
        .one(txn)
        .await?;

    if let Some(cc) = existing {
        Ok(cc.id)
    } else {
        let now = chrono::Local::now().naive_local();
        let new_id = Uuid::new_v4();
        let class_name = format!(
            "KelasKuliah {} {} {} {}",
            institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
            unit.code.as_deref().unwrap_or(""),
            academic_year.feeder_name,
            nama_kelas
        );
        let new_cc = AcademicClassCode::ActiveModel {
            id: Set(new_id),
            activity_id: Set(activity.id),
            alphabet_code: Set(Some(nama_kelas.to_string())),
            name: Set(class_name),
            capacity: Set(Some(40)),
            start_effective_date: Set(academic_year.start_date),
            end_effective_date: Set(academic_year.end_date),
            unit_id: Set(Some(unit.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };
        new_cc.insert(txn).await?;
        Ok(new_id)
    }
}

async fn upsert_teach(
    txn: &DatabaseTransaction,
    record: &FeederNilaiPerkuliahanKelas::Model,
    id_kelas: Uuid,
    course: &AcademicCourse::Model,
    activity: &AcademicActivity::Model,
    unit: &InstitutionUnit::Model,
    institution: Option<&Institution::Model>,
    academic_year: &AcademicYear::Model,
    class_code_id: Uuid,
    teach_decree_id: Uuid,
    scope_id: Uuid,
) -> Result<(AcademicTeach::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();

    let mut existing = AcademicTeach::Entity::find()
        .filter(AcademicTeach::Column::FeederId.eq(id_kelas))
        .filter(AcademicTeach::Column::ActivityId.eq(activity.id))
        .one(txn)
        .await?;

    if existing.is_none() {
        existing = AcademicTeach::Entity::find()
            .filter(AcademicTeach::Column::CourseId.eq(course.id))
            .filter(AcademicTeach::Column::ActivityId.eq(activity.id))
            .filter(AcademicTeach::Column::ClassCodeId.eq(class_code_id))
            .one(txn)
            .await?;
    }

    let name = format!(
        "AktifitasPengajaran {} {} {} {}",
        institution.and_then(|i| i.code.as_deref()).unwrap_or(""),
        unit.code.as_deref().unwrap_or(""),
        academic_year.feeder_name,
        course.code
    );

    let (practice_start_date, practice_end_date) = if course.practice_credit == 0.0 && course.field_practice_credit == 0.0 {
        (None, None)
    } else {
        (academic_year.start_date, academic_year.end_date)
    };

    let start_date = record.tgl_mulai_koas.or(academic_year.start_date);
    let end_date = record.tgl_selesai_koas.or(academic_year.end_date);
    let max_member = record.jumlah_mahasiswa_krs.or(Some(40));

    if let Some(t) = existing {
        let mut active = t.into_active_model();
        active.name = Set(Some(name));
        active.class_code_id = Set(class_code_id);
        active.course_id = Set(course.id);
        active.activity_id = Set(Some(activity.id));
        active.start_date = Set(start_date);
        active.end_date = Set(end_date);
        active.practice_start_date = Set(practice_start_date);
        active.practice_end_date = Set(practice_end_date);
        active.teach_decree_id = Set(teach_decree_id);
        active.scope_id = Set(Some(scope_id));
        active.max_member = Set(max_member);
        active.feeder_id = Set(Some(id_kelas));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_teach = AcademicTeach::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(Some(name)),
            class_code_id: Set(class_code_id),
            course_id: Set(course.id),
            activity_id: Set(Some(activity.id)),
            start_date: Set(start_date),
            end_date: Set(end_date),
            practice_start_date: Set(practice_start_date),
            practice_end_date: Set(practice_end_date),
            curriculum_detail_id: Set(None),
            teach_decree_id: Set(teach_decree_id),
            is_lecturer_credit_sum_problem: Set(Some(false)),
            is_lock: Set(Some(false)),
            encounter_category_id: Set(None),
            scope_id: Set(Some(scope_id)),
            max_member: Set(max_member),
            feeder_id: Set(Some(id_kelas)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_teach.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

#[async_trait]
impl Task for SyncNilaiPerkuliahanKelasToTransactionTeaches {
    fn name(&self) -> &str {
        "SyncNilaiPerkuliahanKelasToTransactionTeaches"
    }

    fn description(&self) -> &str {
        "Upsert nilai_perkuliahan_kelas to academic_campaign_transaction.teaches"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload reference caches
        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_feeder_id = HashMap::new();
        for u in units {
            if let Some(fid) = u.feeder_id {
                units_by_feeder_id.insert(fid, u);
            }
        }

        let institutions = Institution::Entity::find().all(db).await?;
        let mut institutions_by_id = HashMap::new();
        for i in institutions {
            institutions_by_id.insert(i.id, i);
        }

        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_feeder_name = HashMap::new();
        for y in years {
            if !y.feeder_name.is_empty() {
                years_by_feeder_name.insert(y.feeder_name.clone(), y);
            }
        }

        let activities = AcademicActivity::Entity::find().all(db).await?;
        let mut activities_by_unit_and_year = HashMap::new();
        for a in activities {
            activities_by_unit_and_year.insert((a.unit_id, a.academic_year_id), a);
        }

        let courses = AcademicCourse::Entity::find().all(db).await?;
        let mut courses_by_feeder_id = HashMap::new();
        for c in courses {
            if let Some(fid) = c.feeder_course_id {
                courses_by_feeder_id.insert(fid, c);
            }
        }

        let internal_scope_id = AcademicScope::Entity::find()
            .filter(AcademicScope::Column::Name.eq("Internal"))
            .one(db)
            .await?
            .map(|s| s.id)
            .unwrap_or(Uuid::nil());

        let cache = ReferenceCache {
            units_by_feeder_id,
            institutions_by_id,
            years_by_feeder_name,
            activities_by_unit_and_year,
            courses_by_feeder_id,
            internal_scope_id,
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
            bar.set_message("Counting feeder nilai_perkuliahan_kelas records...");

            let total_records = FeederNilaiPerkuliahanKelas::Entity::find().count(db).await?;

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
            let records = FeederNilaiPerkuliahanKelas::Entity::find()
                .order_by_asc(FeederNilaiPerkuliahanKelas::Column::Id)
                .offset(offset)
                .limit(limit)
                .all(db)
                .await?;

            if records.is_empty() {
                break;
            }

            for record in records {
                let id_kelas = match record.id_kelas_kuliah {
                    Some(id) if !id.is_nil() => id,
                    _ => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let nama_kelas = match record.nama_kelas_kuliah.as_deref().map(str::trim).filter(|s| !s.is_empty()) {
                    Some(n) => n,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let unit = match record.id_sms.and_then(|id_p| cache.units_by_feeder_id.get(&id_p)) {
                    Some(u) => u,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let academic_year = match record.id_smt.as_deref().and_then(|s| cache.years_by_feeder_name.get(s)) {
                    Some(ay) => ay,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

                let activity = match cache.activities_by_unit_and_year.get(&(unit.id, academic_year.id)) {
                    Some(a) => a,
                    None => {
                        skipped += 1;
                        if let Some(ref pb) = pb {
                            pb.inc(1);
                        }
                        continue;
                    }
                };

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

                let institution = cache.institutions_by_id.get(&unit.institution_id);

                let txn = match db.begin().await {
                    Ok(t) => t,
                    Err(e) => {
                        eprintln!("Failed to begin transaction: {e}");
                        errors += 1;
                        continue;
                    }
                };

                let teach_decree_id = match get_or_create_teach_decree(&txn, activity.id, academic_year).await {
                    Ok(id) => id,
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error resolving decree: {e}");
                        errors += 1;
                        continue;
                    }
                };

                let class_code_id = match get_or_create_class_code(&txn, activity, unit, academic_year, nama_kelas, institution).await {
                    Ok(id) => id,
                    Err(e) => {
                        let _ = txn.rollback().await;
                        eprintln!("Error resolving class code: {e}");
                        errors += 1;
                        continue;
                    }
                };

                match upsert_teach(
                    &txn,
                    &record,
                    id_kelas,
                    course,
                    activity,
                    unit,
                    institution,
                    academic_year,
                    class_code_id,
                    teach_decree_id,
                    cache.internal_scope_id,
                ).await {
                    Ok((_teach, action)) => {
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
                        eprintln!("Error upserting teach for class {:?}: {e}", nama_kelas);
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
