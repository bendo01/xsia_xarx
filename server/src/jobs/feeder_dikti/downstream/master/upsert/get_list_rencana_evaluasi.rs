use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::rencana_evaluasi as rencana_evaluasi;

use crate::library::deserialization::de_opt_i32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_jenis_evaluasi: Option<i32>,
    pub id_rencana_evaluasi: Uuid,
    pub jenis_evaluasi: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub sks_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nama_evaluasi: Option<String>,
    pub deskripsi_indonesia: Option<String>,
    pub deskrips_inggris: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub nomor_urut: Option<i32>,
    pub bobot_evaluasi: Option<String>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_rencana_evaluasi")
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
        let id_rencana_evaluasi = record.id_rencana_evaluasi;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = rencana_evaluasi::Entity::find()
            .filter(rencana_evaluasi::Column::DeletedAt.is_null())
            .filter(rencana_evaluasi::Column::IdRencanaEvaluasi.eq(id_rencana_evaluasi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: rencana_evaluasi::ActiveModel = existing_record.into_active_model();

            active.id_jenis_evaluasi = Set(record.id_jenis_evaluasi.map(|v| v.to_string()));
            active.jenis_evaluasi = Set(record.jenis_evaluasi.clone());
            active.id_matkul = Set(record.id_matkul);
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah.clone());
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.nama_evaluasi = Set(record.nama_evaluasi.clone());
            active.deskripsi_indonesia = Set(record.deskripsi_indonesia.clone());
            active.deskrips_inggris = Set(record.deskrips_inggris.clone());
            active.nomor_urut = Set(record.nomor_urut.map(|v| v.to_string()));
            active.bobot_evaluasi = Set(record.bobot_evaluasi.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = rencana_evaluasi::ActiveModel {
                id: Set(pk_id),
                id_rencana_evaluasi: Set(Some(id_rencana_evaluasi)),
                id_jenis_evaluasi: Set(record.id_jenis_evaluasi.map(|v| v.to_string())),
                jenis_evaluasi: Set(record.jenis_evaluasi.clone()),
                id_matkul: Set(record.id_matkul),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                nama_evaluasi: Set(record.nama_evaluasi.clone()),
                deskripsi_indonesia: Set(record.deskripsi_indonesia.clone()),
                deskrips_inggris: Set(record.deskrips_inggris.clone()),
                nomor_urut: Set(record.nomor_urut.map(|v| v.to_string())),
                bobot_evaluasi: Set(record.bobot_evaluasi.clone()),
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
