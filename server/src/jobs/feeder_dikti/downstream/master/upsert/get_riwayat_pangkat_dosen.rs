use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::riwayat_pangkat_dosen as riwayat_pangkat_dosen;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_pangkat_golongan: Option<Uuid>,
    pub nama_pangkat_golongan: Option<String>,
    pub sk_pangkat: Option<String>,
    pub tanggal_sk_pangkat: Option<String>,
    pub mulai_sk_pangkat: Option<String>,
    pub masa_kerja_dalam_tahun: Option<String>,
    pub masa_kerja_dalam_bulan: Option<String>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_riwayat_pangkat_dosen")
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
        let id_dosen = record
            .id_dosen
            .ok_or_else(|| "id_dosen is required for upsert".into())?;

        let id_pangkat_golongan = record.id_pangkat_golongan.ok_or_else(|| {
            "id_pangkat_golongan is required for upsert".into()
        })?;

        let sync_time = Local::now().naive_local();

        // Parse dates
        let tanggal_sk_pangkat = record
            .tanggal_sk_pangkat
            .as_ref()
            .and_then(|date_str| NaiveDate::parse_from_str(date_str, "%d-%m-%Y").ok());

        let mulai_sk_pangkat = record
            .mulai_sk_pangkat
            .as_ref()
            .and_then(|date_str| NaiveDate::parse_from_str(date_str, "%d-%m-%Y").ok());

        // Parse integers
        let masa_kerja_dalam_tahun = record
            .masa_kerja_dalam_tahun
            .as_ref()
            .and_then(|s| s.parse::<i32>().ok());

        let masa_kerja_dalam_bulan = record
            .masa_kerja_dalam_bulan
            .as_ref()
            .and_then(|s| s.parse::<i32>().ok());

        let existing = riwayat_pangkat_dosen::Entity::find()
            .filter(riwayat_pangkat_dosen::Column::DeletedAt.is_null())
            .filter(riwayat_pangkat_dosen::Column::IdDosen.eq(id_dosen))
            .filter(riwayat_pangkat_dosen::Column::IdPangkatGolongan.eq(id_pangkat_golongan))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: riwayat_pangkat_dosen::ActiveModel =
                existing_record.into_active_model();

            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.nama_pangkat_golongan = Set(record.nama_pangkat_golongan.clone());
            active.sk_pangkat = Set(record.sk_pangkat.clone());
            active.tanggal_sk_pangkat = Set(tanggal_sk_pangkat);
            active.mulai_sk_pangkat = Set(mulai_sk_pangkat);
            active.masa_kerja_dalam_tahun = Set(masa_kerja_dalam_tahun);
            active.masa_kerja_dalam_bulan = Set(masa_kerja_dalam_bulan);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_pangkat_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen)),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                id_pangkat_golongan: Set(Some(id_pangkat_golongan)),
                nama_pangkat_golongan: Set(record.nama_pangkat_golongan.clone()),
                sk_pangkat: Set(record.sk_pangkat.clone()),
                tanggal_sk_pangkat: Set(tanggal_sk_pangkat),
                mulai_sk_pangkat: Set(mulai_sk_pangkat),
                masa_kerja_dalam_tahun: Set(masa_kerja_dalam_tahun),
                masa_kerja_dalam_bulan: Set(masa_kerja_dalam_bulan),
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
