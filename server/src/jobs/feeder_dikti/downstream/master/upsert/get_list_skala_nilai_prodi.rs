use apalis::prelude::{Data, Monitor, WorkerBuilder, WorkerFactoryFn};
use apalis_redis::RedisStorage;
use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::skala_nilai_program_studi as skala_nilai_program_studi;

use crate::library::deserialization::{de_opt_date_dmy, de_opt_f32, de_opt_iso_tanggal};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_bobot_nilai: Uuid,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub nilai_huruf: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub nilai_indeks: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32", rename = "bobot_nilai_min")]
    pub bobot_minimum: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32", rename = "bobot_nilai_maks")]
    pub bobot_maksimum: Option<f32>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_mulai_efektif: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy")]
    pub tanggal_akhir_efektif: Option<chrono::NaiveDate>,
    #[serde(deserialize_with = "de_opt_iso_tanggal")]
    pub tgl_create: Option<chrono::NaiveDate>,
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

    let worker = WorkerBuilder::new("xsia-xarx:feeder_dikti:downstream:master:upsert:get_list_skala_nilai_prodi")
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
        let id_bobot_nilai = record.id_bobot_nilai;

        let sync_time = Local::now().naive_local();

        let existing = skala_nilai_program_studi::Entity::find()
            .filter(skala_nilai_program_studi::Column::DeletedAt.is_null())
            .filter(skala_nilai_program_studi::Column::IdBobotNilai.eq(id_bobot_nilai))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: skala_nilai_program_studi::ActiveModel =
                existing_record.into_active_model();

            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.nilai_huruf = Set(record.nilai_huruf.clone());
            active.nilai_indeks = Set(record.nilai_indeks);
            active.bobot_minimum = Set(record.bobot_minimum);
            active.bobot_maksimum = Set(record.bobot_maksimum);
            active.tanggal_mulai_efektif = Set(record.tanggal_mulai_efektif);
            active.tanggal_akhir_efektif = Set(record.tanggal_akhir_efektif);
            active.tgl_create = Set(record.tgl_create);
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = skala_nilai_program_studi::ActiveModel {
                id: Set(pk_id),
                id_bobot_nilai: Set(Some(id_bobot_nilai)),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                nilai_huruf: Set(record.nilai_huruf.clone()),
                nilai_indeks: Set(record.nilai_indeks),
                bobot_minimum: Set(record.bobot_minimum),
                bobot_maksimum: Set(record.bobot_maksimum),
                tanggal_mulai_efektif: Set(record.tanggal_mulai_efektif),
                tanggal_akhir_efektif: Set(record.tanggal_akhir_efektif),
                tgl_create: Set(record.tgl_create),
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
