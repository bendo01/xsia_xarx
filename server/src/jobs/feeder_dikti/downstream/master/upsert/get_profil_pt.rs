use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{Local, NaiveDate, NaiveDateTime};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::profil_perguruan_tinggi as profil_perguruan_tinggi;

/// Feeder model for GetAllPT endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetAllPTResponse {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nama_singkat: Option<String>,
}

/// Feeder model for GetProfilPT endpoint
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GetProfilPTResponse {
    pub id_perguruan_tinggi: Option<Uuid>,
    pub kode_perguruan_tinggi: Option<String>,
    pub nama_perguruan_tinggi: Option<String>,
    pub telepon: Option<String>,
    pub faximile: Option<String>,
    pub email: Option<String>,
    pub website: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub rt_rw: Option<String>,
    pub kelurahan: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub lintang_bujur: Option<String>,
    pub bank: Option<String>,
    pub unit_cabang: Option<String>,
    pub nomor_rekening: Option<String>,
    pub mbs: Option<String>,
    pub luas_tanah_milik: Option<String>,
    pub luas_tanah_bukan_milik: Option<String>,
    pub sk_pendirian: Option<String>,
    pub tanggal_sk_pendirian: Option<String>, // Keep as String for now, parse later if needed
    pub id_status_milik: Option<String>,
    pub nama_status_milik: Option<String>,
    pub status_perguruan_tinggi: Option<String>,
    pub sk_izin_operasional: Option<String>,
    pub tanggal_izin_operasional: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetProfilPTResponse>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_profil_pt")
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


    fn parse_date(date_str: Option<&String>) -> Option<NaiveDate> {
        date_str.and_then(|s| {
            NaiveDate::parse_from_str(s, "%Y-%m-%d")
                .or_else(|_| NaiveDate::parse_from_str(s, "%d-%m-%Y"))
                .ok()
        })
    }

    fn parse_datetime(date_str: Option<&String>) -> Option<NaiveDateTime> {
        date_str.and_then(|s| {
            NaiveDateTime::parse_from_str(s, "%Y-%m-%d %H:%M:%S")
                .or_else(|_| NaiveDateTime::parse_from_str(s, "%Y-%m-%dT%H:%M:%S%.fZ"))
                .or_else(|_| NaiveDate::parse_from_str(s, "%Y-%m-%d").map(|d| d.and_hms_opt(0, 0, 0).unwrap()))
                .ok()
        })
    }

    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetProfilPTResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_perguruan_tinggi = record
            .id_perguruan_tinggi
            .ok_or("id_perguruan_tinggi is missing")?;

        let sync_time = Local::now().naive_local();

        let existing = profil_perguruan_tinggi::Entity::find()
            .filter(profil_perguruan_tinggi::Column::DeletedAt.is_null())
            .filter(profil_perguruan_tinggi::Column::IdPerguruanTinggi.eq(id_perguruan_tinggi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: profil_perguruan_tinggi::ActiveModel =
                existing_record.into_active_model();

            active.kode_perguruan_tinggi = Set(record.kode_perguruan_tinggi.clone());
            active.nama_perguruan_tinggi = Set(record.nama_perguruan_tinggi.clone());
            active.telepon = Set(record.telepon.clone());
            active.faximile = Set(record.faximile.clone());
            active.email = Set(record.email.clone());
            active.website = Set(record.website.clone());
            active.jalan = Set(record.jalan.clone());
            active.dusun = Set(record.dusun.clone());
            active.rt_rw = Set(record.rt_rw.clone());
            active.kelurahan = Set(record.kelurahan.clone());
            active.kode_pos = Set(record.kode_pos.clone());
            active.id_wilayah = Set(record.id_wilayah.clone());
            active.nama_wilayah = Set(record.nama_wilayah.clone());
            active.lintang_bujur = Set(record.lintang_bujur.clone());
            active.bank = Set(record.bank.clone());
            active.unit_cabang = Set(record.unit_cabang.clone());
            active.nomor_rekening = Set(record.nomor_rekening.clone());
            active.mbs = Set(record.mbs.clone());
            active.luas_tanah_milik = Set(record.luas_tanah_milik.clone());
            active.luas_tanah_bukan_milik = Set(record.luas_tanah_bukan_milik.clone());
            active.sk_pendirian = Set(record.sk_pendirian.clone());
            active.tanggal_sk_pendirian = Set(Self::parse_datetime(record.tanggal_sk_pendirian.as_ref()));
            active.id_status_milik = Set(record.id_status_milik.clone());
            active.nama_status_milik = Set(record.nama_status_milik.clone());
            active.status_perguruan_tinggi = Set(record.status_perguruan_tinggi.clone());
            active.sk_izin_operasional = Set(record.sk_izin_operasional.clone());
            active.tanggal_izin_operasional = Set(Self::parse_date(record.tanggal_izin_operasional.as_ref()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = profil_perguruan_tinggi::ActiveModel {
                id: Set(pk_id),
                id_perguruan_tinggi: Set(Some(id_perguruan_tinggi)),
                kode_perguruan_tinggi: Set(record.kode_perguruan_tinggi.clone()),
                nama_perguruan_tinggi: Set(record.nama_perguruan_tinggi.clone()),
                telepon: Set(record.telepon.clone()),
                faximile: Set(record.faximile.clone()),
                email: Set(record.email.clone()),
                website: Set(record.website.clone()),
                jalan: Set(record.jalan.clone()),
                dusun: Set(record.dusun.clone()),
                rt_rw: Set(record.rt_rw.clone()),
                kelurahan: Set(record.kelurahan.clone()),
                kode_pos: Set(record.kode_pos.clone()),
                id_wilayah: Set(record.id_wilayah.clone()),
                nama_wilayah: Set(record.nama_wilayah.clone()),
                lintang_bujur: Set(record.lintang_bujur.clone()),
                bank: Set(record.bank.clone()),
                unit_cabang: Set(record.unit_cabang.clone()),
                nomor_rekening: Set(record.nomor_rekening.clone()),
                mbs: Set(record.mbs.clone()),
                luas_tanah_milik: Set(record.luas_tanah_milik.clone()),
                luas_tanah_bukan_milik: Set(record.luas_tanah_bukan_milik.clone()),
                sk_pendirian: Set(record.sk_pendirian.clone()),
                tanggal_sk_pendirian: Set(Self::parse_datetime(record.tanggal_sk_pendirian.as_ref())),
                id_status_milik: Set(record.id_status_milik.clone()),
                nama_status_milik: Set(record.nama_status_milik.clone()),
                status_perguruan_tinggi: Set(record.status_perguruan_tinggi.clone()),
                sk_izin_operasional: Set(record.sk_izin_operasional.clone()),
                tanggal_izin_operasional: Set(Self::parse_date(record.tanggal_izin_operasional.as_ref())),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                created_by: Set(None),
                updated_by: Set(None),
                deleted_at: Set(None),
                nama_singkat: Set(None),
            };

            new_record.insert(txn).await?;
            "INSERTED"
        };

        Ok(action.to_string())
    }

}
