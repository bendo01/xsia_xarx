use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::komponen_evaluasi_kelas as komponen_evaluasi_kelas;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_komponen_evaluasi: Option<Uuid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_kelas_kuliah: Option<Uuid>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        deserialize_with = "de_opt_i32"
    )]
    pub id_jenis_evaluasi: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nama: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nama_inggris: Option<String>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        deserialize_with = "de_opt_i32"
    )]
    pub nomor_urut: Option<i32>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        deserialize_with = "de_opt_i32"
    )]
    pub bobot_evaluasi: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy", default)]
    pub last_update: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy", default)]
    pub tgl_create: Option<NaiveDate>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_komponen_evaluasi_kelas")
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


    /// Upsert a single komponen evaluasi kelas record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_komponen_evaluasi` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate required fields
        let id_komponen_evaluasi = record
            .id_komponen_evaluasi
            .ok_or("Missing id_komponen_evaluasi")?;

        let id_kelas_kuliah = record
            .id_kelas_kuliah
            .ok_or("Missing id_kelas_kuliah")?;

        let id_jenis_evaluasi = record
            .id_jenis_evaluasi
            .ok_or("Missing id_jenis_evaluasi")?;

        let nomor_urut = record
            .nomor_urut
            .ok_or("Missing nomor_urut")?;

        let bobot_evaluasi = record
            .bobot_evaluasi
            .ok_or("Missing bobot_evaluasi")?;

        let last_update = record
            .last_update
            .ok_or("Missing last_update")?;

        let tgl_create = record
            .tgl_create
            .ok_or("Missing tgl_create")?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = komponen_evaluasi_kelas::Entity::find()
            .filter(komponen_evaluasi_kelas::Column::DeletedAt.is_null())
            .filter(komponen_evaluasi_kelas::Column::IdKomponenEvaluasi.eq(id_komponen_evaluasi))
            .filter(komponen_evaluasi_kelas::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .filter(komponen_evaluasi_kelas::Column::IdJenisEvaluasi.eq(id_jenis_evaluasi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: komponen_evaluasi_kelas::ActiveModel =
                existing_record.into_active_model();

            active.id_kelas_kuliah = Set(id_kelas_kuliah);
            active.id_jenis_evaluasi = Set(id_jenis_evaluasi);
            active.nama = Set(record.nama.clone());
            active.nama_inggris = Set(record.nama_inggris.clone());
            active.nomor_urut = Set(nomor_urut);
            active.bobot_evaluasi = Set(bobot_evaluasi.to_string());
            active.last_update = Set(last_update);
            active.tgl_create = Set(tgl_create);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = komponen_evaluasi_kelas::ActiveModel {
                id: Set(pk_id),
                id_komponen_evaluasi: Set(id_komponen_evaluasi),
                id_kelas_kuliah: Set(id_kelas_kuliah),
                id_jenis_evaluasi: Set(id_jenis_evaluasi),
                nama: Set(record.nama.clone()),
                nama_inggris: Set(record.nama_inggris.clone()),
                nomor_urut: Set(nomor_urut),
                bobot_evaluasi: Set(bobot_evaluasi.to_string()),
                last_update: Set(last_update),
                tgl_create: Set(tgl_create),
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
