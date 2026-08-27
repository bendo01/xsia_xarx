use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::matakuliah_kurikulum as matakuliah_kurikulum;

use crate::library::deserialization::{de_opt_boolish, de_opt_date_dmy, de_opt_f32, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tgl_create: Option<chrono::NaiveDate>,
    pub id_kurikulum: Option<Uuid>,
    pub nama_kurikulum: Option<String>,
    pub id_matkul: Option<Uuid>,
    pub kode_mata_kuliah: Option<String>,
    pub nama_mata_kuliah: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub semester: Option<i32>,
    pub id_semester: Option<String>,
    pub semester_mulai_berlaku: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_mata_kuliah: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_tatap_muka: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_praktek: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_praktek_lapangan: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_simulasi: Option<f32>,
    #[serde(deserialize_with = "de_opt_boolish")]
    pub apakah_wajib: Option<bool>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_matkul_kurikulum")
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_matkul = record
            .id_matkul
            .ok_or("id_matkul is required for upsert")?;

        let id_kurikulum = record
            .id_kurikulum
            .ok_or("id_kurikulum is required for upsert")?;

        let sync_time = Local::now().naive_local();

        let existing = matakuliah_kurikulum::Entity::find()
            .filter(matakuliah_kurikulum::Column::DeletedAt.is_null())
            .filter(matakuliah_kurikulum::Column::IdMatkul.eq(id_matkul))
            .filter(matakuliah_kurikulum::Column::IdKurikulum.eq(id_kurikulum))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: matakuliah_kurikulum::ActiveModel = existing_record.into_active_model();

            active.tgl_create = Set(record.tgl_create);
            active.nama_kurikulum = Set(record.nama_kurikulum.clone());
            active.kode_mata_kuliah = Set(record.kode_mata_kuliah.clone());
            active.nama_mata_kuliah = Set(record.nama_mata_kuliah.clone());
            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.semester = Set(record.semester);
            active.id_semester = Set(record.id_semester.clone());
            active.semester_mulai_berlaku = Set(record.semester_mulai_berlaku.clone());
            active.sks_mata_kuliah = Set(record.sks_mata_kuliah);
            active.sks_tatap_muka = Set(record.sks_tatap_muka);
            active.sks_praktek = Set(record.sks_praktek);
            active.sks_praktek_lapangan = Set(record.sks_praktek_lapangan);
            active.sks_simulasi = Set(record.sks_simulasi);
            active.apakah_wajib = Set(record.apakah_wajib);
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = matakuliah_kurikulum::ActiveModel {
                id: Set(pk_id),
                tgl_create: Set(record.tgl_create),
                id_kurikulum: Set(Some(id_kurikulum)),
                nama_kurikulum: Set(record.nama_kurikulum.clone()),
                id_matkul: Set(Some(id_matkul)),
                kode_mata_kuliah: Set(record.kode_mata_kuliah.clone()),
                nama_mata_kuliah: Set(record.nama_mata_kuliah.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                semester: Set(record.semester),
                id_semester: Set(record.id_semester.clone()),
                semester_mulai_berlaku: Set(record.semester_mulai_berlaku.clone()),
                sks_mata_kuliah: Set(record.sks_mata_kuliah),
                sks_tatap_muka: Set(record.sks_tatap_muka),
                sks_praktek: Set(record.sks_praktek),
                sks_praktek_lapangan: Set(record.sks_praktek_lapangan),
                sks_simulasi: Set(record.sks_simulasi),
                apakah_wajib: Set(record.apakah_wajib),
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


        Ok(action.to_string())
    }

}
