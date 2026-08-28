use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::dosen_pengajar_kelas_kuliah as dosen_pengajar_kelas_kuliah;

use crate::library::deserialization::{de_opt_f32, de_opt_i32, de_opt_string_or_int};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_aktivitas_mengajar: Option<Uuid>,
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,
    pub id_substansi: Option<Uuid>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_substansi_total: Option<f32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub rencana_minggu_pertemuan: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub realisasi_minggu_pertemuan: Option<i32>,
    #[serde(deserialize_with = "de_opt_string_or_int")]
    pub id_jenis_evaluasi: Option<String>,
    pub nama_jenis_evaluasi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub id_semester: Option<String>,
    pub perhitungan_sks: Option<String>,
    pub sync_at: Option<DateTime<Utc>>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_dosen_pengajar_kelas_kuliah")
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


    /// Upsert a single dosen pengajar kelas kuliah record into the database.
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
        let id_aktivitas_mengajar = record.id_aktivitas_mengajar;
        let id_registrasi_dosen = record.id_registrasi_dosen;
        let id_kelas_kuliah = record.id_kelas_kuliah;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists using composite key
        let existing = dosen_pengajar_kelas_kuliah::Entity::find()
            .filter(dosen_pengajar_kelas_kuliah::Column::DeletedAt.is_null())
            .filter(
                dosen_pengajar_kelas_kuliah::Column::IdAktivitasMengajar.eq(id_aktivitas_mengajar),
            )
            .filter(dosen_pengajar_kelas_kuliah::Column::IdRegistrasiDosen.eq(id_registrasi_dosen))
            .filter(dosen_pengajar_kelas_kuliah::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: dosen_pengajar_kelas_kuliah::ActiveModel =
                existing_record.into_active_model();

            active.id_dosen = Set(record.id_dosen);
            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.nama_kelas_kuliah = Set(record.nama_kelas_kuliah.clone());
            active.id_substansi = Set(record.id_substansi);
            active.sks_substansi_total = Set(record.sks_substansi_total);
            active.rencana_minggu_pertemuan = Set(record.rencana_minggu_pertemuan);
            active.realisasi_minggu_pertemuan = Set(record.realisasi_minggu_pertemuan);
            active.id_jenis_evaluasi = Set(record.id_jenis_evaluasi.clone());
            active.nama_jenis_evaluasi = Set(record.nama_jenis_evaluasi.clone());
            active.id_prodi = Set(record.id_prodi);
            active.id_semester = Set(record.id_semester.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = dosen_pengajar_kelas_kuliah::ActiveModel {
                id: Set(pk_id),
                id_aktivitas_mengajar: Set(id_aktivitas_mengajar),
                id_registrasi_dosen: Set(id_registrasi_dosen),
                id_dosen: Set(record.id_dosen),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                id_kelas_kuliah: Set(id_kelas_kuliah),
                nama_kelas_kuliah: Set(record.nama_kelas_kuliah.clone()),
                id_substansi: Set(record.id_substansi),
                sks_substansi_total: Set(record.sks_substansi_total),
                rencana_minggu_pertemuan: Set(record.rencana_minggu_pertemuan),
                realisasi_minggu_pertemuan: Set(record.realisasi_minggu_pertemuan),
                id_jenis_evaluasi: Set(record.id_jenis_evaluasi.clone()),
                nama_jenis_evaluasi: Set(record.nama_jenis_evaluasi.clone()),
                id_prodi: Set(record.id_prodi),
                id_semester: Set(record.id_semester.clone()),
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
