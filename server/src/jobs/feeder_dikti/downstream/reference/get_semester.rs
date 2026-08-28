use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{Local, NaiveDate};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::referensi::semester as semester;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GetSemesterResponse {
    pub id_semester: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_semester: Option<String>,
    pub semester: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<String>,
    pub tanggal_selesai: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetSemesterResponse>,
}

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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:reference:get_semester")
        .data(db)
        .backend(storage)
        .build_fn(handle_job);

    Ok(Monitor::new().register(worker))
}

pub struct Worker;

impl Worker {
    pub async fn perform(db: &DatabaseConnection, args: WorkerArgs) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;
        let mut success_count = 0;
        let mut error_count = 0;

        for (index, record) in args.records.iter().enumerate() {
            match Self::upsert_record(&txn, record).await {
                Ok(_action) => {
                    success_count += 1;
                }
                Err(e) => {
                    error_count += 1;
                    eprintln!("  ❌ Record {}/{}: Failed - error: {}", index + 1, args.records.len(), e);
                }
            }
        }

        if error_count > 0 {
            eprintln!("⚠️ Batch completed with {} successes and {} errors", success_count, error_count);
        }

        txn.commit().await?;
        Ok(())
    }


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetSemesterResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_semester = record
            .id_semester
            .clone()
            .ok_or("id_semester is missing")?;

        // Helper to parse dates safely
        let parse_date = |date_str: Option<&String>| -> Result<Option<NaiveDate>, Box<dyn std::error::Error + Send + Sync>> {
            if let Some(ds) = date_str {
                match NaiveDate::parse_from_str(ds, "%Y-%m-%d") {
                    Ok(d) => Ok(Some(d)),
                    Err(_) => {
                        // Try fallback if needed, or check for ISO format with time
                        if let Ok(dt) =
                            chrono::NaiveDateTime::parse_from_str(ds, "%Y-%m-%dT%H:%M:%S%.3fZ")
                        {
                            Ok(Some(dt.date()))
                        } else {
                            // Attempt to just parse the date part if it is longer
                            if ds.len() >= 10 {
                                match NaiveDate::parse_from_str(&ds[0..10], "%Y-%m-%d") {
                                    Ok(d) => Ok(Some(d)),
                                    Err(e) => {
                                        eprintln!("Failed to parse date: {} - {}", ds, e);
                                        Ok(None)
                                    }
                                }
                            } else {
                                Ok(None)
                            }
                        }
                    }
                }
            } else {
                Ok(None)
            }
        };

        let tanggal_mulai = parse_date(record.tanggal_mulai.as_ref())?;
        let tanggal_selesai = parse_date(record.tanggal_selesai.as_ref())?;

        let sync_time = Local::now().naive_local();

        let existing = semester::Entity::find()
            .filter(semester::Column::DeletedAt.is_null())
            .filter(semester::Column::IdSemester.eq(&id_semester))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: semester::ActiveModel = existing_record.into_active_model();

            // Update fields
            active.id_tahun_ajaran = Set(record.id_tahun_ajaran.clone());
            active.nama_semester = Set(record.nama_semester.clone());
            active.semester = Set(record.semester.clone());
            active.a_periode_aktif = Set(record.a_periode_aktif.clone());
            active.tanggal_mulai = Set(tanggal_mulai);
            active.tanggal_selesai = Set(tanggal_selesai);

            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = semester::ActiveModel {
                id: Set(pk_id),
                id_semester: Set(Some(id_semester)),
                id_tahun_ajaran: Set(record.id_tahun_ajaran.clone()),
                nama_semester: Set(record.nama_semester.clone()),
                semester: Set(record.semester.clone()),
                a_periode_aktif: Set(record.a_periode_aktif.clone()),
                tanggal_mulai: Set(tanggal_mulai),
                tanggal_selesai: Set(tanggal_selesai),

                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                created_by: Set(None),
                updated_by: Set(None),
                deleted_at: Set(None),
            };

            new_record.insert(txn).await?;
            "INSERTED"
        };


        Ok(action.to_string())
    }

}
