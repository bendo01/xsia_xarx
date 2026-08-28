use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::Local;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::transkrip_mahasiswa as transkrip_mahasiswa;

use crate::library::deserialization::de_opt_f32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_matkul: Option<Uuid>,
    pub id_kelas_kuliah: Option<Uuid>,
    pub id_nilai_transfer: Option<String>,
    pub id_konversi_aktivitas: Option<String>,
    pub smt_diambil: Option<String>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_angka: Option<f32>,
    pub nilai_huruf: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_indeks: Option<f32>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_transkrip_mahasiswa")
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


    /// Upsert a single transkrip mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same unique combination exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// The unique combination can be:
    /// 1. id_nilai_transfer (for transfer credits)
    /// 2. id_konversi_aktivitas (for converted activities)
    /// 3. id_registrasi_mahasiswa + id_matkul + smt_diambil (for regular courses)
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Start transaction
        let sync_time = Local::now().naive_local();

        // Build query to find existing record by unique combination
        let mut query = transkrip_mahasiswa::Entity::find()
            .filter(transkrip_mahasiswa::Column::DeletedAt.is_null());

        // Priority 1: Check by id_nilai_transfer (transfer credits)
        if let Some(ref id_transfer) = record.id_nilai_transfer {
            if !id_transfer.is_empty() {
                query = query
                    .filter(transkrip_mahasiswa::Column::IdNilaiTransfer.eq(id_transfer.clone()));
            }
        }
        // Priority 2: Check by id_konversi_aktivitas (converted activities)
        else if let Some(ref id_konversi) = record.id_konversi_aktivitas {
            if !id_konversi.is_empty() {
                query = query.filter(
                    transkrip_mahasiswa::Column::IdKonversiAktivitas.eq(id_konversi.clone()),
                );
            }
        }
        // Priority 3: Check by regular combination
        else {
            if let Some(id_reg) = record.id_registrasi_mahasiswa {
                query = query.filter(transkrip_mahasiswa::Column::IdRegistrasiMahasiswa.eq(id_reg));
            }

            if let Some(id_matkul) = record.id_matkul {
                query = query.filter(transkrip_mahasiswa::Column::IdMatkul.eq(id_matkul));
            }

            if let Some(ref smt) = record.smt_diambil {
                query = query.filter(transkrip_mahasiswa::Column::SmtDiambil.eq(smt.clone()));
            }

            if let Some(ref id_kelas_kuliah) = record.id_kelas_kuliah {
                query =
                    query.filter(transkrip_mahasiswa::Column::IdKelasKuliah.eq(*id_kelas_kuliah));
            }
        }

        let existing = query.one(txn).await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: transkrip_mahasiswa::ActiveModel = existing_record.into_active_model();

            active.id_registrasi_mahasiswa = Set(record.id_registrasi_mahasiswa);
            active.id_matkul = Set(record.id_matkul);
            active.id_kelas_kuliah = Set(record.id_kelas_kuliah);
            active.id_nilai_transfer = Set(record.id_nilai_transfer.clone());
            active.id_konversi_aktivitas = Set(record.id_konversi_aktivitas.clone());
            active.smt_diambil = Set(record.smt_diambil.clone());
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.nilai_angka = Set(record.nilai_angka);
            active.nilai_huruf = Set(record.nilai_huruf.clone());
            active.nilai_indeks = Set(record.nilai_indeks);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = transkrip_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(record.id_registrasi_mahasiswa),
                id_matkul: Set(record.id_matkul),
                id_kelas_kuliah: Set(record.id_kelas_kuliah),
                id_nilai_transfer: Set(record.id_nilai_transfer.clone()),
                id_konversi_aktivitas: Set(record.id_konversi_aktivitas.clone()),
                smt_diambil: Set(record.smt_diambil.clone()),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                nilai_angka: Set(record.nilai_angka),
                nilai_huruf: Set(record.nilai_huruf.clone()),
                nilai_indeks: Set(record.nilai_indeks),
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
