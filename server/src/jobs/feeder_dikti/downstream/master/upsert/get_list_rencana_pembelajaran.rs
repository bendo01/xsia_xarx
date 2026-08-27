use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::rencana_pembelajaran as rencana_pembelajaran;

use crate::library::deserialization::{de_opt_f32, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_rencana_ajar: Uuid,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub pertemuan: Option<i32>,
    pub materi_indonesia: Option<String>,
    pub materi_inggris: Option<String>,
    pub status_sync: Option<String>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_rencana_pembelajaran")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_rencana_ajar = record.id_rencana_ajar;

        let sync_time = Local::now().naive_local();

        let existing = rencana_pembelajaran::Entity::find()
            .filter(rencana_pembelajaran::Column::DeletedAt.is_null())
            .filter(rencana_pembelajaran::Column::IdRencanaAjar.eq(id_rencana_ajar))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: rencana_pembelajaran::ActiveModel = existing_record.into_active_model();

            active.id_matkul = Set(record.id_matkul);
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.pertemuan = Set(record.pertemuan);
            active.materi_indonesia = Set(record.materi_indonesia.clone());
            active.materi_inggris = Set(record.materi_inggris.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = rencana_pembelajaran::ActiveModel {
                id: Set(pk_id),
                id_rencana_ajar: Set(Some(id_rencana_ajar)),
                id_matkul: Set(record.id_matkul),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                pertemuan: Set(record.pertemuan),
                materi_indonesia: Set(record.materi_indonesia.clone()),
                materi_inggris: Set(record.materi_inggris.clone()),
                status_sync: Set(record.status_sync.clone()),
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
