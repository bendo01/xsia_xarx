use std::collections::HashMap;
use std::time::Duration;
use indicatif::{ProgressBar, ProgressStyle};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction,
    EntityTrait, IntoActiveModel, PaginatorTrait, QueryFilter, QueryOrder,
    TransactionTrait,
};
use uuid::Uuid;

use crate::tasks::Task;

use crate::models::feeder::master::kurikulum as FeederKurikulum;
use crate::models::feeder::master::matakuliah_kurikulum as FeederMatakuliahKurikulum;
use crate::models::academic::course::master::curriculums as AcademicCurriculum;
use crate::models::academic::course::master::curriculum_details as AcademicCurriculumDetail;
use crate::models::academic::course::master::courses as AcademicCourse;
use crate::models::academic::course::reference::curriculum_types as AcademicCurriculumType;
use crate::models::academic::course::reference::semesters as AcademicSemester;
use crate::models::institution::master::units as InstitutionUnit;
use crate::models::academic::general::reference::academic_years as AcademicYear;

pub struct SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails;

struct ReferenceCache {
    units_by_feeder_id: HashMap<Uuid, InstitutionUnit::Model>,
    years_by_feeder_name: HashMap<String, AcademicYear::Model>,
    default_curriculum_type_id: Uuid,
    semesters_by_code: HashMap<i32, AcademicSemester::Model>,
    courses_by_feeder_id: HashMap<Uuid, AcademicCourse::Model>,
}

enum UpsertAction {
    Inserted,
    Updated,
}

async fn upsert_curriculum(
    txn: &DatabaseTransaction,
    record: &FeederKurikulum::Model,
    unit: &InstitutionUnit::Model,
    academic_year: &AcademicYear::Model,
    curriculum_type_id: Uuid,
) -> Result<(AcademicCurriculum::Model, UpsertAction), sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();

    let mut existing: Option<AcademicCurriculum::Model> = None;

    if let Some(id_k) = record.id_kurikulum {
        existing = AcademicCurriculum::Entity::find()
            .filter(AcademicCurriculum::Column::FeederId.eq(id_k))
            .one(txn)
            .await?;
    }

    if existing.is_none() {
        if let Some(ref name) = record.nama_kurikulum {
            existing = AcademicCurriculum::Entity::find()
                .filter(AcademicCurriculum::Column::UnitId.eq(unit.id))
                .filter(AcademicCurriculum::Column::AcademicYearId.eq(academic_year.id))
                .filter(AcademicCurriculum::Column::Name.eq(name))
                .one(txn)
                .await?;
        }
    }

    let name = record.nama_kurikulum.clone().unwrap_or_default();
    let total_credit = record.jumlah_sks_lulus.map(|v| v as f64);
    let mandatory_credit = record.jumlah_sks_wajib.map(|v| v as f64);
    let optional_credit = record.jumlah_sks_pilihan.map(|v| v as f64);

    if let Some(curr) = existing {
        let mut active = curr.into_active_model();
        active.name = Set(name);
        active.unit_id = Set(unit.id);
        active.academic_year_id = Set(academic_year.id);
        active.curriculum_type_id = Set(curriculum_type_id);
        active.total_credit = Set(total_credit);
        active.mandatory_course_credit = Set(mandatory_credit);
        active.optional_course_credit = Set(optional_credit);
        active.feeder_id = Set(record.id_kurikulum);
        active.is_active = Set(true);
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        let updated = active.update(txn).await?;
        Ok((updated, UpsertAction::Updated))
    } else {
        let new_curr = AcademicCurriculum::ActiveModel {
            id: Set(Uuid::new_v4()),
            name: Set(name),
            unit_id: Set(unit.id),
            academic_year_id: Set(academic_year.id),
            curriculum_type_id: Set(curriculum_type_id),
            total_credit: Set(total_credit),
            mandatory_course_credit: Set(mandatory_credit),
            optional_course_credit: Set(optional_credit),
            feeder_id: Set(record.id_kurikulum),
            is_active: Set(true),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        let inserted = new_curr.insert(txn).await?;
        Ok((inserted, UpsertAction::Inserted))
    }
}

