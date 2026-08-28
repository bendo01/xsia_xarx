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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_kartu_rencana_studi_mahasiswa_to_academic_campaign_transaction_class_code")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::academic::campaign::transaction::activities;
use crate::models::academic::campaign::transaction::class_codes::{
    self, ActiveModel,
};
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

        // 3. Get KegiatanPerkuliahan Activity for unit + academic_year
        let unit_activity = activities::Entity::find()
            .filter(activities::Column::UnitId.eq(unit.id))
            .filter(activities::Column::AcademicYearId.eq(academic_year.id))
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let unit_activity = match unit_activity {
            Some(act) => act,
            None => {
                println!(
                    "❌ KegiatanPerkuliahan Activity not found for Unit {:?} and AcademicYear {:?}. Skipping.",
                    unit.id, academic_year.id
                );
                return Ok(());
            }
        };

        // 4. Find existing Class Code by activity_id + alphabet_code = kartu.nama_kelas_kuliah
        let class_name_from_feeder = match &record.nama_kelas_kuliah {
            Some(name) => name.clone(),
            None => {
                println!("❌ nama_kelas_kuliah is missing in KMRS record. Skipping.");
                return Ok(());
            }
        };

        let existing_class = class_codes::Entity::find()
            .filter(class_codes::Column::ActivityId.eq(unit_activity.id))
            .filter(class_codes::Column::AlphabetCode.eq(&class_name_from_feeder))
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let mut active_model = if let Some(existing) = existing_class {
            existing.into_active_model()
        } else {
            let id = Uuid::new_v4();
            ActiveModel {
                id: Set(id),
                ..Default::default()
            }
        };

        // 5. Upsert Class Code
        // - alphabet_code: kartu.nama_kelas_kuliah
        active_model.alphabet_code = Set(Some(class_name_from_feeder.clone()));

        // - name: "KelasKuliah" space unit.institution.code space unit.code space academic_year.feeder_name space kartu.nama_kelas_kuliah
        let generated_name = format!(
            "KelasKuliah {} {} {} {}",
            institution_code, unit.code.as_deref().unwrap_or(""), academic_year.feeder_name, class_name_from_feeder
        );
        active_model.name = Set(generated_name.clone());

        // - activity_id: unit_activity.id
        active_model.activity_id = Set(unit_activity.id);

        // - start_effective_date: academic_year.start_date
        active_model.start_effective_date = Set(academic_year.start_date);

        // - end_effective_date: academic_year.end_date
        active_model.end_effective_date = Set(academic_year.end_date);

        // - unit_id = unit.id
        active_model.unit_id = Set(Some(unit.id));

        // - capacity = 40
        active_model.capacity = Set(Some(40));

        match active_model.save(db).await {
            Ok(_) => {
                println!("✅ Upserted ClassCode: {}", generated_name);
                Ok(())
            }
            Err(e) => {
                let msg = e.to_string();
                if msg.contains("RecordNotUpdated")
                    || msg.contains("None of the records are updated")
                {
                    println!(
                        "ℹ️ Skipped ClassCode Update (No Changes): {}",
                        generated_name
                    );
                    return Ok(());
                }
                Err(Box::new(e))
            }
        }
    
}