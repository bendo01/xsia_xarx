use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::aktifitas_mengajar_dosen as aktifitas_mengajar_dosen;

use crate::library::deserialization::de_opt_i32;
// use chrono::NaiveDate;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_registrasi_dosen: Uuid,
    pub id_dosen: Uuid,
    pub nama_dosen: String,
    pub id_periode: String,
    pub nama_periode: String,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_matkul: Uuid,
    pub nama_mata_kuliah: String,
    pub id_kelas: Uuid,
    pub nama_kelas_kuliah: String,
    #[serde(deserialize_with = "de_opt_i32")]
    pub rencana_minggu_pertemuan: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub realisasi_minggu_pertemuan: Option<i32>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_aktifitas_mengajar_dosen")
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


    /// Upsert a single aktifitas mengajar dosen record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same composite key exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that required fields exist for composite key
        let id_registrasi_dosen = record.id_registrasi_dosen;
        let id_periode = record.id_periode.clone();
        let id_prodi = record.id_prodi;
        let id_matkul = record.id_matkul;
        let id_kelas = record.id_kelas;

        // Clone values for later use in insert
        let id_periode_clone = id_periode.clone();

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists using composite key
        let existing = aktifitas_mengajar_dosen::Entity::find()
            .filter(aktifitas_mengajar_dosen::Column::DeletedAt.is_null())
            .filter(aktifitas_mengajar_dosen::Column::IdRegistrasiDosen.eq(id_registrasi_dosen))
            .filter(aktifitas_mengajar_dosen::Column::IdPeriode.eq(id_periode))
            .filter(aktifitas_mengajar_dosen::Column::IdProdi.eq(id_prodi))
            .filter(aktifitas_mengajar_dosen::Column::IdMatkul.eq(id_matkul))
            .filter(aktifitas_mengajar_dosen::Column::IdKelas.eq(id_kelas))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: aktifitas_mengajar_dosen::ActiveModel =
                existing_record.into_active_model();

            active.id_dosen = Set(Some(record.id_dosen));
            active.nama_dosen = Set(Some(record.nama_dosen.clone()));
            active.nama_periode = Set(Some(record.nama_periode.clone()));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.nama_mata_kuliah = Set(Some(record.nama_mata_kuliah.clone()));
            active.nama_kelas_kuliah = Set(Some(record.nama_kelas_kuliah.clone()));
            active.rencana_minggu_pertemuan = Set(record.rencana_minggu_pertemuan);
            active.realisasi_minggu_pertemuan = Set(record.realisasi_minggu_pertemuan);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));
            active.rencana_minggu_pertemuan = Set(record.rencana_minggu_pertemuan);
            active.realisasi_minggu_pertemuan = Set(record.realisasi_minggu_pertemuan);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = aktifitas_mengajar_dosen::ActiveModel {
                id: Set(pk_id),
                id_registrasi_dosen: Set(Some(id_registrasi_dosen)),
                id_dosen: Set(Some(record.id_dosen)),
                nama_dosen: Set(Some(record.nama_dosen.clone())),
                id_periode: Set(Some(id_periode_clone)),
                nama_periode: Set(Some(record.nama_periode.clone())),
                id_prodi: Set(Some(id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_matkul: Set(Some(id_matkul)),
                nama_mata_kuliah: Set(Some(record.nama_mata_kuliah.clone())),
                id_kelas: Set(Some(id_kelas)),
                nama_kelas_kuliah: Set(Some(record.nama_kelas_kuliah.clone())),
                rencana_minggu_pertemuan: Set(record.rencana_minggu_pertemuan),
                realisasi_minggu_pertemuan: Set(record.realisasi_minggu_pertemuan),
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
