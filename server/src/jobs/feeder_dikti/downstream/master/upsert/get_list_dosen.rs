use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{Local, NaiveDate};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::dosen as dosen;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    // uuid in DB, required
    pub id_dosen: Uuid,

    pub nama_dosen: String,
    pub nidn: Option<String>,
    pub nuptk: Option<String>, // Not in DB but in API response
    pub nip: Option<String>,
    pub jenis_kelamin: Option<String>,

    // integer in DB -> i32
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_agama: Option<i32>,

    pub nama_agama: Option<String>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir: Option<NaiveDate>,

    pub id_status_aktif: Option<String>,
    pub nama_status_aktif: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInput>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_dosen")
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


    /// Upsert a single dosen record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_dosen` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // id_dosen is required (not Option in ModelInput)
        let id_dosen = record.id_dosen;

        // nama_dosen is required (not Option in ModelInput)
        let nama_dosen = &record.nama_dosen;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = dosen::Entity::find()
            .filter(dosen::Column::DeletedAt.is_null())
            .filter(dosen::Column::IdDosen.eq(id_dosen))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: dosen::ActiveModel = existing_record.into_active_model();

            active.nama_dosen = Set(Some(nama_dosen.clone()));
            active.nidn = Set(record.nidn.clone());
            active.nip = Set(record.nip.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.id_agama = Set(record.id_agama);
            active.nama_agama = Set(record.nama_agama.clone());
            active.tanggal_lahir = Set(record.tanggal_lahir);
            active.id_status_aktif = Set(record.id_status_aktif.clone());
            active.nama_status_aktif = Set(record.nama_status_aktif.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen)),
                nama_dosen: Set(Some(nama_dosen.clone())),
                nidn: Set(record.nidn.clone()),
                nip: Set(record.nip.clone()),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                id_agama: Set(record.id_agama),
                nama_agama: Set(record.nama_agama.clone()),
                tanggal_lahir: Set(record.tanggal_lahir),
                id_status_aktif: Set(record.id_status_aktif.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_status_aktif: Set(record.nama_status_aktif.clone()),
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

        // Commit transaction

        Ok(action.to_string())
    }

}
