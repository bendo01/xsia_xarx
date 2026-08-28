use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::Local;
use sea_orm::{
    ActiveModelTrait, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::nilai_transfer_pendidikan_mahasiswa as nilai_transfer_pendidikan_mahasiswa;

use crate::library::deserialization::de_opt_f32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    // UUIDs
    // Kunci & identitas
    pub id_transfer: Uuid,
    pub id_registrasi_mahasiswa: Uuid,
    pub id_matkul: Uuid,

    pub nim: String,
    pub nama_mahasiswa: String,

    pub id_prodi: Uuid,
    pub nama_program_studi: String,

    // Periode & semester
    #[serde(rename = "id_periode_masuk")]
    pub id_periode_masuk: String, // "20241" (string)
    pub id_semester: String,   // "20241" (string)
    pub nama_semester: String, // "2024/2025 Ganjil"

    // Mata kuliah asal
    pub kode_mata_kuliah_asal: String,
    pub nama_mata_kuliah_asal: String,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah_asal: Option<f32>,
    pub nilai_huruf_asal: Option<String>,

    // Matkul diakui (konversi)
    pub kode_matkul_diakui: String,
    pub nama_mata_kuliah_diakui: String,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah_diakui: Option<f32>,
    pub nilai_huruf_diakui: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_angka_diakui: Option<f32>, // "2.0000" → 2.0

    // Metadata/relasi opsional
    pub id_perguruan_tinggi: Option<Uuid>,
    pub id_aktivitas: Option<Uuid>,
    pub judul: Option<String>,
    pub id_jenis_aktivitas: Option<Uuid>,
    pub nama_jenis_aktivitas: Option<String>,

    // Status
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_nilai_transfer_pendidikan_mahasiswa")
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


    /// Upsert a single nilai_transfer_pendidikan_mahasiswa record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_transfer` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // id_transfer is the unique key for this record
        let id_transfer = record.id_transfer;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = nilai_transfer_pendidikan_mahasiswa::Entity::find()
            .filter(nilai_transfer_pendidikan_mahasiswa::Column::DeletedAt.is_null())
            .filter(nilai_transfer_pendidikan_mahasiswa::Column::IdTransfer.eq(record.id_transfer))
            .filter(
                nilai_transfer_pendidikan_mahasiswa::Column::IdRegistrasiMahasiswa
                    .eq(record.id_registrasi_mahasiswa),
            )
            .filter(nilai_transfer_pendidikan_mahasiswa::Column::IdMatkul.eq(record.id_matkul))
            .filter(nilai_transfer_pendidikan_mahasiswa::Column::IdProdi.eq(record.id_prodi))
            .filter(
                nilai_transfer_pendidikan_mahasiswa::Column::IdPeriodeMasuk
                    .eq(record.id_periode_masuk.clone()),
            )
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: nilai_transfer_pendidikan_mahasiswa::ActiveModel =
                existing_record.into_active_model();

            active.id_registrasi_mahasiswa = Set(Some(record.id_registrasi_mahasiswa));
            active.id_matkul = Set(Some(record.id_matkul));
            active.nim = Set(Some(record.nim.clone()));
            active.nama_mahasiswa = Set(Some(record.nama_mahasiswa.clone()));
            active.id_prodi = Set(Some(record.id_prodi));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.id_periode_masuk = Set(Some(record.id_periode_masuk.clone()));
            active.id_semester = Set(Some(record.id_semester.clone()));
            active.nama_semester = Set(Some(record.nama_semester.clone()));
            active.kode_mata_kuliah_asal = Set(Some(record.kode_mata_kuliah_asal.clone()));
            active.nama_mata_kuliah_asal = Set(Some(record.nama_mata_kuliah_asal.clone()));
            active.sks_mata_kuliah_asal = Set(record.sks_mata_kuliah_asal);
            active.nilai_huruf_asal = Set(record.nilai_huruf_asal.clone());
            active.kode_matkul_diakui = Set(Some(record.kode_matkul_diakui.clone()));
            active.nama_mata_kuliah_diakui = Set(Some(record.nama_mata_kuliah_diakui.clone()));
            active.sks_mata_kuliah_diakui = Set(record.sks_mata_kuliah_diakui);
            active.nilai_huruf_diakui = Set(record.nilai_huruf_diakui.clone());
            active.nilai_angka_diakui = Set(record.nilai_angka_diakui);
            active.id_perguruan_tinggi = Set(record.id_perguruan_tinggi);
            active.id_aktivitas = Set(record.id_aktivitas.map(|v| v.to_string()));
            active.judul = Set(record.judul.clone());
            active.id_jenis_aktivitas = Set(record.id_jenis_aktivitas.map(|v| v.to_string()));
            active.nama_jenis_aktivitas = Set(record.nama_jenis_aktivitas.clone());
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = nilai_transfer_pendidikan_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_transfer: Set(Some(id_transfer)),
                id_registrasi_mahasiswa: Set(Some(record.id_registrasi_mahasiswa)),
                id_matkul: Set(Some(record.id_matkul)),
                nim: Set(Some(record.nim.clone())),
                nama_mahasiswa: Set(Some(record.nama_mahasiswa.clone())),
                id_prodi: Set(Some(record.id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_periode_masuk: Set(Some(record.id_periode_masuk.clone())),
                id_semester: Set(Some(record.id_semester.clone())),
                nama_semester: Set(Some(record.nama_semester.clone())),
                kode_mata_kuliah_asal: Set(Some(record.kode_mata_kuliah_asal.clone())),
                nama_mata_kuliah_asal: Set(Some(record.nama_mata_kuliah_asal.clone())),
                sks_mata_kuliah_asal: Set(record.sks_mata_kuliah_asal),
                nilai_huruf_asal: Set(record.nilai_huruf_asal.clone()),
                kode_matkul_diakui: Set(Some(record.kode_matkul_diakui.clone())),
                nama_mata_kuliah_diakui: Set(Some(record.nama_mata_kuliah_diakui.clone())),
                sks_mata_kuliah_diakui: Set(record.sks_mata_kuliah_diakui),
                nilai_huruf_diakui: Set(record.nilai_huruf_diakui.clone()),
                nilai_angka_diakui: Set(record.nilai_angka_diakui),
                id_perguruan_tinggi: Set(record.id_perguruan_tinggi),
                id_aktivitas: Set(record.id_aktivitas.map(|v| v.to_string())),
                judul: Set(record.judul.clone()),
                id_jenis_aktivitas: Set(record.id_jenis_aktivitas.map(|v| v.to_string())),
                nama_jenis_aktivitas: Set(record.nama_jenis_aktivitas.clone()),
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
