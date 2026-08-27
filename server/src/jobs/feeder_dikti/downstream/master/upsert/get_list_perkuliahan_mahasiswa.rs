use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::perkuliahan_mahasiswa as perkuliahan_mahasiswa;

use crate::library::deserialization::de_opt_f32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputDetailPerkuliahanMahasiswa {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub angkatan: Option<String>,
    pub id_semester: Option<String>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub nama_semester: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ips: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_semester: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_total: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputListPerkuliahanMahasiswa {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub angkatan: Option<String>,
    pub id_periode_masuk: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ips: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_semester: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_total: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub biaya_kuliah_smt: Option<f32>,
    pub id_pembiayaan: Option<String>,
    pub status_sync: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputListPerkuliahanMahasiswa>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_perkuliahan_mahasiswa")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListPerkuliahanMahasiswa) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that required fields exist - using composite key (id_registrasi_mahasiswa + id_semester)
        let id_registrasi_mahasiswa = record
            .id_registrasi_mahasiswa
            .ok_or_else(|| "Missing id_registrasi_mahasiswa".into())?;

        let id_semester = record
            .id_semester
            .as_ref()
            .ok_or_else(|| "Missing id_semester".into())?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists using composite key
        let existing = perkuliahan_mahasiswa::Entity::find()
            .filter(perkuliahan_mahasiswa::Column::DeletedAt.is_null())
            .filter(
                perkuliahan_mahasiswa::Column::IdRegistrasiMahasiswa.eq(id_registrasi_mahasiswa),
            )
            .filter(perkuliahan_mahasiswa::Column::IdSemester.eq(id_semester))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: perkuliahan_mahasiswa::ActiveModel =
                existing_record.into_active_model();

            active.nim = Set(record.nim.clone());
            active.nama_mahasiswa = Set(record.nama_mahasiswa.clone());
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.angkatan = Set(record.angkatan.clone());
            active.id_periode_masuk = Set(record.id_periode_masuk.clone());
            active.nama_semester = Set(record.nama_semester.clone());
            active.id_status_mahasiswa = Set(record.id_status_mahasiswa.clone());
            active.nama_status_mahasiswa = Set(record.nama_status_mahasiswa.clone());
            active.ips = Set(record.ips);
            active.ipk = Set(record.ipk);
            active.sks_semester = Set(record.sks_semester);
            active.sks_total = Set(record.sks_total);
            active.biaya_kuliah_smt = Set(record.biaya_kuliah_smt);
            active.id_pembiayaan = Set(record.id_pembiayaan.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = perkuliahan_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(Some(id_registrasi_mahasiswa)),
                nim: Set(record.nim.clone()),
                nama_mahasiswa: Set(record.nama_mahasiswa.clone()),
                angkatan: Set(record.angkatan.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                id_periode_masuk: Set(record.id_periode_masuk.clone()),
                id_semester: Set(Some(id_semester.clone())),
                nama_semester: Set(record.nama_semester.clone()),
                id_status_mahasiswa: Set(record.id_status_mahasiswa.clone()),
                nama_status_mahasiswa: Set(record.nama_status_mahasiswa.clone()),
                ips: Set(record.ips),
                ipk: Set(record.ipk),
                sks_semester: Set(record.sks_semester),
                sks_total: Set(record.sks_total),
                biaya_kuliah_smt: Set(record.biaya_kuliah_smt),
                id_pembiayaan: Set(record.id_pembiayaan.clone()),
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
