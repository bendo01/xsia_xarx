use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::mahasiswa as mahasiswa;

use crate::library::deserialization::{
    de_opt_date_dmy,
    de_opt_f32,
    de_opt_i32, // <-- use i32 version
};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub nama_mahasiswa: String,
    pub jenis_kelamin: Option<String>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir: Option<NaiveDate>,

    // uuid in DB -> Uuid here (serde can parse from string)
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nipd: Option<String>,

    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,

    // integer in DB -> i32
    #[serde(deserialize_with = "de_opt_i32")]
    pub total_sks: Option<i32>,

    // uuid in DB
    pub id_sms: Option<Uuid>,

    // uuid in DB, required
    pub id_mahasiswa: Uuid,

    // integer in DB -> i32
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_agama: Option<i32>,

    pub nama_agama: Option<String>,

    // varchar in DB
    pub id_prodi: Option<String>,
    pub nama_program_studi: Option<String>,

    // integer in DB -> i32
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_status_mahasiswa: Option<i32>,

    pub nama_status_mahasiswa: Option<String>,
    pub nim: Option<String>,
    pub id_periode: Option<String>,
    pub nama_periode_masuk: Option<String>,

    // uuid in DB
    pub id_registrasi_mahasiswa: Option<Uuid>,

    pub id_periode_keluar: Option<String>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_keluar: Option<NaiveDate>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub last_update: Option<NaiveDate>,

    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,

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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_mahasiswa")
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


    /// Upsert a single mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_mahasiswa` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // id_mahasiswa is required (not Option in ModelInput)
        let id_mahasiswa = record.id_mahasiswa;

        // nama_mahasiswa is required (not Option in ModelInput)
        let nama_mahasiswa = &record.nama_mahasiswa;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = mahasiswa::Entity::find()
            .filter(mahasiswa::Column::DeletedAt.is_null())
            .filter(mahasiswa::Column::IdMahasiswa.eq(id_mahasiswa))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: mahasiswa::ActiveModel = existing_record.into_active_model();

            active.nama_mahasiswa = Set(Some(nama_mahasiswa.clone()));
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.tanggal_lahir = Set(record.tanggal_lahir);
            active.id_perguruan_tinggi = Set(record.id_perguruan_tinggi);
            active.nipd = Set(record.nipd.clone());
            active.ipk = Set(record.ipk);
            active.total_sks = Set(record.total_sks.map(|x| x as f32));
            active.id_sms = Set(record.id_sms);
            active.id_agama = Set(record.id_agama);
            active.nama_agama = Set(record.nama_agama.clone());
            active.id_prodi = Set(record
                .id_prodi
                .as_ref()
                .and_then(|s| uuid::Uuid::parse_str(s).ok()));
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.id_status_mahasiswa = Set(record.id_status_mahasiswa);
            active.nama_status_mahasiswa = Set(record.nama_status_mahasiswa.clone());
            active.nim = Set(record.nim.clone());
            active.id_periode = Set(record.id_periode.clone());
            active.nama_periode_masuk = Set(record.nama_periode_masuk.clone());
            active.id_registrasi_mahasiswa = Set(record.id_registrasi_mahasiswa);
            active.id_periode_keluar = Set(record.id_periode_keluar.clone());
            active.tanggal_keluar = Set(record.tanggal_keluar);
            active.last_update = Set(record.last_update);
            active.tgl_create = Set(record.tgl_create);
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_mahasiswa: Set(Some(id_mahasiswa)),
                nama_mahasiswa: Set(Some(nama_mahasiswa.clone())),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                tanggal_lahir: Set(record.tanggal_lahir),
                id_perguruan_tinggi: Set(record.id_perguruan_tinggi),
                nipd: Set(record.nipd.clone()),
                ipk: Set(record.ipk),
                total_sks: Set(record.total_sks.map(|x| x as f32)),
                id_sms: Set(record.id_sms),
                id_agama: Set(record.id_agama),
                nama_agama: Set(record.nama_agama.clone()),
                id_prodi: Set(record
                    .id_prodi
                    .as_ref()
                    .and_then(|s| uuid::Uuid::parse_str(s).ok())),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                id_status_mahasiswa: Set(record.id_status_mahasiswa),
                nama_status_mahasiswa: Set(record.nama_status_mahasiswa.clone()),
                nim: Set(record.nim.clone()),
                id_periode: Set(record.id_periode.clone()),
                nama_periode_masuk: Set(record.nama_periode_masuk.clone()),
                id_registrasi_mahasiswa: Set(record.id_registrasi_mahasiswa),
                id_periode_keluar: Set(record.id_periode_keluar.clone()),
                tanggal_keluar: Set(record.tanggal_keluar),
                last_update: Set(record.last_update),
                tgl_create: Set(record.tgl_create),
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

        // Commit transaction

        Ok(action.to_string())
    }

}
