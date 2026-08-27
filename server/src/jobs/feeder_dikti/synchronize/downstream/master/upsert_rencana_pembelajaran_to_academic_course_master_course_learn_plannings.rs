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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:synchronize:downstream:master:upsert_rencana_pembelajaran_to_academic_course_master_course_learn_plannings")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

use crate::models::academic::course::master::course_learn_plannings::{self, ActiveModel};
use crate::models::academic::course::master::courses;
use crate::models::feeder::master::rencana_pembelajaran;
use crate::models::institution::master::institutions;
use crate::models::institution::master::units;

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        perform(db, args).await
    }
}

#[derive(Deserialize, Debug, Serialize)]
pub struct WorkerArgs {
    pub record: rencana_pembelajaran::Model,
}




async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {

        let record = args.record;
        
        // 1. Find Course
        let course = if let Some(id_matkul) = record.id_matkul {
            courses::Entity::find()
                .filter(courses::Column::FeederCourseId.eq(id_matkul))
                .one(db)
                .await
                .map_err(|e| e.into())?
        } else {
            println!("❌ Rencana Pembelajaran has no id_matkul. Skipping.");
            return Ok(());
        };

        let course = match course {
            Some(c) => c,
            None => {
                println!(
                    "❌ Course not found for Rencana Pembelajaran: {:?} (id_matkul: {:?}). Skipping.",
                    record.id_rencana_ajar, record.id_matkul
                );
                return Ok(());
            }
        };

        // 2. Find Unit and Institution for Title Construction
        let unit = units::Entity::find_by_id(course.unit_id)
            .one(db)
            .await
            .map_err(|e| e.into())?
            .ok_or_else(|| "Unit not found for course".into())?;

        let institution = institutions::Entity::find_by_id(unit.institution_id)
            .one(db)
            .await
            .map_err(|e| e.into())?
            .ok_or_else(|| "Institution not found for unit".into())?;

        let pertemuan = record.pertemuan.unwrap_or(0);

        // title = "RPS" space course.unit.institution.code space course.unit.code space course.code space rencana_pembelajaran.pertemuan
        let title = format!(
            "RPS {} {} {} {}",
            institution.code, unit.code, course.code, pertemuan
        );

        // 3. Upsert CourseLearnPlanning
        let feeder_id_rencana_ajar = match record.id_rencana_ajar {
            Some(id) => id,
            None => {
                println!("❌ Rencana Pembelajaran has no id_rencana_ajar. Skipping.");
                return Ok(());
            }
        };

        let existing = course_learn_plannings::Entity::find()
            .filter(course_learn_plannings::Column::FeederIdRencanaAjar.eq(feeder_id_rencana_ajar))
            .one(db)
            .await
            .map_err(|e| e.into())?;

        let mut active_model = if let Some(existing_model) = existing {
            existing_model.into_active_model()
        } else {
            let id = ();
            ActiveModel {
                id: Set(id),
                ..Default::default()
            }
        };

        active_model.course_id = Set(course.id);
        active_model.feeder_id_rencana_ajar = Set(feeder_id_rencana_ajar);

        // Handling potentially nullable string fields from source -> non-nullable in target if needed,
        // or just mapping options if target allows.
        // Target decription_indonesian is Text (non-nullable based on schema viewing earlier? Let's re-verify if needed, but usually we use unwrap_or_default for strings)
        // Checked file: pub decription_indonesian: String,
        active_model.decription_indonesian = Set(record.materi_indonesia.unwrap_or_default());
        active_model.decription_english = Set(record.materi_inggris); // Target is Option<String>
        active_model.code = Set(pertemuan);
        // active_model.title = Set(title.clone());
        active_model.name = Set(title.clone()); // Using title for name as well

        active_model.updated_at = Set(Some(chrono::Utc::now().naive_utc()));
        active_model.sync_at = Set(Some(chrono::Utc::now().naive_utc()));
        active_model.deleted_at = Set(None);

        if active_model.created_at.is_not_set() {
            active_model.created_at = Set(Some(chrono::Utc::now().naive_utc()));
        }

        match active_model.clone().save(db).await {
            Ok(_) => {
                println!("✅ Upserted CourseLearnPlanning: {}", title);
                Ok(())
            }
            Err(e) => {
                let msg = e.to_string();
                if msg.contains("RecordNotUpdated")
                    || msg.contains("None of the records are updated")
                {
                    println!(
                        "ℹ️ Update failed (row missing?), attempting INSERT for: {}",
                        title
                    );
                    match course_learn_plannings::Entity::insert(active_model.clone())
                        .exec(db)
                        .await
                    {
                        Ok(_) => {
                            println!(
                                "✅ Upserted (via Insert Fallback) CourseLearnPlanning: {}",
                                title
                            );
                            return Ok(());
                        }
                        Err(e_insert) => {
                            println!("❌ Insert Fallback Failed: {} - {}", title, e_insert);
                        }
                    }
                }
                println!(
                    "❌ Error Upserting CourseLearnPlanning: {} - {}",
                    title, msg
                );
                Err(e.into())
            }
        }
    
}