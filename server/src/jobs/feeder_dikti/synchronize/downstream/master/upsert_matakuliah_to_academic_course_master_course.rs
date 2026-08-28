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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_matakuliah_to_academic_course_master_course")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::academic::course::master::courses::{self, ActiveModel};
use crate::models::academic::course::reference::varieties as AcademicCourseReferenceVariety;
use crate::models::feeder::master::matakuliah;
use crate::models::institution::master::units as InstitutionMasterUnit;

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct WorkerArgs {
    pub record: matakuliah::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

        let record = args.record;
        
        // 1. Find Unit
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
                    "❌ Unit not found for matakuliah: {:?} (id_prodi: {:?}). Skipping.",
                    record.nama_mata_kuliah, record.id_prodi
                );
                return Ok(());
            }
        };

        // 2. Find Variety
        let variety_id = if let Some(code) = &record.id_jenis_mata_kuliah {
            let v = AcademicCourseReferenceVariety::Entity::find()
                .filter(AcademicCourseReferenceVariety::Column::AlphabetCode.eq(code))
                .one(db)
                .await
                .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;
            match v {
                Some(val) => val.id,
                None => uuid::Uuid::nil(),
            }
        } else {
            uuid::Uuid::nil()
        };

        // 3. Upsert Course
        let id_matkul = match record.id_matkul {
            Some(id) => id,
            None => {
                println!("❌ Matakuliah has no id_matkul. Skipping.");
                return Ok(());
            }
        };

        let code = record
            .kode_mata_kuliah
            .clone()
            .unwrap_or_default()
            .trim()
            .to_string();
        let name = record
            .nama_mata_kuliah
            .clone()
            .unwrap_or_default()
            .trim()
            .to_string();

        let existing = courses::Entity::find()
            .filter(courses::Column::Code.eq(&code))
            .filter(courses::Column::Name.eq(&name))
            .filter(courses::Column::UnitId.eq(unit.id))
            .one(db)
            .await
            .map_err(|e| Box::new(e) as Box<dyn std::error::Error + Send + Sync>)?;

        let mut active_model = if let Some(existing_model) = existing {
            existing_model.into_active_model()
        } else {
            let id = Uuid::new_v4();
            ActiveModel {
                id: Set(id),
                ..Default::default()
            }
        };

        active_model.code = Set(code.clone());
        active_model.name = Set(name.clone());
        active_model.total_credit = Set(record.sks_mata_kuliah.unwrap_or(0.0) as f64);
        active_model.lecture_credit = Set(record.sks_tatap_muka.unwrap_or(0.0) as f64);
        active_model.practice_credit = Set(record.sks_praktek.unwrap_or(0.0) as f64);
        active_model.field_practice_credit = Set(record.sks_praktek_lapangan.unwrap_or(0.0) as f64);
        active_model.simulation_credit = Set(record.sks_simulasi.unwrap_or(0.0) as f64);

        active_model.has_syllabus =
            Set(record.ada_sap.unwrap_or(false) || record.ada_silabus.unwrap_or(false));
        active_model.has_material = Set(record.ada_bahan_ajar.unwrap_or(false));
        active_model.has_practice = Set(record.ada_acara_praktek.unwrap_or(false));
        active_model.has_dictation = Set(record.ada_diktat.unwrap_or(false));

        active_model.start_date = Set(record.tanggal_mulai_efektif.map(|dt| dt.date()));
        active_model.end_date = Set(record.tanggal_selesai_efektif.map(|dt| dt.date()));

        active_model.unit_id = Set(unit.id);
        active_model.variety_id = Set(variety_id);
        active_model.group_id = Set(Some(uuid::Uuid::nil()));
        active_model.feeder_course_id = Set(Some(id_matkul));
        active_model.feeder_course_group_id = Set(Some(uuid::Uuid::nil()));
        active_model.feeder_course_type_id = Set(Some(uuid::Uuid::nil()));
        active_model.competence_id = Set(Some(uuid::Uuid::nil()));
        active_model.has_unit = Set(true);

        let name_val = format!(
            "{} {}",
            active_model.code.clone().unwrap(),
            active_model.name.clone().unwrap()
        );
        active_model.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        active_model.sync_at = Set(Some(chrono::Utc::now().naive_utc()));
        active_model.deleted_at = Set(None);

        if active_model.created_at.is_not_set() {
            active_model.created_at = Set(Some(chrono::Utc::now().naive_utc()));
        }

        match active_model.clone().save(db).await {
            Ok(_) => {
                println!("✅ Upserted Course: {}", name_val);
                Ok(())
            }
            Err(e) => {
                // println!("Info Matakuliah: {:#?}", record);
                // println!("Info Course: {:#?}", active_model.clone());
                let msg = e.to_string();
                if msg.contains("RecordNotUpdated")
                    || msg.contains("None of the records are updated")
                {
                    println!(
                        "ℹ️ Update failed (row missing?), attempting INSERT for: {}",
                        name_val
                    );
                    match courses::Entity::insert(active_model.clone())
                        .exec(db)
                        .await
                    {
                        Ok(_) => {
                            println!("✅ Upserted (via Insert Fallback) Course: {}", name_val);
                            return Ok(());
                        }
                        Err(e_insert) => {
                            println!("❌ Insert Fallback Failed: {} - {}", name_val, e_insert);
                        }
                    }
                }
                println!("❌ Error Upserting Course: {} - {}", name_val, msg);
                Err(Box::new(e))
            }
        }
    
}