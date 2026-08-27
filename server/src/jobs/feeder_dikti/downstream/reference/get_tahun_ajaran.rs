use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::referensi::tahun_ajaran as tahun_ajaran;

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
pub struct GetTahunAjaranResponse {
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub a_periode_aktif: Option<String>,
    pub tanggal_mulai: Option<String>,
    pub tanggal_selesai: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetTahunAjaranResponse>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:reference:get_tahun_ajaran")
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


    fn parse_date_string(date_str: Option<&String>) -> Option<NaiveDate> {
        match date_str {
            Some(s) if !s.is_empty() => {
                // Try parsing with time "YYYY-MM-DDTHH:MM:SS..." first
                if let Ok(dt) = chrono::DateTime::parse_from_rfc3339(s) {
                    return Some(dt.naive_local().date());
                }
                // Try parsing just date "YYYY-MM-DD"
                if let Ok(d) = NaiveDate::parse_from_str(s, "%Y-%m-%d") {
                    return Some(d);
                }
                eprintln!("Failed to parse date string: {}", s);
                None
            }
            _ => None,
        }
    }

    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetTahunAjaranResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_tahun_ajaran = record
            .id_tahun_ajaran
            .clone()
            .ok_or("id_tahun_ajaran is missing")?;

        let tanggal_mulai = Self::parse_date_string(record.tanggal_mulai.as_ref());
        let tanggal_selesai = Self::parse_date_string(record.tanggal_selesai.as_ref());

        let sync_time = Local::now().naive_local();

        let existing = tahun_ajaran::Entity::find()
            .filter(tahun_ajaran::Column::DeletedAt.is_null())
            .filter(tahun_ajaran::Column::IdTahunAjaran.eq(&id_tahun_ajaran))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: tahun_ajaran::ActiveModel = existing_record.into_active_model();

            // Update fields
            active.nama_tahun_ajaran = Set(record.nama_tahun_ajaran.clone());
            active.a_periode_aktif = Set(record.a_periode_aktif.clone());
            active.tanggal_mulai = Set(tanggal_mulai);
            active.tanggal_selesai = Set(tanggal_selesai);

            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = tahun_ajaran::ActiveModel {
                id: Set(pk_id),
                id_tahun_ajaran: Set(Some(id_tahun_ajaran)),
                nama_tahun_ajaran: Set(record.nama_tahun_ajaran.clone()),
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
