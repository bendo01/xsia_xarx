use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::riwayat_sertifikasi_dosen as riwayat_sertifikasi_dosen;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RiwayatSertifikasiDosen {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub nomor_peserta: Option<String>,
    pub id_bidang_studi: Option<i32>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenis_sertifikasi: Option<String>,
    pub nama_jenis_sertifikasi: Option<String>,
    pub tahun_sertifikasi: Option<String>,
    pub sk_sertifikasi: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<RiwayatSertifikasiDosen>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_riwayat_sertifikasi_dosen")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &RiwayatSertifikasiDosen) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_dosen = record
            .id_dosen
            .ok_or("id_dosen is required for upsert")?;

        let id_jenis_sertifikasi = record.id_jenis_sertifikasi.clone().ok_or_else(|| {
            "id_jenis_sertifikasi is required for upsert".into()
        })?;

        let tahun_sertifikasi = record.tahun_sertifikasi.clone().ok_or_else(|| {
            "tahun_sertifikasi is required for upsert".into()
        })?;

        let sync_time = Local::now().naive_local();

        let existing = riwayat_sertifikasi_dosen::Entity::find()
            .filter(riwayat_sertifikasi_dosen::Column::DeletedAt.is_null())
            .filter(riwayat_sertifikasi_dosen::Column::IdDosen.eq(id_dosen))
            .filter(
                riwayat_sertifikasi_dosen::Column::IdJenisSertifikasi
                    .eq(id_jenis_sertifikasi.clone()),
            )
            .filter(
                riwayat_sertifikasi_dosen::Column::TahunSertifikasi.eq(tahun_sertifikasi.clone()),
            )
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: riwayat_sertifikasi_dosen::ActiveModel =
                existing_record.into_active_model();

            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.nomor_peserta = Set(record.nomor_peserta.clone());
            active.id_bidang_studi = Set(record.id_bidang_studi.map(|v| v.to_string()));
            active.nama_bidang_studi = Set(record.nama_bidang_studi.clone());
            active.nama_jenis_sertifikasi = Set(record.nama_jenis_sertifikasi.clone());
            active.sk_sertifikasi = Set(record.sk_sertifikasi.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_sertifikasi_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen)),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                nomor_peserta: Set(record.nomor_peserta.clone()),
                id_bidang_studi: Set(record.id_bidang_studi.map(|v| v.to_string())),
                nama_bidang_studi: Set(record.nama_bidang_studi.clone()),
                id_jenis_sertifikasi: Set(Some(id_jenis_sertifikasi)),
                nama_jenis_sertifikasi: Set(record.nama_jenis_sertifikasi.clone()),
                tahun_sertifikasi: Set(Some(tahun_sertifikasi)),
                sk_sertifikasi: Set(record.sk_sertifikasi.clone()),
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
