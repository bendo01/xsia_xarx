use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::Local;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::referensi::jenis_aktifitas_mahasiswa as jenis_aktifitas_mahasiswa;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GetJenisAktifitasMahasiswaResponse {
    pub id_jenis_aktivitas_mahasiswa: Option<String>,
    pub nama_jenis_aktivitas_mahasiswa: String,
    pub untuk_kampus_merdeka: Option<String>,
    pub jenis_aktivitas_mahasiswa: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetJenisAktifitasMahasiswaResponse>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:reference:get_jenis_aktifitas_mahasiswa")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetJenisAktifitasMahasiswaResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_jenis_aktivitas_mahasiswa = record
            .id_jenis_aktivitas_mahasiswa
            .clone()
            .ok_or("id_jenis_aktivitas_mahasiswa is missing")?;

        let sync_time = Local::now().naive_local();

        let existing = jenis_aktifitas_mahasiswa::Entity::find()
            .filter(jenis_aktifitas_mahasiswa::Column::DeletedAt.is_null())
            .filter(
                jenis_aktifitas_mahasiswa::Column::IdJenisAktivitasMahasiswa
                    .eq(id_jenis_aktivitas_mahasiswa.clone()),
            )
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: jenis_aktifitas_mahasiswa::ActiveModel =
                existing_record.into_active_model();

            // Update fields that are present in GetJenisAktifitasMahasiswaResponse
            active.nama_jenis_aktivitas_mahasiswa =
                Set(Some(record.nama_jenis_aktivitas_mahasiswa.clone()));
            active.untuk_kampus_merdeka = Set(record.untuk_kampus_merdeka.clone());
            active.jenis_aktivitas_mahasiswa = Set(record.jenis_aktivitas_mahasiswa.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = jenis_aktifitas_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_jenis_aktivitas_mahasiswa: Set(Some(id_jenis_aktivitas_mahasiswa)),
                nama_jenis_aktivitas_mahasiswa: Set(Some(
                    record.nama_jenis_aktivitas_mahasiswa.clone(),
                )),
                untuk_kampus_merdeka: Set(record.untuk_kampus_merdeka.clone()),
                jenis_aktivitas_mahasiswa: Set(record.jenis_aktivitas_mahasiswa.clone()),

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
