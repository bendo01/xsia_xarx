use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::periode_perkuliahan as periode_perkuliahan;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32};

/// Model for GetListPeriodePerkuliahan API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListPeriodePerkuliahan {
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_semester: String,
    pub nama_semester: String,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub calon_ikut_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub calon_lulus_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub daftar_sbg_mhs: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub pst_undur_diri: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jml_mgu_kul: Option<i32>,
    pub metode_kul: Option<String>,
    pub metode_kul_eks: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub last_update: Option<NaiveDate>,
    pub status_sync: String,
}

/// Model for GetDetailPeriodePerkuliahan API response
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputDetailPeriodePerkuliahan {
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_semester: String,
    pub nama_semester: String,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_target_mahasiswa_baru: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_pendaftar_ikut_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_pendaftar_lulus_seleksi: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_daftar_ulang: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_mengundurkan_diri: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_awal_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_akhir_perkuliahan: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub jumlah_minggu_pertemuan: Option<i32>,
    pub status_sync: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputDetailPeriodePerkuliahan>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_detail_periode_perkuliahan")
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


    /// Upsert a single periode perkuliahan record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_prodi` and `id_semester` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputDetailPeriodePerkuliahan) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists by unique constraint (id_prodi + id_semester)
        let existing = periode_perkuliahan::Entity::find()
            .filter(periode_perkuliahan::Column::DeletedAt.is_null())
            .filter(periode_perkuliahan::Column::IdProdi.eq(record.id_prodi))
            .filter(periode_perkuliahan::Column::IdSemester.eq(&record.id_semester))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: periode_perkuliahan::ActiveModel = existing_record.into_active_model();

            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.nama_semester = Set(Some(record.nama_semester.clone()));
            active.jumlah_target_mahasiswa_baru = Set(record.jumlah_target_mahasiswa_baru);
            active.jumlah_pendaftar_ikut_seleksi = Set(record.jumlah_pendaftar_ikut_seleksi);
            active.jumlah_pendaftar_lulus_seleksi = Set(record.jumlah_pendaftar_lulus_seleksi);
            active.jumlah_daftar_ulang = Set(record.jumlah_daftar_ulang);
            active.jumlah_mengundurkan_diri = Set(record.jumlah_mengundurkan_diri);
            active.tanggal_awal_perkuliahan = Set(record.tanggal_awal_perkuliahan);
            active.tanggal_akhir_perkuliahan = Set(record.tanggal_akhir_perkuliahan);
            active.jumlah_minggu_pertemuan = Set(record.jumlah_minggu_pertemuan);
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;

            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = periode_perkuliahan::ActiveModel {
                id: Set(pk_id),
                id_prodi: Set(Some(record.id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_semester: Set(Some(record.id_semester.clone())),
                nama_semester: Set(Some(record.nama_semester.clone())),
                jumlah_target_mahasiswa_baru: Set(record.jumlah_target_mahasiswa_baru),
                jumlah_pendaftar_ikut_seleksi: Set(record.jumlah_pendaftar_ikut_seleksi),
                jumlah_pendaftar_lulus_seleksi: Set(record.jumlah_pendaftar_lulus_seleksi),
                jumlah_daftar_ulang: Set(record.jumlah_daftar_ulang),
                jumlah_mengundurkan_diri: Set(record.jumlah_mengundurkan_diri),
                tanggal_awal_perkuliahan: Set(record.tanggal_awal_perkuliahan),
                tanggal_akhir_perkuliahan: Set(record.tanggal_akhir_perkuliahan),
                jumlah_minggu_pertemuan: Set(record.jumlah_minggu_pertemuan),
                status_sync: Set(Some(record.status_sync.clone())),
                sync_at: Set(Some(sync_time)),
                created_at: Set(Some(sync_time)),
                updated_at: Set(Some(sync_time)),
                ..Default::default()
            };

            new_record.insert(txn).await?;

            "INSERTED"
        };

        // Commit transaction

        Ok(action.to_string())
    }

}
