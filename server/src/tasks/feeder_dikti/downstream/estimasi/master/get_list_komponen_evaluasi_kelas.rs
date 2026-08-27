use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::komponen_evaluasi_kelas as komponen_evaluasi_kelas;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateListKomponenEvaluasiKelas";
const API_ACTION: &str = "GetListKomponenEvaluasiKelas";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "nomor_urut ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::{de_opt_date_dmy, de_opt_i32};

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_komponen_evaluasi: Option<Uuid>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub id_kelas_kuliah: Option<Uuid>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        deserialize_with = "de_opt_i32"
    )]
    pub id_jenis_evaluasi: Option<i32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nama: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub nama_inggris: Option<String>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        deserialize_with = "de_opt_i32"
    )]
    pub nomor_urut: Option<i32>,
    #[serde(
        skip_serializing_if = "Option::is_none",
        deserialize_with = "de_opt_i32"
    )]
    pub bobot_evaluasi: Option<i32>,
    #[serde(deserialize_with = "de_opt_date_dmy", default)]
    pub last_update: Option<NaiveDate>,
    #[serde(deserialize_with = "de_opt_date_dmy", default)]
    pub tgl_create: Option<NaiveDate>,
}

pub struct EstimateListKomponenEvaluasiKelas;

impl EstimateListKomponenEvaluasiKelas {
    fn get_institution_id() -> Result<Uuid, Box<dyn std::error::Error + Send + Sync>> {
        if let Ok(id_str) = std::env::var("CURRENT_INSTITUTION_ID") {
            if let Ok(id) = Uuid::parse_str(&id_str) {
                return Ok(id);
            }
        }
        Err("CURRENT_INSTITUTION_ID is not set or invalid".into())
    }

    async fn find_progress_record(
        db: &DatabaseConnection,
        institution_id: Uuid,
    ) -> Result<Option<FeederAkumulasiEstimasi::Model>, Box<dyn std::error::Error + Send + Sync>> {
        FeederAkumulasiEstimasi::Entity::find()
            .filter(FeederAkumulasiEstimasi::Column::DeletedAt.is_null())
            .filter(FeederAkumulasiEstimasi::Column::InstitutionId.eq(institution_id))
            .filter(FeederAkumulasiEstimasi::Column::Name.eq(TASK_NAME))
            .one(db)
            .await
            .map_err(|e| e.into())
    }

    async fn initialize_progress_record(
        db: &DatabaseConnection,
        institution_id: Uuid,
        existing_record: Option<FeederAkumulasiEstimasi::Model>,
    ) -> Result<i32, Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;

        let limit = match existing_record {
            Some(record) => {
                let limit = record.total_data_per_request.unwrap_or(DEFAULT_LIMIT);
                let mut active: FeederAkumulasiEstimasi::ActiveModel = record.into_active_model();
                active.last_offset = Set(Some(0));
                active.total_data = Set(Some(0));
                active.updated_at = Set(Some(Local::now().naive_local()));

                active.update(&txn).await?;
                println!("Reset existing {} progress record", TASK_NAME);
                limit
            }
            None => {
                let pk_id = Uuid::new_v4();
                let now = Local::now().naive_local();

                let new_record = FeederAkumulasiEstimasi::ActiveModel {
                    id: Set(pk_id),
                    institution_id: Set(institution_id),
                    name: Set(TASK_NAME.to_string()),
                    total_data_per_request: Set(Some(DEFAULT_LIMIT)),
                    last_offset: Set(Some(0)),
                    total_data: Set(Some(0)),
                    created_at: Set(Some(now)),
                    updated_at: Set(Some(now)),
                    deleted_at: Set(None),
                    sync_at: Set(Some(now)),
                    created_by: Set(None),
                    updated_by: Set(None),
                };

                new_record.insert(&txn).await?;
                println!(
                    "Created new {} progress record for institution {}",
                    TASK_NAME, institution_id
                );
                DEFAULT_LIMIT
            }
        };