async fn upsert_curriculum_detail(
    txn: &DatabaseTransaction,
    curriculum_id: Uuid,
    detail: &FeederMatakuliahKurikulum::Model,
    course_id: Uuid,
    semester_id: Uuid,
) -> Result<UpsertAction, sea_orm::DbErr> {
    let now = chrono::Local::now().naive_local();

    let mut existing = AcademicCurriculumDetail::Entity::find()
        .filter(AcademicCurriculumDetail::Column::FeederId.eq(detail.id))
        .one(txn)
        .await?;

    if existing.is_none() {
        existing = AcademicCurriculumDetail::Entity::find()
            .filter(AcademicCurriculumDetail::Column::CurriculumId.eq(curriculum_id))
            .filter(AcademicCurriculumDetail::Column::CourseId.eq(course_id))
            .one(txn)
            .await?;
    }

    let credit = detail.sks_mata_kuliah.map(|v| v as f64);
    let name = detail.nama_mata_kuliah.clone();

    if let Some(d) = existing {
        let mut active = d.into_active_model();
        active.curriculum_id = Set(curriculum_id);
        active.course_id = Set(course_id);
        active.semester_id = Set(semester_id);
        active.credit = Set(credit);
        active.name = Set(name);
        active.feeder_id = Set(Some(detail.id));
        active.sync_at = Set(Some(now));
        active.updated_at = Set(Some(now));

        active.update(txn).await?;
        Ok(UpsertAction::Updated)
    } else {
        let new_detail = AcademicCurriculumDetail::ActiveModel {
            id: Set(Uuid::new_v4()),
            code: Set(Some(0)),
            curriculum_id: Set(curriculum_id),
            semester_id: Set(semester_id),
            course_id: Set(course_id),
            credit: Set(credit),
            name: Set(name),
            concentration_id: Set(Some(Uuid::nil())),
            is_convertable_to_mbkm: Set(Some(false)),
            is_convertable_to_prior_learning_recognition: Set(Some(false)),
            feeder_id: Set(Some(detail.id)),
            created_at: Set(Some(now)),
            updated_at: Set(Some(now)),
            sync_at: Set(Some(now)),
            ..Default::default()
        };

        new_detail.insert(txn).await?;
        Ok(UpsertAction::Inserted)
    }
}

#[async_trait]
impl Task for SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails {
    fn name(&self) -> &str {
        "SyncKurikulumAndMatkulKurikulumToCurriculumsAndDetails"
    }

    fn description(&self) -> &str {
        "Upsert kurikulum and matakuliah_kurikulum to curriculums and curriculum_details"
    }

