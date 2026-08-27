use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::referensi::jenis_satuan_manajemen_sumberdaya as jenis_satuan_manajemen_sumberdaya;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GetJenisSMSResponse {
    pub id_jenis_sms: Option<String>,
    pub nama_jenis_sms: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetJenisSMSResponse>,
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetJenisSMSResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_jenis_sms = record
            .id_jenis_sms
            .clone()
            .ok_or_else(|| "id_jenis_sms is missing".into())?;

        let sync_time = Local::now().naive_local();

        let existing = jenis_satuan_manajemen_sumberdaya::Entity::find()
            .filter(jenis_satuan_manajemen_sumberdaya::Column::DeletedAt.is_null())
            .filter(jenis_satuan_manajemen_sumberdaya::Column::IdJenisSms.eq(id_jenis_sms.clone()))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: jenis_satuan_manajemen_sumberdaya::ActiveModel =
                existing_record.into_active_model();

            // Update fields that are present in GetJenisSMSResponse
            active.nama_jenis_sms = Set(Some(record.nama_jenis_sms.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = jenis_satuan_manajemen_sumberdaya::ActiveModel {
                id: Set(pk_id),
                id_jenis_sms: Set(Some(id_jenis_sms)),
                nama_jenis_sms: Set(Some(record.nama_jenis_sms.clone())),

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