        txn.commit().await?;
        Ok(limit)
    }

    async fn update_progress(
        db: &DatabaseConnection,
        institution_id: Uuid,
        offset: i32,
        limit: i32,
        processed_count: i32,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;

        let record = FeederAkumulasiEstimasi::Entity::find()
            .filter(FeederAkumulasiEstimasi::Column::DeletedAt.is_null())
            .filter(FeederAkumulasiEstimasi::Column::InstitutionId.eq(institution_id))
            .filter(FeederAkumulasiEstimasi::Column::Name.eq(TASK_NAME))
            .one(&txn)
            .await?;

        if let Some(record) = record {
            let mut active: FeederAkumulasiEstimasi::ActiveModel = record.into_active_model();
            let current_total = active.total_data.as_ref().copied().unwrap_or(0);
            active.total_data = Set(Some(current_total + processed_count));
            active.last_offset = Set(Some(offset + limit));
            active.updated_at = Set(Some(Local::now().naive_local()));

            active.update(&txn).await?;
        }

        txn.commit().await?;
        Ok(())
    }


    /// Upsert a single komponen evaluasi kelas record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same `id_komponen_evaluasi` exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate required fields
        let id_komponen_evaluasi = record
            .id_komponen_evaluasi
            .ok_or_else(|| "Missing id_komponen_evaluasi".into())?;

        let id_kelas_kuliah = record
            .id_kelas_kuliah
            .ok_or_else(|| "Missing id_kelas_kuliah".into())?;

        let id_jenis_evaluasi = record
            .id_jenis_evaluasi
            .ok_or_else(|| "Missing id_jenis_evaluasi".into())?;

        let nomor_urut = record
            .nomor_urut
            .ok_or_else(|| "Missing nomor_urut".into())?;

        let bobot_evaluasi = record
            .bobot_evaluasi
            .ok_or_else(|| "Missing bobot_evaluasi".into())?;

        let last_update = record
            .last_update
            .ok_or_else(|| "Missing last_update".into())?;

        let tgl_create = record
            .tgl_create
            .ok_or_else(|| "Missing tgl_create".into())?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists
        let existing = komponen_evaluasi_kelas::Entity::find()
            .filter(komponen_evaluasi_kelas::Column::DeletedAt.is_null())
            .filter(komponen_evaluasi_kelas::Column::IdKomponenEvaluasi.eq(id_komponen_evaluasi))
            .filter(komponen_evaluasi_kelas::Column::IdKelasKuliah.eq(id_kelas_kuliah))
            .filter(komponen_evaluasi_kelas::Column::IdJenisEvaluasi.eq(id_jenis_evaluasi))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: komponen_evaluasi_kelas::ActiveModel =
                existing_record.into_active_model();

            active.id_kelas_kuliah = Set(id_kelas_kuliah);
            active.id_jenis_evaluasi = Set(id_jenis_evaluasi);
            active.nama = Set(record.nama.clone());
            active.nama_inggris = Set(record.nama_inggris.clone());
            active.nomor_urut = Set(nomor_urut);
            active.bobot_evaluasi = Set(bobot_evaluasi.to_string());
            active.last_update = Set(last_update);
            active.tgl_create = Set(tgl_create);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = komponen_evaluasi_kelas::ActiveModel {
                id: Set(pk_id),
                id_komponen_evaluasi: Set(id_komponen_evaluasi),
                id_kelas_kuliah: Set(id_kelas_kuliah),
                id_jenis_evaluasi: Set(id_jenis_evaluasi),
                nama: Set(record.nama.clone()),
                nama_inggris: Set(record.nama_inggris.clone()),
                nomor_urut: Set(nomor_urut),
                bobot_evaluasi: Set(bobot_evaluasi.to_string()),
                last_update: Set(last_update),
                tgl_create: Set(tgl_create),
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


    async fn process_batch(
        db: &DatabaseConnection,
        records: &[ModelInput],
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let txn = db.begin().await?;
        let mut success_count = 0;
        let mut error_count = 0;

        for (index, record) in records.iter().enumerate() {
            match Self::upsert_record(&txn, record).await {
                Ok(_action) => {
                    success_count += 1;
                }
                Err(e) => {
                    error_count += 1;
                    eprintln!("  ❌ Record {}/{}: Failed - error: {}", index + 1, records.len(), e);
                }
            }
        }

        if error_count > 0 {
            eprintln!("⚠️ Batch completed with {} successes and {} errors", success_count, error_count);
        }

        txn.commit().await?;
        Ok(())
    }

    async fn fetch_and_process_page(
        db: &DatabaseConnection,
        _institution_id: Uuid,
        limit: i32,
        offset: i32,
    ) -> Result<usize, Box<dyn std::error::Error + Send + Sync>> {
        println!("🔄 Fetching data for offset={}, limit={}", offset, limit);

        let response = RequestData::get::<ModelInput>(
            InputRequestData {
                act: API_ACTION.to_string(),
                filter: if DEFAULT_FILTER.is_empty() { None } else { Some(DEFAULT_FILTER.to_string()) },
                order: if DEFAULT_ORDER.is_empty() { None } else { Some(DEFAULT_ORDER.to_string()) },
                limit: Some(limit),
                offset: Some(offset),
            },
        )
        .await?;

        if let Some(error_desc) = &response.error_desc && !error_desc.is_empty() {
            return Err(format!(
                "API error (code: {}): {}",
                response.error_code, error_desc
            ).into());
        }

        let records = response.data.unwrap_or_default();
        let count = records.len();

        if count == 0 {
            println!("📭 No records found at offset={}", offset);
            return Ok(0);
        }

        println!("📦 Fetched {} records at offset={}", count, offset);
        Self::process_batch(db, &records).await?;
        println!("✅ Processed batch for offset={}", offset);

        Ok(count)
    }

    async fn process_paginated_data(
        db: &DatabaseConnection,
        institution_id: Uuid,
        limit: i32,
    ) -> Result<(), Box<dyn std::error::Error + Send + Sync>> {
        let mut offset = 0;
        let mut total_processed = 0;
        let mut page_number = 1;

        loop {
            println!("📄 Page {}: offset={}, limit={}", page_number, offset, limit);
            let count = Self::fetch_and_process_page(db, institution_id, limit, offset).await?;

            if count == 0 {
                println!(
                    "✅ Pagination completed at offset={}, total processed: {}",
                    offset, total_processed
                );
                break;
            }

            Self::update_progress(db, institution_id, offset, limit, count as i32).await?;

            total_processed += count;
            offset += limit;
            page_number += 1;

            if (count as i32) < limit {
                println!(
                    "✅ Last page reached (fetched {} < limit {}), total: {}",
                    count, limit, total_processed
                );
                break;
            }
        }

        println!(
            "🎉 Completed processing {} records across {} pages",
            total_processed, page_number
        );
        Ok(())
    }
}

#[async_trait]
impl Task for EstimateListKomponenEvaluasiKelas {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetListKomponenEvaluasiKelas data from Feeder Dikti"
    }

    async fn run(&self, db: &DatabaseConnection, _args: &[String]) -> Result<(), Box<dyn std::error::Error>> {
        println!("Starting {} task", TASK_NAME);

        let institution_id = Self::get_institution_id()
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        let existing_record = Self::find_progress_record(db, institution_id)
            .await
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        let limit = Self::initialize_progress_record(db, institution_id, existing_record)
            .await
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        Self::process_paginated_data(db, institution_id, limit)
            .await
            .map_err(|e| Box::<dyn std::error::Error>::from(e.to_string()))?;

        println!("✅ {} task completed successfully", TASK_NAME);
        Ok(())
    }
}
