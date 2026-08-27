use chrono::{DateTime, Local, NaiveDate, NaiveDateTime, Utc};
use salvo::async_trait;
use sea_orm::{
    ActiveModelTrait, ColumnTrait, DatabaseConnection, DatabaseTransaction, EntityTrait,
    IntoActiveModel, QueryFilter, Set, TransactionTrait,
};
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::models::feeder::akumulasi::estimasi as FeederAkumulasiEstimasi;
use crate::models::feeder::master::aktifitas_mengajar_dosen as aktifitas_mengajar_dosen;
use crate::tasks::feeder_dikti::downstream::feeder_request::{InputRequestData, RequestData};
use crate::tasks::Task;

// Configuration constants
const TASK_NAME: &str = "EstimateAktifitasMengajarDosen";
const API_ACTION: &str = "GetAktivitasMengajarDosen";

// API Request Configuration
const DEFAULT_LIMIT: i32 = 1000;
const DEFAULT_ORDER: &str = "id_registrasi_dosen ASC";
const DEFAULT_FILTER: &str = "";

use crate::library::deserialization::de_opt_i32;
// use chrono::NaiveDate;

#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct ModelInput {
    pub id_registrasi_dosen: Uuid,
    pub id_dosen: Uuid,
    pub nama_dosen: String,
    pub id_periode: String,
    pub nama_periode: String,
    pub id_prodi: Uuid,
    pub nama_program_studi: String,
    pub id_matkul: Uuid,
    pub nama_mata_kuliah: String,
    pub id_kelas: Uuid,
    pub nama_kelas_kuliah: String,
    #[serde(deserialize_with = "de_opt_i32")]
    pub rencana_minggu_pertemuan: Option<i32>,
    #[serde(deserialize_with = "de_opt_i32")]
    pub realisasi_minggu_pertemuan: Option<i32>,
}

pub struct EstimateAktifitasMengajarDosen;

impl EstimateAktifitasMengajarDosen {
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


    /// Upsert a single aktifitas mengajar dosen record into the database.
    ///
    /// This function performs an "upsert" operation:
    /// - If a record with the same composite key exists, it updates it
    /// - If no record exists, it inserts a new one
    ///
    /// # Parameters
    /// * `ctx` - Application context for database access
    /// * `record` - The feeder model data to upsert
    ///
    /// # Returns
    /// * `Result<String>` - "INSERTED" or "UPDATED" on success, error otherwise
    async fn upsert_record(txn: &DatabaseTransaction, record: &ModelInput) -> Result<String, Box<dyn std::error::Error + Send + Sync>> {
        // Validate that required fields exist for composite key
        let id_registrasi_dosen = record.id_registrasi_dosen;
        let id_periode = record.id_periode.clone();
        let id_prodi = record.id_prodi;
        let id_matkul = record.id_matkul;
        let id_kelas = record.id_kelas;

        // Clone values for later use in insert
        let id_periode_clone = id_periode.clone();

        // Start transaction
        let sync_time = Local::now().naive_local();

        // Check if record exists using composite key
        let existing = aktifitas_mengajar_dosen::Entity::find()
            .filter(aktifitas_mengajar_dosen::Column::DeletedAt.is_null())
            .filter(aktifitas_mengajar_dosen::Column::IdRegistrasiDosen.eq(id_registrasi_dosen))
            .filter(aktifitas_mengajar_dosen::Column::IdPeriode.eq(id_periode))
            .filter(aktifitas_mengajar_dosen::Column::IdProdi.eq(id_prodi))
            .filter(aktifitas_mengajar_dosen::Column::IdMatkul.eq(id_matkul))
            .filter(aktifitas_mengajar_dosen::Column::IdKelas.eq(id_kelas))
            .one(txn)
            .await?;

        let action = if let Some(existing_record) = existing {
            // Update existing record
            let mut active: aktifitas_mengajar_dosen::ActiveModel =
                existing_record.into_active_model();

            active.id_dosen = Set(Some(record.id_dosen));
            active.nama_dosen = Set(Some(record.nama_dosen.clone()));
            active.nama_periode = Set(Some(record.nama_periode.clone()));
            active.nama_program_studi = Set(Some(record.nama_program_studi.clone()));
            active.nama_mata_kuliah = Set(Some(record.nama_mata_kuliah.clone()));
            active.nama_kelas_kuliah = Set(Some(record.nama_kelas_kuliah.clone()));
            active.rencana_minggu_pertemuan = Set(record.rencana_minggu_pertemuan);
            active.realisasi_minggu_pertemuan = Set(record.realisasi_minggu_pertemuan);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));
            active.rencana_minggu_pertemuan = Set(record.rencana_minggu_pertemuan);
            active.realisasi_minggu_pertemuan = Set(record.realisasi_minggu_pertemuan);
            active.sync_at = Set(Some(sync_time));
            active.updated_at = Set(Some(sync_time));

            active.update(txn).await?;
            "UPDATED"
        } else {
            // Insert new record
            let pk_id = Uuid::new_v4();

            let new_record = aktifitas_mengajar_dosen::ActiveModel {
                id: Set(pk_id),
                id_registrasi_dosen: Set(Some(id_registrasi_dosen)),
                id_dosen: Set(Some(record.id_dosen)),
                nama_dosen: Set(Some(record.nama_dosen.clone())),
                id_periode: Set(Some(id_periode_clone)),
                nama_periode: Set(Some(record.nama_periode.clone())),
                id_prodi: Set(Some(id_prodi)),
                nama_program_studi: Set(Some(record.nama_program_studi.clone())),
                id_matkul: Set(Some(id_matkul)),
                nama_mata_kuliah: Set(Some(record.nama_mata_kuliah.clone())),
                id_kelas: Set(Some(id_kelas)),
                nama_kelas_kuliah: Set(Some(record.nama_kelas_kuliah.clone())),
                rencana_minggu_pertemuan: Set(record.rencana_minggu_pertemuan),
                realisasi_minggu_pertemuan: Set(record.realisasi_minggu_pertemuan),
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
impl Task for EstimateAktifitasMengajarDosen {
    fn name(&self) -> &str {
        TASK_NAME
    }

    fn description(&self) -> &str {
        "Fetch and process GetAktivitasMengajarDosen data from Feeder Dikti"
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
