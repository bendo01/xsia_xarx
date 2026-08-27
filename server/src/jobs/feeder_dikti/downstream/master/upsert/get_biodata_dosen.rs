use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::biodata_dosen as biodata_dosen;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32, de_opt_iso_tanggal};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_dosen: Option<String>,
    pub nama_dosen: Option<String>,
    pub tempat_lahir: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_lahir: Option<chrono::NaiveDate>,
    pub jenis_kelamin: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_agama: Option<i32>,
    pub nama_agama: Option<String>,
    pub id_status_aktif: Option<String>,
    pub nama_status_aktif: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_ibu_kandung: Option<String>,
    pub nik: Option<String>,
    pub nip: Option<String>,
    pub npwp: Option<String>,
    pub id_jenis_sdm: Option<String>,
    pub nama_jenis_sdm: Option<String>,
    pub no_sk_cpns: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tanggal_sk_cpns: Option<chrono::NaiveDate>,
    pub no_sk_pengangkatan: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub mulai_sk_pengangkatan: Option<chrono::NaiveDate>,
    pub id_lembaga_pengangkatan: Option<String>,
    pub nama_lembaga_pengangkatan: Option<String>,
    pub id_pangkat_golongan: Option<String>,
    pub nama_pangkat_golongan: Option<String>,
    pub id_sumber_gaji: Option<String>,
    pub nama_sumber_gaji: Option<String>,
    pub jalan: Option<String>,
    pub dusun: Option<String>,
    pub rt: Option<String>,
    pub rw: Option<String>,
    pub ds_kel: Option<String>,
    pub kode_pos: Option<String>,
    pub id_wilayah: Option<String>,
    pub nama_wilayah: Option<String>,
    pub telepon: Option<String>,
    pub handphone: Option<String>,
    pub email: Option<String>,
    pub status_pernikahan: Option<String>,
    pub nama_suami_istri: Option<String>,
    pub nip_suami_istri: Option<String>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tanggal_mulai_pns: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_pekerjaan_suami_istri: Option<i32>,
    pub nama_pekerjaan_suami_istri: Option<String>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_biodata_dosen")
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


    /// Upsert a single biodata dosen record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_dosen` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that id_dosen exists (it's the unique key)
        let id_dosen_str = record
            .id_dosen
            .clone()
            .ok_or("Missing id_dosen")?;

        let id_dosen = uuid::Uuid::parse_str(&id_dosen_str)
            .map_err(|e| format!("Invalid UUID for id_dosen: {}", e))?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = biodata_dosen::Entity::find()
            .filter(biodata_dosen::Column::DeletedAt.is_null())
            .filter(biodata_dosen::Column::IdDosen.eq(id_dosen.to_string()))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: biodata_dosen::ActiveModel = existing_record.into_active_model();

            active.nama_dosen = Set(record.nama_dosen.clone());
            active.tempat_lahir = Set(record.tempat_lahir.clone());
            active.tanggal_lahir = Set(record.tanggal_lahir);
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.id_agama = Set(record.id_agama.map(|v| v.to_string()));
            active.nama_agama = Set(record.nama_agama.clone());
            active.id_status_aktif = Set(record.id_status_aktif.clone());
            active.nama_status_aktif = Set(record.nama_status_aktif.clone());
            active.nidn = Set(record.nidn.clone());
            active.nama_ibu_kandung = Set(record.nama_ibu_kandung.clone());
            active.nik = Set(record.nik.clone());
            active.nip = Set(record.nip.clone());
            active.npwp = Set(record.npwp.clone());
            active.id_jenis_sdm = Set(record.id_jenis_sdm.clone());
            active.nama_jenis_sdm = Set(record.nama_jenis_sdm.clone());
            active.no_sk_cpns = Set(record.no_sk_cpns.clone());
            active.tanggal_sk_cpns = Set(record.tanggal_sk_cpns);
            active.no_sk_pengangkatan = Set(record.no_sk_pengangkatan.clone());
            active.mulai_sk_pengangkatan = Set(record.mulai_sk_pengangkatan.map(|d| d.to_string()));
            active.id_lembaga_pengangkatan = Set(record.id_lembaga_pengangkatan.clone());
            active.nama_lembaga_pengangkatan = Set(record.nama_lembaga_pengangkatan.clone());
            active.id_pangkat_golongan = Set(record.id_pangkat_golongan.clone());
            active.nama_pangkat_golongan = Set(record.nama_pangkat_golongan.clone());
            active.id_sumber_gaji = Set(record.id_sumber_gaji.clone());
            active.nama_sumber_gaji = Set(record.nama_sumber_gaji.clone());
            active.jalan = Set(record.jalan.clone());
            active.dusun = Set(record.dusun.clone());
            active.rt = Set(record.rt.clone());
            active.rw = Set(record.rw.clone());
            active.ds_kel = Set(record.ds_kel.clone());
            active.kode_pos = Set(record.kode_pos.clone());
            active.id_wilayah = Set(record.id_wilayah.clone());
            active.nama_wilayah = Set(record.nama_wilayah.clone());
            active.telepon = Set(record.telepon.clone());
            active.handphone = Set(record.handphone.clone());
            active.email = Set(record.email.clone());
            active.status_pernikahan = Set(record.status_pernikahan.clone());
            active.nama_suami_istri = Set(record.nama_suami_istri.clone());
            active.nip_suami_istri = Set(record.nip_suami_istri.clone());
            active.tanggal_mulai_pns = Set(record.tanggal_mulai_pns);
            active.id_pekerjaan_suami_istri = Set(record.id_pekerjaan_suami_istri);
            active.nama_pekerjaan_suami_istri = Set(record.nama_pekerjaan_suami_istri.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = biodata_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen.to_string())),
                nama_dosen: Set(record.nama_dosen.clone()),
                tempat_lahir: Set(record.tempat_lahir.clone()),
                tanggal_lahir: Set(record.tanggal_lahir),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                id_agama: Set(record.id_agama.map(|v| v.to_string())),
                nama_agama: Set(record.nama_agama.clone()),
                id_status_aktif: Set(record.id_status_aktif.clone()),
                nama_status_aktif: Set(record.nama_status_aktif.clone()),
                nidn: Set(record.nidn.clone()),
                nama_ibu_kandung: Set(record.nama_ibu_kandung.clone()),
                nik: Set(record.nik.clone()),
                nip: Set(record.nip.clone()),
                npwp: Set(record.npwp.clone()),
                id_jenis_sdm: Set(record.id_jenis_sdm.clone()),
                nama_jenis_sdm: Set(record.nama_jenis_sdm.clone()),
                no_sk_cpns: Set(record.no_sk_cpns.clone()),
                tanggal_sk_cpns: Set(record.tanggal_sk_cpns),
                no_sk_pengangkatan: Set(record.no_sk_pengangkatan.clone()),
                mulai_sk_pengangkatan: Set(record.mulai_sk_pengangkatan.map(|d| d.to_string())),
                id_lembaga_pengangkatan: Set(record.id_lembaga_pengangkatan.clone()),
                nama_lembaga_pengangkatan: Set(record.nama_lembaga_pengangkatan.clone()),
                id_pangkat_golongan: Set(record.id_pangkat_golongan.clone()),
                nama_pangkat_golongan: Set(record.nama_pangkat_golongan.clone()),
                id_sumber_gaji: Set(record.id_sumber_gaji.clone()),
                nama_sumber_gaji: Set(record.nama_sumber_gaji.clone()),
                jalan: Set(record.jalan.clone()),
                dusun: Set(record.dusun.clone()),
                rt: Set(record.rt.clone()),
                rw: Set(record.rw.clone()),
                ds_kel: Set(record.ds_kel.clone()),
                kode_pos: Set(record.kode_pos.clone()),
                id_wilayah: Set(record.id_wilayah.clone()),
                nama_wilayah: Set(record.nama_wilayah.clone()),
                telepon: Set(record.telepon.clone()),
                handphone: Set(record.handphone.clone()),
                email: Set(record.email.clone()),
                status_pernikahan: Set(record.status_pernikahan.clone()),
                nama_suami_istri: Set(record.nama_suami_istri.clone()),
                nip_suami_istri: Set(record.nip_suami_istri.clone()),
                tanggal_mulai_pns: Set(record.tanggal_mulai_pns),
                id_pekerjaan_suami_istri: Set(record.id_pekerjaan_suami_istri),
                nama_pekerjaan_suami_istri: Set(record.nama_pekerjaan_suami_istri.clone()),
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
