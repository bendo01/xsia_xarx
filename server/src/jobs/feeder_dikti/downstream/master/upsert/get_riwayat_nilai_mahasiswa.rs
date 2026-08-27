use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::riwayat_nilai_mahasiswa as riwayat_nilai_mahasiswa;

use crate::library::deserialization::de_opt_f32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    // UUIDs
    pub id: Option<Uuid>,
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,

    // period
    pub id_periode: Option<String>,

    // mata kuliah / kelas
    pub id_matkul: Option<Uuid>,
    pub nama_mata_kuliah: Option<String>,
    pub id_kelas: Option<Uuid>,
    pub nama_kelas_kuliah: Option<String>,

    // Numeric fields (may come as strings) — deserialize helpers convert to Option<f32>
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,

    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_angka: Option<f32>,

    pub nilai_huruf: Option<String>,

    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_indeks: Option<f32>,

    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub angkatan: Option<String>,
    pub status_sync: Option<String>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_riwayat_nilai_mahasiswa")
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


    /// Upsert a single riwayat nilai mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same unique combination exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// The unique combination is: id_registrasi_mahasiswa + id_kelas + id_matkul
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
        let mut query = riwayat_nilai_mahasiswa::Entity::find()
            .filter(riwayat_nilai_mahasiswa::Column::DeletedAt.is_null());

        // Filter by id_registrasi_mahasiswa if present
        if let Some(id_reg) = record.id_registrasi_mahasiswa {
            query = query.filter(riwayat_nilai_mahasiswa::Column::IdRegistrasiMahasiswa.eq(id_reg));
        }

        // Filter by id_kelas if present
        if let Some(id_kelas) = record.id_kelas {
            query = query.filter(riwayat_nilai_mahasiswa::Column::IdKelas.eq(id_kelas));
        }

        // Filter by id_matkul if present
        if let Some(id_matkul) = record.id_matkul {
            query = query.filter(riwayat_nilai_mahasiswa::Column::IdMatkul.eq(id_matkul));
        }

        // Filter by id_matkul if present
        if let Some(id_prodi) = record.id_prodi {
            query = query.filter(riwayat_nilai_mahasiswa::Column::IdProdi.eq(id_prodi));
        }

        // Filter by id_matkul if present
        if let Some(id_periode) = record.id_periode.clone() {
            query = query.filter(riwayat_nilai_mahasiswa::Column::IdPeriode.eq(id_periode));
        }

        let existing = query.one(txn).await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: riwayat_nilai_mahasiswa::ActiveModel =
                existing_record.into_active_model();

            active.id_registrasi_mahasiswa = Set(record.id_registrasi_mahasiswa);
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.id_periode = Set(record.id_periode.clone());
            active.id_matkul = Set(record.id_matkul);
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.id_kelas = Set(record.id_kelas);
            active.nama_kelas_kuliah = Set(record.nama_kelas_kuliah.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.nilai_angka = Set(record.nilai_angka);
            active.nilai_huruf = Set(record.nilai_huruf.clone());
            active.nilai_indeks = Set(record.nilai_indeks);
            active.nim = Set(record.nim.clone());
            active.nama_mahasiswa = Set(record.nama_mahasiswa.clone());
            active.angkatan = Set(record.angkatan.clone());
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_nilai_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(record.id_registrasi_mahasiswa),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                id_periode: Set(record.id_periode.clone()),
                id_matkul: Set(record.id_matkul),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                id_kelas: Set(record.id_kelas),
                nama_kelas_kuliah: Set(record.nama_kelas_kuliah.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                nilai_angka: Set(record.nilai_angka),
                nilai_huruf: Set(record.nilai_huruf.clone()),
                nilai_indeks: Set(record.nilai_indeks),
                nim: Set(record.nim.clone()),
                nama_mahasiswa: Set(record.nama_mahasiswa.clone()),
                angkatan: Set(record.angkatan.clone()),
                status_sync: Set(record.status_sync.clone()),
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
