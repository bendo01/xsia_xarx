use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection,
    EntityTrait, IntoActiveModel, QueryFilter,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_teaches")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::academic::campaign::transaction::activities;
use crate::models::academic::campaign::transaction::class_codes;
use crate::models::academic::campaign::transaction::teach_decrees::{
    self as AcademicCampaignTransactionTeachDecree, ActiveModel as TeachDecreeActiveModel,
};
use crate::models::academic::campaign::transaction::teaches::{
    self, ActiveModel,
};
use crate::models::academic::course::master::courses as AcademicCourseMasterCourse;
use crate::models::academic::general::reference::academic_years as AcademicGeneralReferenceAcademicYear;
use crate::models::feeder::master::kartu_rencana_studi_mahasiswa;
use crate::models::institution::master::institutions as InstitutionMasterInstitution;
use crate::models::institution::master::units as InstitutionMasterUnit;

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct WorkerArgs {
    pub record: kartu_rencana_studi_mahasiswa::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

        let record = args.record;
        
        // 1. Get Unit by feeder_id = kartu.id_prodi
        let unit = if let Some(id_prodi) = record.id_prodi {
            InstitutionMasterUnit::Entity::find()
                .filter(InstitutionMasterUnit::Column::FeederId.eq(id_prodi))
                .one(db)
                .await
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        } else {
            None
        };

        let unit = match unit {
            Some(u) => u,
            None => {
                println!(
                    "❌ Unit not found for KMRS (id_prodi: {:?}). Skipping.",
                    record.id_prodi
                );
                return Ok(());
            }
        };        // Load Institution for unit (needed for name generation)
        let institution = InstitutionMasterInstitution::Entity::find_by_id(unit.institution_id)
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let institution_code = match institution {
            Some(inst) => inst.code.unwrap_or_else(|| "UNKNOWN".to_string()),
            None => {
                println!(
                    "❌ Institution not found for Unit {:?}. Using default code.",
                    unit.id
                );
                "UNKNOWN".to_string()
            }
        };

        // 2. Get AcademicYear by feeder_id = kartu.id_periode
        let academic_year = if let Some(id_periode) = &record.id_periode {
            AcademicGeneralReferenceAcademicYear::Entity::find()
                .filter(AcademicGeneralReferenceAcademicYear::Column::FeederName.eq(id_periode))
                .one(db)
                .await
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        } else {
            None
        };

        let academic_year = match academic_year {
            Some(ay) => ay,
            None => {
                println!(
                    "❌ AcademicYear not found for KMRS (id_periode: {:?}). Skipping.",
                    record.id_periode
                );
                return Ok(());
            }
        };

        // 3. Get UnitActivity where unit_id = unit.id AND academic_year_id = academic_year.id
        let unit_activity = activities::Entity::find()
            .filter(activities::Column::UnitId.eq(unit.id))
            .filter(
                activities::Column::AcademicYearId.eq(academic_year.id),
            )
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let unit_activity = match unit_activity {
            Some(ua) => ua,
            None => {
                println!(
                    "❌ Activity not found for Unit {:?} and AY {:?}. Skipping.",
                    unit.id, academic_year.id
                );
                return Ok(());
            }
        };

        // 4. Get ClassCode where unit_activity_id = unit_activity.id AND alphabet_code = kartu.nama_kelas_kuliah
        let class_name_from_feeder = match &record.nama_kelas_kuliah {
            Some(name) => name.clone(),
            None => {
                println!("❌ nama_kelas_kuliah is missing in KMRS record. Skipping.");
                return Ok(());
            }
        };

        let class_code = class_codes::Entity::find()
            .filter(class_codes::Column::ActivityId.eq(unit_activity.id))
            .filter(class_codes::Column::AlphabetCode.eq(&class_name_from_feeder))
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let class_code = match class_code {
            Some(cc) => cc,
            None => {
                println!(
                    "❌ ClassCode not found for Activity {:?} and AlphabetCode {:?}. Skipping.",
                    unit_activity.id, class_name_from_feeder
                );
                return Ok(());
            }
        };

        // 5. Get Course by feeder_course_id = kartu.id_matkul
        let course = if let Some(id_matkul) = record.id_matkul {
            AcademicCourseMasterCourse::Entity::find()
                .filter(AcademicCourseMasterCourse::Column::FeederCourseId.eq(id_matkul))
                .one(db)
                .await
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
        } else {
            None
        };

        let course = match course {
            Some(c) => c,
            None => {
                println!(
                    "❌ Course not found for KMRS (id_matkul: {:?}). Skipping.",
                    record.id_matkul
                );
                return Ok(());
            }
        };

        // 6. Ensure TeachDecree exists
        let teach_decree = AcademicCampaignTransactionTeachDecree::Entity::find()
            .filter(AcademicCampaignTransactionTeachDecree::Column::ActivityId.eq(unit_activity.id))
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let teach_decree_id = if let Some(td) = teach_decree {
            td.id
        } else {
            let id = Uuid::new_v4();
            let new_decree = TeachDecreeActiveModel {
                id: Set(id),
                decree_number: Set("-".to_string()),
                decree_date: Set(academic_year.start_date.unwrap_or_default()), // Assuming start_date exists
                activity_id: Set(unit_activity.id),
                staff_id: Set(None),
                feeder_id: Set(Some(uuid::Uuid::nil())),
                created_at: Set(Some(chrono::Utc::now().naive_utc())),
                updated_at: Set(Some(chrono::Utc::now().naive_utc())),
                ..Default::default()
            };
            new_decree
                .insert(db)
                .await
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?
                .id
        };

        // 7. Upsert Teach
        let existing_teach = teaches::Entity::find()
            .filter(teaches::Column::ClassCodeId.eq(class_code.id))
            .filter(teaches::Column::ActivityId.eq(unit_activity.id))
            .filter(teaches::Column::CourseId.eq(course.id))
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let (mut active_model, is_new) = if let Some(existing) = existing_teach {
            (existing.into_active_model(), false)
        } else {
            let id = Uuid::new_v4();
            (
                ActiveModel {
                    id: Set(id),
                    ..Default::default()
                },
                true,
            )
        };

        // keys
        active_model.class_code_id = Set(class_code.id);
        active_model.activity_id = Set(Some(unit_activity.id));
        active_model.course_id = Set(course.id);

        // fields from logic
        active_model.start_date = Set(academic_year.start_date);
        active_model.end_date = Set(academic_year.end_date);

        // practice credits logic
        if course.practice_credit > 0.0
            && course.field_practice_credit > 0.0
            && course.simulation_credit > 0.0
        {
            active_model.practice_start_date = Set(academic_year.start_date);
            active_model.practice_end_date = Set(academic_year.end_date);
        }

        active_model.max_member = Set(Some(40));

        let scope_uuid =
            uuid::Uuid::parse_str("3b0a29f3-2402-44d8-8d67-62a882c59b94").unwrap_or_default();
        active_model.scope_id = Set(Some(scope_uuid));

        active_model.curriculum_detail_id = Set(None);
        active_model.encounter_category_id = Set(None);

        // feeder_id = record.id_kelas
        active_model.feeder_id = Set(record.id_kelas);

        active_model.teach_decree_id = Set(teach_decree_id);

        let teach_name = format!(
            "AktifitasPengajaran {} {} {} {}",
            institution_code, unit.code.as_deref().unwrap_or(""), academic_year.feeder_name, course.code
        );
        active_model.name = Set(Some(teach_name.clone()));

        // Explicitly set timestamps for insert (and update to be safe, though auto-update usually handles it)
        active_model.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        if active_model.created_at.is_not_set() {
            active_model.created_at = Set(Some(chrono::Utc::now().naive_utc()));
        }

        let result = if is_new {
            active_model
                .insert(db)
                .await
                .map(|m| m.into_active_model())
        } else {
            active_model.save(db).await
        };

        match result {
            Ok(_) => {
                println!("✅ Upserted Teach: {:?}", teach_name.clone());
                Ok(())
            }
            Err(e) => {
                let msg = e.to_string();
                if msg.contains("RecordNotUpdated")
                    || msg.contains("None of the records are updated")
                {
                    println!(
                        "ℹ️ Skipped Teach Update (No Changes) for Teach: {:?}",
                        teach_name
                    );
                    return Ok(());
                }
                Err(Box::new(e))
            }
        }
    
}