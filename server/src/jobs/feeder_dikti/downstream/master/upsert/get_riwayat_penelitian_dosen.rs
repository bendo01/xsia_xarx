use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::Local;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::riwayat_penelitian_dosen as riwayat_penelitian_dosen;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RiwayatPenelitianDosen {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_penelitian: Option<Uuid>,
    pub judul_penelitian: Option<String>,
    pub id_kelompok_bidang: Option<Uuid>,
    pub kode_kelompok_bidang: Option<String>,
    pub nama_kelompok_bidang: Option<String>,
    pub id_lembaga_iptek: Option<Uuid>,
    pub nama_lembaga_iptek: Option<String>,
    pub tahun_kegiatan: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<RiwayatPenelitianDosen>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_riwayat_penelitian_dosen")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &RiwayatPenelitianDosen) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_dosen = record
            .id_dosen
            .ok_or("id_dosen is required for upsert")?;

        let id_penelitian = record
            .id_penelitian
            .ok_or("id_penelitian is required for upsert")?;

        let sync_time = Local::now().naive_local();

        let existing = riwayat_penelitian_dosen::Entity::find()
            .filter(riwayat_penelitian_dosen::Column::DeletedAt.is_null())
            .filter(riwayat_penelitian_dosen::Column::IdDosen.eq(id_dosen))
            .filter(riwayat_penelitian_dosen::Column::IdPenelitian.eq(id_penelitian))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: riwayat_penelitian_dosen::ActiveModel =
                existing_record.into_active_model();

            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.judul_penelitian = Set(record.judul_penelitian.clone());
            active.id_kelompok_bidang = Set(record.id_kelompok_bidang);
            active.kode_kelompok_bidang = Set(record.kode_kelompok_bidang.clone());
            active.nama_kelompok_bidang = Set(record.nama_kelompok_bidang.clone());
            active.id_lembaga_iptek = Set(record.id_lembaga_iptek);
            active.nama_lembaga_iptek = Set(record.nama_lembaga_iptek.clone());
            active.tahun_kegiatan = Set(record.tahun_kegiatan.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_penelitian_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen)),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                id_penelitian: Set(Some(id_penelitian)),
                judul_penelitian: Set(record.judul_penelitian.clone()),
                id_kelompok_bidang: Set(record.id_kelompok_bidang),
                kode_kelompok_bidang: Set(record.kode_kelompok_bidang.clone()),
                nama_kelompok_bidang: Set(record.nama_kelompok_bidang.clone()),
                id_lembaga_iptek: Set(record.id_lembaga_iptek),
                nama_lembaga_iptek: Set(record.nama_lembaga_iptek.clone()),
                tahun_kegiatan: Set(record.tahun_kegiatan.clone()),
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
