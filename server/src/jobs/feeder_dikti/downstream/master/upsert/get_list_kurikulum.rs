use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::master::kurikulum as kurikulum;

use crate::library::deserialization::de_opt_f32;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputDetailKurikulum {
    pub id_kurikulum: Uuid,
    pub nama_kurikulum: String,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_semester: String,
    pub semester_mulai_berlaku: String,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_lulus: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_wajib: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_pilihan: Option<f32>,
    pub status_sync: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelInputListKurikulum {
    #[serde(deserialize_with = "de_opt_f32")]
    pub id_jenj_didik: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jml_sem_normal: Option<f32>,
    pub id_kurikulum: Uuid,
    pub nama_kurikulum: String,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_semester: String,
    pub semester_mulai_berlaku: String,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_lulus: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_wajib: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_pilihan: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_mata_kuliah_wajib: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub jumlah_sks_mata_kuliah_pilihan: Option<f32>,
    pub status_sync: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<ModelInputListKurikulum>,
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


    /// Upsert a single kurikulum record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_kurikulum` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    pub async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputListKurikulum) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // id_kurikulum is required (not Option in ModelInputListKurikulum)
        let id_kurikulum = record.id_kurikulum;

        // nama_kurikulum is required (not Option in ModelInputListKurikulum)
        let nama_kurikulum = &record.nama_kurikulum;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = kurikulum::Entity::find()
            .filter(kurikulum::Column::DeletedAt.is_null())
            .filter(kurikulum::Column::IdKurikulum.eq(id_kurikulum))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: kurikulum::ActiveModel = existing_record.into_active_model();

            active.nama_kurikulum = Set(Some(nama_kurikulum.clone()));
            active.id_prodi = Set(Some(record.id_prodi));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.id_jenj_didik = Set(record.id_jenj_didik.map(|v| v as i32));
            active.jml_sem_normal = Set(record.jml_sem_normal.map(|v| v as i32));
            active.id_semester = Set(Some(record.id_semester.clone()));
            active.semester_mulai_berlaku = Set(Some(record.semester_mulai_berlaku.clone()));
            active.jumlah_sks_lulus = Set(record.jumlah_sks_lulus);
            active.jumlah_sks_wajib = Set(record.jumlah_sks_wajib);
            active.jumlah_sks_pilihan = Set(record.jumlah_sks_pilihan);
            active.jumlah_sks_mata_kuliah_wajib = Set(record.jumlah_sks_mata_kuliah_wajib);
            active.jumlah_sks_mata_kuliah_pilihan = Set(record.jumlah_sks_mata_kuliah_pilihan);
            active.status_sync = Set(Some(record.status_sync.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = kurikulum::ActiveModel {
                id: Set(pk_id),
                id_kurikulum: Set(Some(id_kurikulum)),
                nama_kurikulum: Set(Some(nama_kurikulum.clone())),
                id_prodi: Set(Some(record.id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_jenj_didik: Set(record.id_jenj_didik.map(|v| v as i32)),
                jml_sem_normal: Set(record.jml_sem_normal.map(|v| v as i32)),
                id_semester: Set(Some(record.id_semester.clone())),
                semester_mulai_berlaku: Set(Some(record.semester_mulai_berlaku.clone())),
                jumlah_sks_lulus: Set(record.jumlah_sks_lulus),
                jumlah_sks_wajib: Set(record.jumlah_sks_wajib),
                jumlah_sks_pilihan: Set(record.jumlah_sks_pilihan),
                jumlah_sks_mata_kuliah_wajib: Set(record.jumlah_sks_mata_kuliah_wajib),
                jumlah_sks_mata_kuliah_pilihan: Set(record.jumlah_sks_mata_kuliah_pilihan),
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
