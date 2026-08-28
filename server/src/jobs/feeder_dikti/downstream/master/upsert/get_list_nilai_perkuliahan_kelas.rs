use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{Local, NaiveDate as Date};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::nilai_perkuliahan_kelas as nilai_perkuliahan_kelas;

use crate::library::deserialization::{de_date_dmy, de_opt_date_dmy, de_opt_f32, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_matkul: Uuid,
    pub kode_mata_kuliah: String,
    pub nama_mata_kuliah: String,
    pub id_kelas_kuliah: Uuid,
    pub nama_kelas_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mahasiswa_krs: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mahasiswa_dapat_nilai: Option<i32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_tm: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_prak: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_prak_lap: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_sim: Option<f32>,
    pub bahasan_case: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub a_selenggara_pditt: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub a_pengguna_pditt: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub kuota_pditt: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_mulai_koas: Option<Date>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_selesai_koas: Option<Date>,
    pub id_mou: Option<Uuid>,
    pub id_kls_pditt: Option<Uuid>,
    pub id_sms: Uuid,
    pub id_smt: String,
    #[serde(deserialize_with = "de_date_dmy")]
    pub tgl_create: Date,
    #[serde(deserialize_with = "de_opt_i32")]
    pub lingkup_kelas: Option<i32>,
    pub mode_kuliah: Option<String>,
    pub nm_smt: String,
    pub nama_prodi: String,
    pub status_sync: String,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_nilai_perkuliahan_kelas")
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


    /// Upsert a single nilai_perkuliahan_kelas record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_kelas_kuliah` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // id_kelas_kuliah is required (not Option in ModelInput)
        let id_kelas_kuliah = record.id_kelas_kuliah;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = nilai_perkuliahan_kelas::Entity::find()
            .filter(nilai_perkuliahan_kelas::Column::DeletedAt.is_null())
            .filter(nilai_perkuliahan_kelas::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: nilai_perkuliahan_kelas::ActiveModel =
                existing_record.into_active_model();

            active.id_matkul = Set(Some(record.id_matkul));
            active.kode_mata_kuliah = Set(Some(record.kode_mata_kuliah.clone()));
            active.nama_mata_kuliah = Set(Some(record.nama_mata_kuliah.clone()));
            active.nama_kelas_kuliah = Set(record.nama_kelas_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.jumlah_mahasiswa_krs = Set(record.jumlah_mahasiswa_krs);
            active.jumlah_mahasiswa_dapat_nilai = Set(record.jumlah_mahasiswa_dapat_nilai);
            active.sks_tm = Set(record.sks_tm);
            active.sks_prak = Set(record.sks_prak);
            active.sks_prak_lap = Set(record.sks_prak_lap);
            active.sks_sim = Set(record.sks_sim);
            active.bahasan_case = Set(record.bahasan_case.clone());
            active.a_selenggara_pditt = Set(record.a_selenggara_pditt);
            active.a_pengguna_pditt = Set(record.a_pengguna_pditt);
            active.kuota_pditt = Set(record.kuota_pditt);
            active.tgl_mulai_koas = Set(record.tgl_mulai_koas);
            active.tgl_selesai_koas = Set(record.tgl_selesai_koas);
            active.id_mou = Set(record.id_mou);
            active.id_kls_pditt = Set(record.id_kls_pditt);
            active.id_sms = Set(Some(record.id_sms));
            active.id_smt = Set(Some(record.id_smt.clone()));
            active.tgl_create = Set(Some(record.tgl_create));
            active.lingkup_kelas = Set(record.lingkup_kelas);
            active.mode_kuliah = Set(record.mode_kuliah.clone());
            active.nm_smt = Set(Some(record.nm_smt.clone()));
            active.nama_prodi = Set(Some(record.nama_prodi.clone()));
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = nilai_perkuliahan_kelas::ActiveModel {
                id: Set(pk_id),
                id_kelas_kuliah: Set(Some(id_kelas_kuliah)),
                id_matkul: Set(Some(record.id_matkul)),
                kode_mata_kuliah: Set(Some(record.kode_mata_kuliah.clone())),
                nama_mata_kuliah: Set(Some(record.nama_mata_kuliah.clone())),
                nama_kelas_kuliah: Set(record.nama_kelas_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                jumlah_mahasiswa_krs: Set(record.jumlah_mahasiswa_krs),
                jumlah_mahasiswa_dapat_nilai: Set(record.jumlah_mahasiswa_dapat_nilai),
                sks_tm: Set(record.sks_tm),
                sks_prak: Set(record.sks_prak),
                sks_prak_lap: Set(record.sks_prak_lap),
                sks_sim: Set(record.sks_sim),
                bahasan_case: Set(record.bahasan_case.clone()),
                a_selenggara_pditt: Set(record.a_selenggara_pditt),
                a_pengguna_pditt: Set(record.a_pengguna_pditt),
                kuota_pditt: Set(record.kuota_pditt),
                tgl_mulai_koas: Set(record.tgl_mulai_koas),
                tgl_selesai_koas: Set(record.tgl_selesai_koas),
                id_mou: Set(record.id_mou),
                id_kls_pditt: Set(record.id_kls_pditt),
                id_sms: Set(Some(record.id_sms)),
                id_smt: Set(Some(record.id_smt.clone())),
                tgl_create: Set(Some(record.tgl_create)),
                lingkup_kelas: Set(record.lingkup_kelas),
                mode_kuliah: Set(record.mode_kuliah.clone()),
                nm_smt: Set(Some(record.nm_smt.clone())),
                nama_prodi: Set(Some(record.nama_prodi.clone())),
                status_sync: Set(Some(record.status_sync.clone())),
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
