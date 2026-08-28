use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::Local;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::profil_program_studi as profil_program_studi;

/// Feeder model for GetAllProdi endpoint
/// Returns all study programs across all institutions
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetAllProdiResponse {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub kode_program_studi: Option<String>,
    pub nama_program_studi: Option<String>,
    pub status: Option<String>,
    pub id_jenjang_pendidikan: Option<String>,
    pub nama_jenjang_pendidikan: Option<String>,
}

/// Feeder model for GetProdi endpoint
/// Returns study programs for a specific institution
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetProdiResponse {
    pub id_prodi: Option<Uuid>,
    pub kode_program_studi: Option<String>,
    pub nama_program_studi: Option<String>,
    pub status: Option<String>,
    pub id_jenjang_pendidikan: Option<String>,
    pub nama_jenjang_pendidikan: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetProdiResponse>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_prodi")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetProdiResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let institution_id = std::env::var("CURRENT_INSTITUTION_ID").ok().and_then(|s| Uuid::parse_str(&s).ok());
        let id_prodi = record
            .id_prodi
            .ok_or("id_prodi is missing")?;

        let sync_time = Local::now().naive_local();

        let existing = profil_program_studi::Entity::find()
            .filter(profil_program_studi::Column::DeletedAt.is_null())
            .filter(profil_program_studi::Column::IdProdi.eq(id_prodi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: profil_program_studi::ActiveModel = existing_record.into_active_model();

            // Update fields that are present in GetProdiResponse
            active.id_perguruan_tinggi = Set(institution_id);
            active.kode_program_studi = Set(record.kode_program_studi.clone());
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.status = Set(record.status.clone());
            active.id_jenjang_pendidikan = Set(record.id_jenjang_pendidikan.clone());
            active.nama_jenjang_pendidikan = Set(record.nama_jenjang_pendidikan.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = profil_program_studi::ActiveModel {
                id: Set(pk_id),
                id_prodi: Set(Some(id_prodi)),
                id_perguruan_tinggi: Set(institution_id),
                // Fields missing in GetProdiResponse but present in Entity
                kode_perguruan_tinggi: Set(None),
                nama_perguruan_tinggi: Set(None),

                kode_program_studi: Set(record.kode_program_studi.clone()),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                status: Set(record.status.clone()),
                id_jenjang_pendidikan: Set(record.id_jenjang_pendidikan.clone()),
                nama_jenjang_pendidikan: Set(record.nama_jenjang_pendidikan.clone()),
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
