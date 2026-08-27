use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::referensi::lembaga_pengangkat as lembaga_pengangkat;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct GetLembagaPengangkatResponse {
    pub id_lembaga_angkat: Option<String>,
    pub nama_lembaga_angkat: String,
}

#[derive(Deserialize, Debug, Serialize, Clone)]
pub struct WorkerArgs {
    pub records: Vec<GetLembagaPengangkatResponse>,
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


    pub async fn upsert_record(txn: &DatabaseTransaction, record: &GetLembagaPengangkatResponse) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_lembaga_angkat = record
            .id_lembaga_angkat
            .clone()
            .ok_or_else(|| "id_lembaga_angkat is missing".into())?;

        let sync_time = Local::now().naive_local();

        let existing = lembaga_pengangkat::Entity::find()
            .filter(lembaga_pengangkat::Column::DeletedAt.is_null())
            .filter(lembaga_pengangkat::Column::IdLembagaAngkat.eq(id_lembaga_angkat.clone()))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: lembaga_pengangkat::ActiveModel = existing_record.into_active_model();

            // Update fields that are present in GetLembagaPengangkatResponse
            active.nama_lembaga_angkat = Set(Some(record.nama_lembaga_angkat.clone()));
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = lembaga_pengangkat::ActiveModel {
                id: Set(pk_id),
                id_lembaga_angkat: Set(Some(id_lembaga_angkat)),
                nama_lembaga_angkat: Set(Some(record.nama_lembaga_angkat.clone())),

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
