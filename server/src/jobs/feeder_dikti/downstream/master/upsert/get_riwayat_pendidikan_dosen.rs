use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::Local;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::riwayat_pendidikan_dosen as riwayat_pendidikan_dosen;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct RiwayatPendidikanDosen {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_bidang_studi: Option<i64>,
    pub nama_bidang_studi: Option<String>,
    pub id_jenjang_pendidikan: Option<String>,
    pub nama_jenjang_pendidikan: Option<String>,
    pub id_gelar_akademik: Option<i64>,
    pub nama_gelar_akademik: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub fakultas: Option<String>,
    pub tahun_lulus: Option<String>,
    pub sks_lulus: Option<String>,
    pub ipk: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<RiwayatPendidikanDosen>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_riwayat_pendidikan_dosen")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &RiwayatPendidikanDosen) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_dosen = record
            .id_dosen
            .ok_or("id_dosen is required for upsert")?;

        let id_jenjang_pendidikan = record.id_jenjang_pendidikan.clone().ok_or("id_jenjang_pendidikan is required for upsert")?;

        let nama_perguruan_tinggi = record.nama_perguruan_tinggi.clone().unwrap_or_default();
        let tahun_lulus = record.tahun_lulus.clone().unwrap_or_default();

        let sync_time = Local::now().naive_local();

        // Parse numbers
        let sks_lulus = record
            .sks_lulus
            .as_ref()
            .and_then(|s| s.parse::<f32>().ok());

        let ipk = record.ipk.as_ref().and_then(|s| s.parse::<f32>().ok());

        // Convert i64 to String for IDs
        let id_bidang_studi = record.id_bidang_studi.map(|v| v.to_string());
        let id_gelar_akademik = record.id_gelar_akademik.map(|v| v.to_string());

        let existing = riwayat_pendidikan_dosen::Entity::find()
            .filter(riwayat_pendidikan_dosen::Column::DeletedAt.is_null())
            .filter(riwayat_pendidikan_dosen::Column::IdDosen.eq(id_dosen))
            .filter(
                riwayat_pendidikan_dosen::Column::IdJenjangPendidikan
                    .eq(id_jenjang_pendidikan.clone()),
            )
            .filter(
                riwayat_pendidikan_dosen::Column::NamaPerguruanTinggi
                    .eq(nama_perguruan_tinggi.clone()),
            )
            .filter(riwayat_pendidikan_dosen::Column::TahunLulus.eq(tahun_lulus.clone()))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: riwayat_pendidikan_dosen::ActiveModel =
                existing_record.into_active_model();

            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.id_bidang_studi = Set(id_bidang_studi);
            active.nama_bidang_studi = Set(record.nama_bidang_studi.clone());
            active.nama_jenjang_pendidikan = Set(record.nama_jenjang_pendidikan.clone());
            active.id_gelar_akademik = Set(id_gelar_akademik);
            active.nama_gelar_akademik = Set(record.nama_gelar_akademik.clone());
            active.id_perguruan_tinggi = Set(record.id_perguruan_tinggi);
            active.fakultas = Set(record.fakultas.clone());
            active.sks_lulus = Set(sks_lulus);
            active.ipk = Set(ipk);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_pendidikan_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen)),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                id_bidang_studi: Set(id_bidang_studi),
                nama_bidang_studi: Set(record.nama_bidang_studi.clone()),
                id_jenjang_pendidikan: Set(Some(id_jenjang_pendidikan)),
                nama_jenjang_pendidikan: Set(record.nama_jenjang_pendidikan.clone()),
                id_gelar_akademik: Set(id_gelar_akademik),
                nama_gelar_akademik: Set(record.nama_gelar_akademik.clone()),
                id_perguruan_tinggi: Set(record.id_perguruan_tinggi),
                nama_perguruan_tinggi: Set(Some(nama_perguruan_tinggi)),
                fakultas: Set(record.fakultas.clone()),
                tahun_lulus: Set(Some(tahun_lulus)),
                sks_lulus: Set(sks_lulus),
                ipk: Set(ipk),
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
