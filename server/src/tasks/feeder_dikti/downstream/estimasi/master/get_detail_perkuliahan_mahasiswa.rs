use chrono::{DateTime, Local, NaiveDate, NaiveDate as Date, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ActiveValue, ActiveValue::Set, ColumnTrait, DatabaseConnection, DatabaseTransaction, DbErr, EntityTrait,
    IntoActiveModel, QueryFilter, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::perkuliahan_mahasiswa as perkuliahan_mahasiswa;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateDetailPerkuliahanMahasiswa";
const API_ACTION: &str = "GetDetailPerkuliahanMahasiswa";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "id_registrasi_mahasiswa ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::de_opt_f32;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputDetailPerkuliahanMahasiswa {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub angkatan: Option<String>,
    pub id_semester: Option<String>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub nama_semester: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ips: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_semester: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_total: Option<f32>,
    pub status_sync: Option<String>,
}

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInputListPerkuliahanMahasiswa {
    pub id_registrasi_mahasiswa: Option<Uuid>,
    pub nim: Option<String>,
    pub nama_mahasiswa: Option<String>,
    pub id_prodi: Option<Uuid>,
    pub nama_program_studi: Option<String>,
    pub angkatan: Option<String>,
    pub id_periode_masuk: Option<String>,
    pub id_semester: Option<String>,
    pub nama_semester: Option<String>,
    pub id_status_mahasiswa: Option<String>,
    pub nama_status_mahasiswa: Option<String>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ips: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub ipk: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_semester: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub sks_total: Option<f32>,
    #[serde(deserialize_with = "de_opt_f32")]
    pub biaya_kuliah_smt: Option<f32>,
    pub id_pembiayaan: Option<String>,
    pub status_sync: Option<String>,
}

pub struct EstimateDetailPerkuliahanMahasiswa;

impl EstimateDetailPerkuliahanMahasiswa {
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


    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInputDetailPerkuliahanMahasiswa) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that required fields exist - using composite key (id_registrasi_mahasiswa + id_semester)
        let id_registrasi_mahasiswa = record
            .id_registrasi_mahasiswa
            .ok_or("Missing id_registrasi_mahasiswa")?;

        let id_semester = record
            .id_semester
            .as_ref()
            .ok_or("Missing id_semester")?;

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists using composite key
        let existing = perkuliahan_mahasiswa::Entity::find()
            .filter(perkuliahan_mahasiswa::Column::DeletedAt.is_null())
            .filter(
                perkuliahan_mahasiswa::Column::IdRegistrasiMahasiswa.eq(id_registrasi_mahasiswa),
            )
            .filter(perkuliahan_mahasiswa::Column::IdSemester.eq(id_semester))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: perkuliahan_mahasiswa::ActiveModel =
                existing_record.into_active_model();

            active.id_prodi = Set(record.id_prodi);
            active.nama_program_studi = Set(record.nama_program_studi.clone());
            active.angkatan = Set(record.angkatan.clone());
            active.nim = Set(record.nim.clone());
            active.nama_mahasiswa = Set(record.nama_mahasiswa.clone());
            active.nama_semester = Set(record.nama_semester.clone());
            active.id_status_mahasiswa = Set(record.id_status_mahasiswa.clone());
            active.nama_status_mahasiswa = Set(record.nama_status_mahasiswa.clone());
            active.ips = Set(record.ips);
            active.ipk = Set(record.ipk);
            active.sks_semester = Set(record.sks_semester);
            active.sks_total = Set(record.sks_total);
            active.status_sync = Set(record.status_sync.clone());
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = perkuliahan_mahasiswa::ActiveModel {
                id: Set(pk_id),
                id_registrasi_mahasiswa: Set(Some(id_registrasi_mahasiswa)),
                nim: Set(record.nim.clone()),
                nama_mahasiswa: Set(record.nama_mahasiswa.clone()),
                angkatan: Set(record.angkatan.clone()),
                id_prodi: Set(record.id_prodi),
                nama_program_studi: Set(record.nama_program_studi.clone()),
                id_periode_masuk: Set(None), // Not in Detail API
                id_semester: Set(Some(id_semester.clone())),
                nama_semester: Set(record.nama_semester.clone()),
                id_status_mahasiswa: Set(record.id_status_mahasiswa.clone()),
                nama_status_mahasiswa: Set(record.nama_status_mahasiswa.clone()),
                ips: Set(record.ips),
                ipk: Set(record.ipk),
                sks_semester: Set(record.sks_semester),
                sks_total: Set(record.sks_total),
                biaya_kuliah_smt: Set(None), // Not in Detail API
                id_pembiayaan: Set(None),    // Not in Detail API
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

        // Commit transaction

        Ok(action.to_string())
    }


    async fn process_batch(
        db: &DatabaseConnection,
        records: &[ModelInputDetailPerkuliahanMahasiswa],
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

        let response = RequestData::get::<ModelInputDetailPerkuliahanMahasiswa>(
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
impl Task for EstimateDetailPerkuliahanMahasiswa {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetDetailPerkuliahanMahasiswa data from Feeder Dikti"
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
