use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::prelude::Decimal;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr,
    EntityTrait, IntoActiveModel, QueryFilter, TransactionTrait, TryIntoModel,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

pub async fn handle_job(
    args: WorkerArgs,
    db: Data<DatabaseConnection>,
) -> Result<(), std::io::Error> {
    Worker::perform(&db, args).await.map_err(|e| std::io::Error::other(e.to_string()))
}

pub async fn start_worker(
    redis_url: String,
    db: DatabaseConnection,
) -> Result<Monitor, std::io::Error> {
    let conn = apalis_redis::connect(redis_url)
        .await
        .map_err(|e| std::io::Error::other(e.to_string()))?;
    let storage: RedisStorage<WorkerArgs> = RedisStorage::new(conn);

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_kurikulum_and_matkul_kurikulum_to_academic_course_master_curriculums_and_academic_course_master_curriculum_details")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::academic::course::master::courses as AcademicCourseMasterCourse;
use crate::models::academic::course::master::curriculum_details::{
    self, ActiveModel as DetailActiveModel,
};
use crate::models::academic::course::master::curriculums::{
    self, ActiveModel,
};
use crate::models::academic::course::reference::curriculum_types as AcademicCourseReferenceCurriculumType;
use crate::models::academic::course::reference::semesters as AcademicCourseReferenceSemester;
use crate::models::academic::general::reference::academic_years as AcademicGeneralReferenceAcademicYear;
use crate::models::feeder::master::kurikulum;
use crate::models::feeder::master::matakuliah_kurikulum;
use crate::models::institution::master::units as InstitutionMasterUnit;

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct WorkerArgs {
    pub record: kurikulum::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

        let record = args.record;
        
        // 1. Find Unit
        let unit_id = if let Some(id_prodi) = record.id_prodi {
            let u = InstitutionMasterUnit::Entity::find()
                .filter(InstitutionMasterUnit::Column::FeederId.eq(id_prodi))
                .one(db)
                .await
                .map_err(|e| e.into())?;
            match u {
                Some(val) => val.id,
                None => {
                    println!(
                        "Unit not found for kurikulum: {:?} (id_prodi: {:?}). Skipping.",
                        record.nama_kurikulum, record.id_prodi
                    );
                    return Ok(());
                }
            }
        } else {
            println!("Kurikulum has no id_prodi. Skipping.");
            return Ok(());
        };

        // 2. Find Academic Year
        let academic_year_id = if let Some(code_str) = &record.id_semester {
            let ay = AcademicGeneralReferenceAcademicYear::Entity::find()
                .filter(
                    AcademicGeneralReferenceAcademicYear::Column::FeederName.eq(code_str.trim()),
                )
                .one(db)
                .await
                .map_err(|e| e.into())?;
            match ay {
                Some(val) => val.id,
                None => uuid::Uuid::nil(),
            }
        } else {
            uuid::Uuid::nil()
        };

        // 3. Find Curriculum Type (Default or First)
        let curriculum_type_id = {
            let ct = AcademicCourseReferenceCurriculumType::Entity::find()
                .one(db)
                .await
                .map_err(|e| e.into())?;
            match ct {
                Some(val) => val.id,
                None => {
                    println!("No Curriculum Type found (need at least one). Defaulting to nil.");
                    uuid::Uuid::nil()
                }
            }
        };

        // 4. Upsert Curriculum
        let id_kurikulum = match record.id_kurikulum {
            Some(id) => id,
            None => {
                println!("Kurikulum has no id_kurikulum. Skipping.");
                return Ok(());
            }
        };

        let existing = curriculums::Entity::find()
            .filter(curriculums::Column::FeederId.eq(id_kurikulum))
            .one(db)
            .await
            .map_err(|e| e.into())?;

        let existing = if existing.is_some() {
            existing
        } else {
            curriculums::Entity::find()
                .filter(curriculums::Column::UnitId.eq(unit_id))
                .filter(curriculums::Column::AcademicYearId.eq(academic_year_id))
                .filter(
                    curriculums::Column::Name.eq(record.nama_kurikulum.clone().unwrap_or_default()),
                )
                .one(db)
                .await
                .map_err(|e| e.into())?
        };

        let (mut active_model, is_new) = if let Some(existing_model) = existing {
            (existing_model.into_active_model(), false)
        } else {
            let id = ();
            (
                ActiveModel {
                    id: Set(id),
                    ..Default::default()
                },
                true,
            )
        };

        active_model.name = Set(record.nama_kurikulum.unwrap_or_default());
        active_model.unit_id = Set(unit_id);
        active_model.academic_year_id = Set(academic_year_id);
        active_model.curriculum_type_id = Set(curriculum_type_id);
        active_model.total_credit = Set(record.jumlah_sks_lulus.unwrap_or(0.0) as f64);
        active_model.mandatory_course_credit = Set(record.jumlah_sks_wajib.unwrap_or(0.0) as f64);
        active_model.optional_course_credit = Set(record.jumlah_sks_pilihan.unwrap_or(0.0) as f64);
        active_model.feeder_id = Set(Some(id_kurikulum));
        active_model.is_active = Set(true);

        let saved_curriculum = if is_new {
            active_model
                .insert(db)
                .await
                .map_err(|e| e.into())?
        } else {
            match active_model.update(db).await {
                Ok(m) => m,
                Err(e) => {
                    let msg = e.to_string();
                    if msg.contains("RecordNotUpdated")
                        || msg.contains("None of the records are updated")
                    {
                        curriculums::Entity::find()
                            .filter(curriculums::Column::FeederId.eq(id_kurikulum))
                            .one(db)
                            .await
                            .map_err(|e| e.into())?
                            .ok_or_else(|| {
                                format!(
                                    "Curriculum not found after failing update: {:?}",
                                    id_kurikulum
                                .into())
                            })?
                    } else {
                        return Err(e.into());
                    }
                }
            }
        };
        let curriculum_id = saved_curriculum.id;

        // 5. Sync Details (MatakuliahKurikulum)
        // Find existing details from feeder for this curriculum
        let feeder_details = matakuliah_kurikulum::Entity::find()
            .filter(matakuliah_kurikulum::Column::IdKurikulum.eq(id_kurikulum))
            .all(db)
            .await
            .map_err(|e| e.into())?;

        for detail in feeder_details {
            let id_matkul = match detail.id_matkul {
                Some(id) => id,
                None => continue,
            };

            // Find Course
            let course = AcademicCourseMasterCourse::Entity::find()
                .filter(AcademicCourseMasterCourse::Column::FeederCourseId.eq(id_matkul))
                .one(db)
                .await
                .map_err(|e| e.into())?;

            let course_id = match course {
                Some(c) => c.id,
                None => {
                    // Fallback to find by code and unit_id
                    let course_by_code = if let Some(code_val) = &detail.kode_mata_kuliah {
                        AcademicCourseMasterCourse::Entity::find()
                            .filter(AcademicCourseMasterCourse::Column::Code.eq(code_val))
                            .filter(AcademicCourseMasterCourse::Column::UnitId.eq(unit_id))
                            .one(db)
                            .await
                            .map_err(|e| e.into())?
                    } else {
                        None
                    };

                    match course_by_code {
                        Some(c) => c.id,
                        None => {
                            println!(
                                "Course not found for MatakuliahKurikulum: {:?} (code: {:?}). Skipping.",
                                id_matkul, detail.kode_mata_kuliah
                            );
                            continue;
                        }
                    }
                }
            };

            // Find Semester (by semester_id which is usually 1,2,3..) - wait, in feeder it's `semester` (int)
            let semester_num = detail.semester.unwrap_or(1);
            let semester = AcademicCourseReferenceSemester::Entity::find()
                .filter(AcademicCourseReferenceSemester::Column::Code.eq(semester_num))
                .one(db)
                .await
                .map_err(|e| e.into())?;

            let semester_id = match semester {
                Some(s) => s.id,
                None => {
                    // Try to find any semester, or just default to nil?
                    // Let's assume there's at least one semester or we default to nil.
                    // A safer bet might be to just pick the first one if not found, but logic wise, exact match is better.
                    uuid::Uuid::nil()
                }
            };

            // Concentration - Default nil for now as nothing in feeder maps directly and simply
            let concentration_id = uuid::Uuid::nil();

            // Check if detail exists by (curriculum_id, course_id) or feeder_id if available?
            // matakuliah_kurikulum doesn't seem to have a unique feeder ID that persists well?
            // Actually it does: `matakuliah_kurikulum.id` is the PK in feeder table.
            // curriculum_details also has `feeder_id`.

            let existing_detail = curriculum_details::Entity::find()
                .filter(curriculum_details::Column::FeederId.eq(detail.id))
                .one(db)
                .await
                .map_err(|e| e.into())?;

            let (mut detail_active, is_new_detail) = if let Some(ed) = existing_detail {
                (ed.into_active_model(), false)
            } else {
                let id = ();
                (
                    DetailActiveModel {
                        id: Set(id),
                        ..Default::default()
                    },
                    true,
                )
            };

            detail_active.curriculum_id = Set(curriculum_id);
            detail_active.course_id = Set(course_id);
            detail_active.semester_id = Set(semester_id);
            detail_active.concentration_id = Set(concentration_id);
            detail_active.code = Set(detail
                .kode_mata_kuliah
                .unwrap_or_default()
                .parse()
                .unwrap_or(0));

            detail_active.credit = Set(detail.sks_mata_kuliah.unwrap_or(0.0) as f64);
            detail_active.name = Set(detail.nama_mata_kuliah);
            detail_active.is_convertable_to_mbkm = Set(false); // Default
            detail_active.is_convertable_to_prior_learning_recognition = Set(false); // Default
            detail_active.feeder_id = Set(detail.id);

            // Handle code parsing safely
            // Use 0 if we can't parse or if it's not applicable.
            detail_active.code = Set(0);

            let result = if is_new_detail {
                detail_active
                    .insert(db)
                    .await
                    .map(|m| m.into_active_model())
            } else {
                detail_active.save(db).await
            };

            match result {
                Ok(_) => {}
                Err(e) => {
                    let msg = e.to_string();
                    if msg.contains("RecordNotUpdated")
                        || msg.contains("None of the records are updated")
                    {
                        // Ignore
                    } else {
                        eprintln!("Failed to save detail: {}", e);
                        return Err(e.into());
                    }
                }
            };
        }

        Ok(())
    
}