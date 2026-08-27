use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::referensi::jenis_keluar as jenis_keluar;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GetJenisKeluarResponse {
    pub id_jenis_keluar: Option<String>,
    pub jenis_keluar: String,
    pub apa_mahasiswa: Option<String>,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetJenisKeluarResponse>,
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetJenisKeluarResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_jenis_keluar = record
            .id_jenis_keluar
            .clone()
            .ok_or_else(|| "id_jenis_keluar is missing".into())?;

        let sync_time = Local::now().naive_local();

        let existing = jenis_keluar::Entity::find()
            .filter(jenis_keluar::Column::DeletedAt.is_null())
            .filter(jenis_keluar::Column::IdJenisKeluar.eq(id_jenis_keluar.clone()))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: jenis_keluar::ActiveModel = existing_record.into_active_model();

            // Update fields that are present in GetJenisKeluarResponse
            active.jenis_keluar = Set(Some(record.jenis_keluar.clone()));
            active.apa_mahasiswa = Set(record.apa_mahasiswa.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = jenis_keluar::ActiveModel {
                id: Set(pk_id),
                id_jenis_keluar: Set(Some(id_jenis_keluar)),
                jenis_keluar: Set(Some(record.jenis_keluar.clone())),
                apa_mahasiswa: Set(record.apa_mahasiswa.clone()),

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
