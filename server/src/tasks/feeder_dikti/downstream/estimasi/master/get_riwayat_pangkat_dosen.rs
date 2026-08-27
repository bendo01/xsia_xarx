use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::riwayat_pangkat_dosen as riwayat_pangkat_dosen;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateRiwayatPangkatDosen";
const API_ACTION: &str = "GetRiwayatPangkatDosen";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "nama_dosen ASC";
const DEFAULT_FILTER: &str = "";

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_dosen: Option<Uuid>,
    pub nidn: Option<String>,
    pub nuptk: Option<String>,
    pub nama_dosen: Option<String>,
    pub id_pangkat_golongan: Option<Uuid>,
    pub nama_pangkat_golongan: Option<String>,
    pub sk_pangkat: Option<String>,
    pub tanggal_sk_pangkat: Option<String>,
    pub mulai_sk_pangkat: Option<String>,
    pub masa_kerja_dalam_tahun: Option<String>,
    pub masa_kerja_dalam_bulan: Option<String>,
}

pub struct EstimateRiwayatPangkatDosen;

impl EstimateRiwayatPangkatDosen {
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
            let current_total = record.total_data.unwrap_or(0);
            let mut active: FeederAkumulasiEstimasi::ActiveModel = record.into_active_model();
            active.total_data = Set(Some(current_total + processed_count));
            active.last_offset = Set(Some(offset + limit));
            active.updated_at = Set(Some(Local::now().naive_local()));

            active.update(&txn).await?;
        }

        txn.commit().await?;
        Ok(())
    }


    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        let id_dosen = record
            .id_dosen
            .ok_or("id_dosen is required for upsert")?;

        let id_pangkat_golongan = record.id_pangkat_golongan.ok_or("id_pangkat_golongan is required for upsert")?;

        let sync_time = Local::now().naive_local();

        // Parse dates
        let tanggal_sk_pangkat = record
            .tanggal_sk_pangkat
            .as_ref()
            .and_then(|date_str| NaiveDate::parse_from_str(date_str, "%d-%m-%Y").ok());

        let mulai_sk_pangkat = record
            .mulai_sk_pangkat
            .as_ref()
            .and_then(|date_str| NaiveDate::parse_from_str(date_str, "%d-%m-%Y").ok());

        // Parse integers
        let masa_kerja_dalam_tahun = record
            .masa_kerja_dalam_tahun
            .as_ref()
            .and_then(|s| s.parse::<i32>().ok());

        let masa_kerja_dalam_bulan = record
            .masa_kerja_dalam_bulan
            .as_ref()
            .and_then(|s| s.parse::<i32>().ok());

        let existing = riwayat_pangkat_dosen::Entity::find()
            .filter(riwayat_pangkat_dosen::Column::DeletedAt.is_null())
            .filter(riwayat_pangkat_dosen::Column::IdDosen.eq(id_dosen))
            .filter(riwayat_pangkat_dosen::Column::IdPangkatGolongan.eq(id_pangkat_golongan))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            let mut active: riwayat_pangkat_dosen::ActiveModel =
                existing_record.into_active_model();

            active.nidn = Set(record.nidn.clone());
            active.nuptk = Set(record.nuptk.clone());
            active.nama_dosen = Set(record.nama_dosen.clone());
            active.nama_pangkat_golongan = Set(record.nama_pangkat_golongan.clone());
            active.sk_pangkat = Set(record.sk_pangkat.clone());
            active.tanggal_sk_pangkat = Set(tanggal_sk_pangkat);
            active.mulai_sk_pangkat = Set(mulai_sk_pangkat);
            active.masa_kerja_dalam_tahun = Set(masa_kerja_dalam_tahun);
            active.masa_kerja_dalam_bulan = Set(masa_kerja_dalam_bulan);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            let pk_id = Uuid::new_v4();

            let new_record = riwayat_pangkat_dosen::ActiveModel {
                id: Set(pk_id),
                id_dosen: Set(Some(id_dosen)),
                nidn: Set(record.nidn.clone()),
                nuptk: Set(record.nuptk.clone()),
                nama_dosen: Set(record.nama_dosen.clone()),
                id_pangkat_golongan: Set(Some(id_pangkat_golongan)),
                nama_pangkat_golongan: Set(record.nama_pangkat_golongan.clone()),
                sk_pangkat: Set(record.sk_pangkat.clone()),
                tanggal_sk_pangkat: Set(tanggal_sk_pangkat),
                mulai_sk_pangkat: Set(mulai_sk_pangkat),
                masa_kerja_dalam_tahun: Set(masa_kerja_dalam_tahun),
                masa_kerja_dalam_bulan: Set(masa_kerja_dalam_bulan),
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
impl Task for EstimateRiwayatPangkatDosen {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetRiwayatPangkatDosen data from Feeder Dikti"
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