    async fn run(&self, db: &DatabaseConnection, args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        let show_progress = !args.iter().any(|arg| arg == "false" || arg == "--no-progress");

        // 1. Preload caches
        let units = InstitutionUnit::Entity::find().all(db).await?;
        let mut units_by_feeder_id = HashMap::new();
        for u in units {
            if let Some(fid) = u.feeder_id {
                units_by_feeder_id.insert(fid, u);
            }
        }

        let years = AcademicYear::Entity::find().all(db).await?;
        let mut years_by_feeder_name = HashMap::new();
        for y in years {
            if !y.feeder_name.is_empty() {
                years_by_feeder_name.insert(y.feeder_name.clone(), y);
            }
        }

        let default_curriculum_type_id = AcademicCurriculumType::Entity::find()
            .one(db)
            .await?
            .map(|t| t.id)
            .unwrap_or(Uuid::nil());

        let semesters = AcademicSemester::Entity::find().all(db).await?;
        let mut semesters_by_code = HashMap::new();
        for s in semesters {
            if let Some(code) = s.code {
                semesters_by_code.insert(code, s);
            }
        }

        let courses = AcademicCourse::Entity::find().all(db).await?;
        let mut courses_by_feeder_id = HashMap::new();
        for c in courses {
            if let Some(fid) = c.feeder_course_id {
                courses_by_feeder_id.insert(fid, c);
            }
        }

        let cache = ReferenceCache {
            units_by_feeder_id,
            years_by_feeder_name,
            default_curriculum_type_id,
            semesters_by_code,
            courses_by_feeder_id,
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
            bar.set_message("Counting feeder kurikulum records...");

            let total_records = FeederKurikulum::Entity::find().count(db).await?;

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

        let mut c_ins: u64 = 0;
        let mut c_upd: u64 = 0;
        let mut d_ins: u64 = 0;
        let mut d_upd: u64 = 0;
        let mut d_skip: u64 = 0;
        let mut errors: u64 = 0;

        let records = FeederKurikulum::Entity::find()
            .order_by_asc(FeederKurikulum::Column::NamaKurikulum)
            .all(db)
            .await?;

        for record in records {
            let unit = match record.id_prodi.and_then(|id_p| cache.units_by_feeder_id.get(&id_p)) {
                Some(u) => u,
                None => {
                    errors += 1;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                }
            };

            let academic_year = match record.id_semester.as_deref().and_then(|s| cache.years_by_feeder_name.get(s)) {
                Some(ay) => ay,
                None => {
                    errors += 1;
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

            let curriculum = match upsert_curriculum(&txn, &record, unit, academic_year, cache.default_curriculum_type_id).await {
                Ok((curr, action)) => {
                    match action {
                        UpsertAction::Inserted => c_ins += 1,
                        UpsertAction::Updated => c_upd += 1,
                    }
                    curr
                }
                Err(e) => {
                    let _ = txn.rollback().await;
                    eprintln!("Error upserting curriculum {:?}: {e}", record.nama_kurikulum);
                    errors += 1;
                    if let Some(ref pb) = pb {
                        pb.inc(1);
                    }
                    continue;
                }
            };

            // Query child matakuliah_kurikulum
            if let Some(id_k) = record.id_kurikulum {
                let details = FeederMatakuliahKurikulum::Entity::find()
                    .filter(FeederMatakuliahKurikulum::Column::IdKurikulum.eq(id_k))
                    .all(&txn)
                    .await;

                if let Ok(detail_list) = details {
                    for detail in detail_list {
                        let course_id = match detail.id_matkul.and_then(|id_m| cache.courses_by_feeder_id.get(&id_m)) {
                            Some(c) => c.id,
                            None => {
                                d_skip += 1;
                                continue;
                            }
                        };

                        let semester_id = detail
                            .semester
                            .and_then(|sem_code| cache.semesters_by_code.get(&sem_code))
                            .map(|s| s.id)
                            .unwrap_or(Uuid::nil());

                        match upsert_curriculum_detail(&txn, curriculum.id, &detail, course_id, semester_id).await {
                            Ok(action) => match action {
                                UpsertAction::Inserted => d_ins += 1,
                                UpsertAction::Updated => d_upd += 1,
                            },
                            Err(_) => {
                                d_skip += 1;
                            }
                        }
                    }
                }
            }

            if let Err(e) = txn.commit().await {
                eprintln!("Failed to commit transaction: {e}");
                errors += 1;
            }

            if let Some(ref pb) = pb {
                pb.set_message(format!(
                    "curr: (ins: {c_ins}, upd: {c_upd}) | details: (ins: {d_ins}, upd: {d_upd}, skip: {d_skip}) | err: {errors}"
                ));
                pb.inc(1);
            }
        }

        let summary = format!(
            "Sync completed - curriculums: (ins: {c_ins}, upd: {c_upd}) | details: (ins: {d_ins}, upd: {d_upd}, skip: {d_skip}) | errors: {errors}"
        );
        if let Some(pb) = pb {
            pb.finish_with_message(summary);
        } else {
            println!("{summary}");
        }

        Ok(())
    }
}
