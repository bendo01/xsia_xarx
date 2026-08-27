use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::penugasan_dosen as penugasan_dosen;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32, de_opt_iso_tanggal};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputDetailPenugasanDosen {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_surat_tugas: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub mulai_surat_tugas: Option<NaiveDate>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListPenugasanDosen {
    pub id_registrasi_dosen: Option<Uuid>,
    #[serde(rename = "jk")]
    pub jenis_kelamin: Option<String>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_perguruan_tinggi: Option<Uuid>,
    pub nama_perguruan_tinggi: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_surat_tugas: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub mulai_surat_tugas: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tgl_ptk_keluar: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub id_stat_pegawai: Option<i32>,
    pub id_jns_keluar: Option<String>,
    pub id_ikatan_kerja: Option<String>,
    #[serde(rename = "a_sp_homebase")]
    pub apakah_homebase: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListPenugasanSemuaDosen {
    pub id_registrasi_dosen: Option<Uuid>,
    pub id_dosen: Option<Uuid>,
    pub nama_dosen: Option<String>,
    pub nuptk: Option<String>,
    pub jenis_kelamin: Option<String>,
    pub id_tahun_ajaran: Option<String>,
    pub nama_tahun_ajaran: Option<String>,
    pub id_prodi: Option<Uuid>,
    #[serde(rename = "program_studi")]
    pub nama_program_studi: Option<String>,
    pub nomor_surat_tugas: Option<String>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_surat_tugas: Option<NaiveDate>,
    pub apakah_homebase: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputListPenugasanDosen>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_penugasan_dosen")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListPenugasanDosen) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that id_registrasi_dosen exists (it's the unique key)
        let id_registrasi_dosen = record
            .id_registrasi_dosen
            .ok_or_else(|| "Missing id_registrasi_dosen".into())?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = penugasan_dosen::Entity::find()
            .filter(penugasan_dosen::Column::DeletedAt.is_null())
            .filter(penugasan_dosen::Column::IdRegistrasiDosen.eq(id_registrasi_dosen))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: penugasan_dosen::ActiveModel = existing_record.into_active_model();

            active.id_dosen = Set(record.id_dosen);
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.jenis_kelamin = Set(record.jenis_kelamin.clone());
            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.id_tahun_ajaran = Set(record.id_tahun_ajaran.clone());
            active.nama_tahun_ajaran = Set(record.nama_tahun_ajaran.clone());
            active.id_perguruan_tinggi = Set(record.id_perguruan_tinggi);
            active.nama_perguruan_tinggi = Set(record.nama_perguruan_tinggi.clone());
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.nomor_surat_tugas = Set(record.nomor_surat_tugas.clone());
            active.tanggal_surat_tugas = Set(record
                .tanggal_surat_tugas
                .map(|d| d.format("%d-%m-%Y").to_string()));
            active.mulai_surat_tugas = Set(record
                .mulai_surat_tugas
                .map(|d| d.format("%d-%m-%Y").to_string()));
            active.tgl_create = Set(record.tgl_create.map(|d| d.format("%d-%m-%Y").to_string()));
            active.tgl_ptk_keluar = Set(record
                .tgl_ptk_keluar
                .map(|d| d.format("%d-%m-%Y").to_string()));
            active.id_stat_pegawai = Set(record.id_stat_pegawai);
            active.id_jns_keluar = Set(record
                .id_jns_keluar
                .as_ref()
                .and_then(|s| s.parse::<i32>().ok()));
            active.id_ikatan_kerja = Set(record.id_ikatan_kerja.clone());
            active.apakah_homebase =
                Set(record
                    .apakah_homebase
                    .as_ref()
                    .and_then(|s| match s.as_str() {
                        "1" => Some(true),
                        "0" => Some(false),
                        _ => None,
                    }));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = penugasan_dosen::ActiveModel {
                id: Set(pk_id),
                id_registrasi_dosen: Set(Some(id_registrasi_dosen)),
                id_dosen: Set(record.id_dosen),
                nama_dosen: Set(record.nama_dosen.clone()),
                jenis_kelamin: Set(record.jenis_kelamin.clone()),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                id_tahun_ajaran: Set(record.id_tahun_ajaran.clone()),
                nama_tahun_ajaran: Set(record.nama_tahun_ajaran.clone()),
                id_perguruan_tinggi: Set(record.id_perguruan_tinggi),
                nama_perguruan_tinggi: Set(record.nama_perguruan_tinggi.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                nomor_surat_tugas: Set(record.nomor_surat_tugas.clone()),
                tanggal_surat_tugas: Set(record
                    .tanggal_surat_tugas
                    .map(|d| d.format("%d-%m-%Y").to_string())),
                mulai_surat_tugas: Set(record
                    .mulai_surat_tugas
                    .map(|d| d.format("%d-%m-%Y").to_string())),
                tgl_create: Set(record.tgl_create.map(|d| d.format("%d-%m-%Y").to_string())),
                tgl_ptk_keluar: Set(record
                    .tgl_ptk_keluar
                    .map(|d| d.format("%d-%m-%Y").to_string())),
                id_stat_pegawai: Set(record.id_stat_pegawai),
                id_jns_keluar: Set(record
                    .id_jns_keluar
                    .as_ref()
                    .and_then(|s| s.parse::<i32>().ok())),
                id_ikatan_kerja: Set(record.id_ikatan_kerja.clone()),
                apakah_homebase: Set(record.apakah_homebase.as_ref().and_then(|s| {
                    match s.as_str() {
                        "1" => Some(true),
                        "0" => Some(false),
                        _ => None,
                    }
                })),
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
